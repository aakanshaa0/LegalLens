const express = require("express");
const multer = require("multer");
const { upload, handleUploadError } = require("../config/upload");
const { protect } = require("../middleware/auth");
const { validateUpload, validateDocumentId } = require("../middleware/validation");
const { addUserFile, getUserFiles, getUserFile, removeUserFile, cleanupUserDirectory, saveDocumentContent, getDocumentContent } = require("../utils/fileStorage");
const { generateId, getFileType, formatFileSize, extractTextFromFile } = require("../utils/helpers");
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const { buildIndex, retrieveTopK, loadIndex } = require('../utils/rag');

const router = express.Router();

// Simple in-memory cache for document summaries
const summaryCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour cache TTL

// Rate limiting
const rateLimit = {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // Max requests per hour per IP
  requestCounts: new Map(),
};

// Rate limiting middleware
function checkRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - rateLimit.windowMs;
  
  // Clean up old entries
  for (const [ip, { timestamp }] of rateLimit.requestCounts.entries()) {
    if (timestamp < windowStart) {
      rateLimit.requestCounts.delete(ip);
    }
  }
  
  // Check current count
  const ipData = rateLimit.requestCounts.get(ip) || { count: 0, timestamp: now };
  
  if (ipData.count >= rateLimit.maxRequests) {
    return false; // Over limit
  }
  
  // Update count
  rateLimit.requestCounts.set(ip, {
    count: ipData.count + 1,
    timestamp: now
  });
  
  return true;
}

// Initialize Gemini AI (constructor accepts only the API key)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get the generative model (use flash for better quota limits)
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash"
});

// Helper function to check if the error is a quota exceeded error
function isQuotaExceededError(error) {
  return error.status === 429 || 
         error.message.includes('quota') || 
         (error.errorDetails && error.errorDetails.some(detail => 
           detail['@type'] === 'type.googleapis.com/google.rpc.QuotaFailure'
         ));
}

// Helper function to generate an extractive paragraph summary spanning the whole document
function generateExtractiveSummary(text, targetWords = 180) {
  try {
    const cleaned = String(text || '')
      .replace(/\s+/g, ' ')
      .replace(/[\r\n]+/g, ' ')
      .trim();
    if (!cleaned) return 'Document processed successfully. Summary not available.';

    const sentences = cleaned
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 20);

    // Score sentences using keyword presence and informativeness
    const priorityKeywords = [
      'obligation','obligations','right','rights','responsibility','responsibilities','payment','fee','fees',
      'deadline','date','term','termination','expire','expiry','renewal','notice','liability','indemnity',
      'confidential','confidentiality','privacy','data','scope','deliverable','deliverables','service','services',
      'warranty','warranties','governing law','jurisdiction','dispute','arbitration','compliance','breach','penalty'
    ];

    const scored = sentences.map((s, idx) => {
      const lower = s.toLowerCase();
      const words = s.split(/\s+/).length;
      const keywordHits = priorityKeywords.reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0);
      const lengthScore = Math.min(words / 18, 1); // prefer moderately long
      const positionBoost = idx === 0 ? 0.2 : idx === sentences.length - 1 ? 0.2 : 0; // small intro/outro boost
      return { s, idx, score: keywordHits * 2 + lengthScore + positionBoost };
    });

    // Select sentences distributed across the document to avoid only first lines
    const bucketCount = 6; // spread selection across 6 segments
    const bucketSize = Math.ceil(sentences.length / bucketCount);
    const selected = [];
    for (let b = 0; b < bucketCount; b++) {
      const start = b * bucketSize;
      const end = Math.min(sentences.length, start + bucketSize);
      if (start >= sentences.length) break;
      const slice = scored.slice(start, end).sort((a, b) => b.score - a.score);
      if (slice[0]) selected.push(slice[0].s);
    }

    // Add a couple of globally top sentences not already selected
    const globalTop = scored.slice().sort((a, b) => b.score - a.score).map(x => x.s);
    for (const s of globalTop) {
      if (selected.includes(s)) continue;
      selected.push(s);
      if (selected.length >= bucketCount + 2) break;
    }

    // Compose into a single paragraph around target length
    const words = [];
    for (const s of selected) {
      const sWords = s.split(/\s+/);
      for (const w of sWords) {
        if (words.length >= targetWords) break;
        words.push(w);
      }
      if (words.length >= targetWords) break;
    }
    let paragraph = words.join(' ')
      .replace(/\s+/g, ' ')
      .replace(/\s([.,;:!?])/g, '$1');
    if (!/[.!?]$/.test(paragraph)) paragraph += '.';
    return paragraph;
  } catch (error) {
    console.error('Error in extractive summary:', error);
    return 'Document processed successfully. Summary not available.';
  }
}

// Helper function to generate summary using Gemini (with caching)
async function generateSummary(text, documentId, ip, options = {}) {
  const { fileName } = options;
  // Check cache first
  const cacheKey = `${documentId}-${ip}`;
  const cachedSummary = summaryCache.get(cacheKey);
  
  if (cachedSummary && (Date.now() - cachedSummary.timestamp) < CACHE_TTL) {
    console.log('Returning cached summary for document:', documentId);
    return cachedSummary.summary;
  }
  
  // Check rate limit
  if (!checkRateLimit(ip)) {
    console.log('Rate limit exceeded for IP:', ip);
    return generateExtractiveSummary(text);
  }
  
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY missing, using extractive summary');
      return generateExtractiveSummary(text);
    }

    // For better summaries, use a more focused approach
    const maxLength = 8000; // Reasonable limit for API
    const contentToSummarize = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    
    const documentName = fileName ? `"${fileName}"` : 'this document';
    const prompt = `Please provide a comprehensive summary of ${documentName}. 

Document content:
${contentToSummarize}

Create a well-structured summary that includes:
- Main purpose and type of document
- Key parties involved (if applicable)
- Important terms, conditions, or requirements
- Critical dates, deadlines, or timeframes
- Financial information (amounts, payments, etc.)
- Key obligations and responsibilities
- Any important legal or regulatory information

Format your response using markdown:
- Use **bold** for important terms and headings
- Use bullet points with * for lists
- Use clear paragraph breaks
- Keep it professional and easy to read`;

    console.log('Generating AI summary for document:', documentId);
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { 
        maxOutputTokens: 600, 
        temperature: 0.4,
        topP: 0.8,
        topK: 40
      }
    });
    
    if (!result || !result.response) {
      throw new Error('Invalid response from Gemini API');
    }
    
    const summary = result.response.text();
    if (!summary || summary.trim().length === 0) {
      throw new Error('Empty summary from Gemini API');
    }
    
    // Cache the summary
    summaryCache.set(cacheKey, {
      summary: summary.trim(),
      timestamp: Date.now()
    });
    
    return summary.trim();
    
  } catch (error) {
    console.error('Error in AI summary generation, falling back to extractive summary:', error);
    // Fall back to extractive summarization
    const summaryBody = generateExtractiveSummary(text);
    return summaryBody;
  }
}

// Helper function for Q&A using Gemini
async function askQuestion(question, context) {
  try {
    // Ensure context is not too long for the API
    const truncatedContext = context.length > 12000 ? context.substring(0, 12000) + '...' : context;
    
    const prompt = `You are a helpful document assistant. Answer the question based on the provided document context.

Instructions:
- Answer directly and concisely based on the document content
- If you find specific information, quote the relevant part using "quotes"
- If the information is not in the document, say "This information is not available in the document"
- Use **bold** for important terms or amounts
- Be accurate and helpful

Document Context:
${truncatedContext}

Question: ${question}

Answer:`;
    
    console.log('Generating answer with Gemini API...');
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY missing, using extractive fallback for askQuestion');
      return generateExtractiveAnswer(question, truncatedContext);
    }
    
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.3,
        topP: 0.8,
        topK: 40
      }
    });
    
    if (!result || !result.response) {
      throw new Error('Invalid response from Gemini API');
    }
    
    const responseText = result.response.text();
    if (!responseText || responseText.trim().length === 0) {
      throw new Error('Empty response from Gemini API');
    }
    
    return responseText.trim();
  } catch (error) {
    console.error('Error generating answer:', error);
    
    // Fallback: extractive answer from context (no API calls)
    const fallback = generateExtractiveAnswer(question, context);
    
    if (isQuotaExceededError(error)) {
      return `I'm currently experiencing high demand. Based on the document content: ${fallback}`;
    }
    
    return fallback;
  }
}

// Simple extractive Q&A fallback without external APIs
function generateExtractiveAnswer(question, context) {
  try {
    if (!question || !context) return 'No answer available from the provided context.';

    const q = String(question).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').trim();
    
    // Enhanced keyword detection for different types of questions
    const isDeadlineQuery = /(deadline|due\s+date|due\b|last\s+date|submission|submit|submitted\s+on|expiry|expires|expiration|valid\s+until|when)/i.test(q);
    const isAmountQuery = /(amount|cost|price|fee|payment|salary|rent|total|sum|money|dollar|\$)/i.test(q);
    const isWhoQuery = /(who|person|people|party|parties|name|contact)/i.test(q);
    const isWhatQuery = /(what|describe|definition|type|kind)/i.test(q);

    // Split context into sentences
    const sentences = String(context)
      .replace(/\s+/g, ' ')
      .split(/(?<=[.!?])\s+/)
      .filter(s => s && s.length > 10);

    // Enhanced date extraction for deadline queries
    if (isDeadlineQuery) {
      const dateRegex = /(\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t|tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4})|(\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b)|(\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b)/ig;
      const keywordRegex = /(deadline|due|expir|valid|until|before|by|end)/i;

      for (let i = 0; i < sentences.length; i++) {
        const s = sentences[i];
        if (keywordRegex.test(s)) {
          const windowText = [sentences[i - 1], s, sentences[i + 1]].filter(Boolean).join(' ');
          const dates = Array.from(windowText.matchAll(dateRegex)).map(m => m[0]);
          if (dates.length > 0) {
            return `The deadline appears to be: ${dates[0]}. Source: "${s.trim()}"`;
          }
        }
      }
    }

    // Enhanced amount extraction for financial queries
    if (isAmountQuery) {
      const amountRegex = /(\$[\d,]+(?:\.\d{2})?)|(\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars?|USD|\$))/ig;
      for (const s of sentences) {
        if (amountRegex.test(s)) {
          const amounts = Array.from(s.matchAll(amountRegex)).map(m => m[0]);
          if (amounts.length > 0) {
            return `The amount mentioned is: ${amounts[0]}. Source: "${s.trim()}"`;
          }
        }
      }
    }

    // Generic extractive scoring by term overlap with improved weighting
    const qTerms = q.split(/\s+/).filter(t => t.length > 2);
    const scored = sentences.map((s, idx) => {
      const lower = s.toLowerCase();
      let overlap = 0;
      let exactMatches = 0;
      
      for (const t of qTerms) {
        if (lower.includes(t)) {
          overlap += 1;
          // Bonus for exact word matches
          if (new RegExp(`\\b${t}\\b`).test(lower)) {
            exactMatches += 1;
          }
        }
      }
      
      const lengthPenalty = Math.max(1, s.split(/\s+/).length / 30);
      const positionBonus = idx < 3 ? 0.2 : 0; // Slight bonus for early sentences
      const structureBonus = (s.includes(':') || s.includes('•') || s.includes('-')) ? 0.3 : 0;
      
      const score = (overlap + exactMatches * 0.5) / lengthPenalty + positionBonus + structureBonus;
      return { s, idx, score };
    });

    scored.sort((a, b) => b.score - a.score || a.idx - b.idx);
    
    if (scored.length === 0 || scored[0].score === 0) {
      return 'This information is not clearly available in the provided document.';
    }

    // Take the best matching sentence(s)
    const topSentences = scored.slice(0, 2).filter(item => item.score > 0);
    const answer = topSentences.map(item => item.s.trim()).join(' ');
    
    // Limit response length
    const words = answer.split(/\s+/);
    if (words.length > 100) {
      return words.slice(0, 100).join(' ') + '...';
    }
    
    return answer;
  } catch (e) {
    console.error('Error in extractive answer generation:', e);
    return 'Unable to find a relevant answer in the document.';
  }
}

router.use(protect);

/**
 * Process an uploaded file: save to local storage, extract text, and save metadata
 * @param {Object} file - Multer file object
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Processed file information
 */
const processUploadedFile = async (file, userId) => {
  // Validate input
  if (!file || !file.buffer) {
    throw new Error('No file data received');
  }
  
  if (file.buffer.length === 0) {
    throw new Error('Uploaded file is empty');
  }
  
  // Create file info object
  const fileId = generateId();
  const fileExt = path.extname(file.originalname);
  const uniqueFilename = `${fileId}${fileExt}`;
  const uploadDir = path.join('uploads', `user-${userId}`);
  const fullUploadDir = path.join(process.cwd(), uploadDir);
  const filePath = path.join(fullUploadDir, uniqueFilename);
  
  const fileInfo = {
    id: fileId,
    originalName: file.originalname,
    fileName: uniqueFilename,
    size: file.size,
    type: getFileType(file.mimetype, file.originalname),
    mimeType: file.mimetype,
    uploadedAt: new Date().toISOString(),
    userId: userId,
    status: 'uploading',
    localPath: filePath,
    url: `/uploads/user-${userId}/${uniqueFilename}`
  };
  
  try {
    // Ensure upload directory exists
    await fs.promises.mkdir(fullUploadDir, { recursive: true });
    
    // Save the file to disk
    await fs.promises.writeFile(filePath, file.buffer);
    
    // Add file to user's file list
    await addUserFile(userId, fileInfo);
    
    // Update file status to processing
    const updatedFile = {
      ...fileInfo,
      status: 'processing'
    };
    
    // Update the file in the user's file list
    const userFiles = getUserFiles(userId);
    const fileIndex = userFiles.findIndex(f => f.id === fileId);
    if (fileIndex !== -1) {
      userFiles[fileIndex] = updatedFile;
    }
    
    // Process the file content in the background
    setTimeout(async () => {
      try {
        console.log(`\n=== Starting document processing for: ${file.originalname} (${fileId}) ===`);
        console.log(`File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
        
        // Step 1: Extract text from the saved local file
        console.log(`Extracting text from ${file.originalname}...`);
        const fileContent = await extractTextFromFile(filePath, file.mimetype);
        
        if (!fileContent || typeof fileContent !== 'string') {
          throw new Error(`Failed to extract text from document. Content type: ${typeof fileContent}`);
        }
        
        console.log(`✅ Successfully extracted ${fileContent.length} characters`);
        
        // Step 2: Save the extracted content
        console.log(`Saving document content...`);
        await saveDocumentContent(userId, fileId, fileContent);
        // Build retrieval index for Q&A (non-blocking best-effort)
        try {
          await buildIndex(userId, fileId, fileContent);
          console.log('✅ Retrieval index built for document:', fileId);
        } catch (idxErr) {
          console.warn('⚠️ Failed to build retrieval index:', idxErr.message);
        }
        
        // Step 3: Generate a summary of the document
        console.log(`Generating summary...`);
        let summary = '';
        try {
          summary = await generateSummary(fileContent, fileId, userId, { fileName: file.originalname });
          console.log(`✅ Successfully generated summary (${summary.length} chars)`);
        } catch (summaryError) {
          console.error('⚠️ Error generating AI summary, using extractive fallback:', summaryError.message);
          // Fallback to extractive summary if generative summary fails
          summary = generateExtractiveSummary(fileContent);
        }
        
        // Step 4: Update file status to completed with all metadata
        const completedFile = {
          ...updatedFile,
          status: 'completed',
          contentLength: fileContent.length,
          summary: summary,
          processedAt: new Date().toISOString(),
          hasContent: true
        };
        
        // Update the file in the user's file list
        const userFiles = getUserFiles(userId);
        if (!userFiles) {
          console.error('❌ User files not found for user:', userId);
          return;
        }
        
        const fileIndex = userFiles.findIndex(f => f.id === fileId);
        if (fileIndex !== -1) {
          userFiles[fileIndex] = completedFile;
          console.log(`✅ Successfully updated file metadata for: ${fileId}`);
        } else {
          console.error(`❌ File ${fileId} not found in user's file list`);
        }
        
        console.log(`✅ Successfully processed document: ${file.originalname} (${fileId})`);
      } catch (processingError) {
        console.error('❌ Error processing document:', processingError);
        
        // Update file status to error
        const errorFile = {
          ...updatedFile,
          status: 'error',
          error: processingError.message,
          processedAt: new Date().toISOString()
        };
        
        // Update the file in the user's file list
        const userFiles = getUserFiles(userId);
        if (userFiles) {
          const fileIndex = userFiles.findIndex(f => f.id === fileId);
          if (fileIndex !== -1) {
            userFiles[fileIndex] = errorFile;
          }
        }
      }
    }, 0);
    
    return updatedFile;
  } catch (error) {
    console.error('Error in processUploadedFile:', error);
    
    // Clean up the temporary file in case of error
    if (file.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up temporary file:', cleanupError);
      }
    }
    
    // Update file status to error
    const errorFile = {
      ...fileInfo,
      status: 'error',
      error: error.message,
      processedAt: new Date().toISOString()
    };
    
    // Update the file in the user's file list
    const userFiles = getUserFiles(userId);
    const fileIndex = userFiles.findIndex(f => f.id === fileId);
    if (fileIndex !== -1) {
      userFiles[fileIndex] = errorFile;
    }
    
    throw error;
  }
};

// Configure multer with memory storage and file size limits
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Check file types
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/rtf',
      'application/json',
      'text/markdown'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`), false);
    }
  }
});

// Upload a new document
router.post("/upload", memoryUpload.single("document"), handleUploadError, validateUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: "NO_FILE_UPLOADED",
        message: "No file was uploaded"
      });
    }

    console.log(`Starting file upload for user: ${req.user.id}`);
    console.log(`File details: ${req.file.originalname} (${req.file.size} bytes)`);

    // Process the uploaded file
    const savedFile = await processUploadedFile(req.file, req.user.id);
    
    // Prepare response
    const response = {
      id: savedFile.id,
      name: savedFile.originalName,
      size: savedFile.size,
      formattedSize: formatFileSize(savedFile.size),
      type: savedFile.type,
      mimeType: savedFile.mimeType || req.file.mimetype,
      uploadedAt: savedFile.uploadedAt,
      status: savedFile.status || 'processing',
      url: savedFile.url || null,
      localPath: savedFile.localPath ? path.relative(process.cwd(), savedFile.localPath) : null,
      contentLength: savedFile.contentLength || 0
    };

    res.status(201).json({
      success: true,
      message: "File uploaded and processing started",
      file: response
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Determine appropriate status code and error message
    let statusCode = 500;
    let errorCode = 'upload_failed';
    let errorMessage = 'Failed to process the uploaded file';
    
    // Handle specific error cases
    if (error.message.includes('unsupported file format') || 
        error.message.includes('invalid file type') ||
        error.message.includes('file extension')) {
      statusCode = 400;
      errorCode = 'invalid_file_type';
      errorMessage = error.message;
    } else if (error.message.includes('file size') || error.message.includes('too large')) {
      statusCode = 413;
      errorCode = 'file_too_large';
      errorMessage = 'The uploaded file is too large. Maximum size is 25MB.';
    } else if (error.message.includes('quota') || error.message.includes('limit exceeded')) {
      statusCode = 429;
      errorCode = 'quota_exceeded';
      errorMessage = 'Upload quota exceeded. Please try again later or contact support.';
    } else if (error.code === 'ENOENT' || error.message.includes('ENOENT')) {
      errorMessage = 'File system error. Please try again.';
    }
    
    // Clean up the uploaded file in case of error
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file after error:', cleanupError);
      }
    }
    
    // Send error response
    res.status(statusCode).json({ 
      success: false,
      error: errorCode,
      message: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { 
        details: error.message,
        stack: error.stack 
      })
    });
  }
});

// Get all documents for the authenticated user
router.get("/", async (req, res) => {
  try {
    console.log(`Fetching documents for user: ${req.user.id}`);
    
    // Get user files
    const userFiles = getUserFiles(req.user.id);
    console.log(`Found ${userFiles ? userFiles.length : 0} files for user ${req.user.id}`);
    
    if (!userFiles || userFiles.length === 0) {
      console.log('No files found for user, returning empty array');
      return res.json([]);
    }
    
    // Map files to response format
    const files = userFiles.map(file => {
      const fileData = {
        id: file.id,
        name: file.originalName || file.name || 'Untitled',
        size: file.size || 0,
        type: file.type || 'unknown',
        mimeType: file.mimeType || 'application/octet-stream',
        uploadedAt: file.uploadedAt || new Date().toISOString(),
        status: file.status || 'unknown',
        url: file.url || null,
        localPath: file.localPath || null,
        hasContent: !!file.hasContent,
        contentLength: file.contentLength || 0
      };
      
      console.log(`File ${fileData.id}: ${fileData.name} (${fileData.status})`);
      return fileData;
    });
    
    console.log(`Returning ${files.length} files`);
    res.json(files);
  } catch (error) {
    console.error('Error fetching files:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({ 
      success: false,
      error: 'FAILED_TO_FETCH_FILES',
      message: 'Failed to fetch files',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete a document
router.delete("/:id", validateDocumentId, async (req, res) => {
  try {
    const file = getUserFile(req.user.id, req.params.id);
    if (!file) {
      return res.status(404).json({ 
        success: false,
        error: "FILE_NOT_FOUND",
        message: "The file you are trying to delete does not exist"
      });
    }
    
    // Delete the file and its metadata
    const success = await removeUserFile(req.user.id, req.params.id);
    
    if (!success) {
      return res.status(500).json({
        success: false,
        error: "DELETE_FAILED",
        message: "Failed to delete the file"
      });
    }
    
    res.json({ 
      success: true, 
      message: "File deleted successfully",
      data: {
        id: req.params.id,
        deleted: true,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ 
      success: false,
      error: "INTERNAL_SERVER_ERROR",
      message: "An error occurred while deleting the file",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get a specific document by ID
router.get("/:id", validateDocumentId, async (req, res) => {
  try {
    const file = getUserFile(req.user.id, req.params.id);
    if (!file) {
      return res.status(404).json({ 
        success: false,
        error: "FILE_NOT_FOUND",
        message: "The requested file was not found"
      });
    }
    
    // Get file content if available
    let content = null;
    try {
      content = await getDocumentContent(req.user.id, file.id);
    } catch (error) {
      console.warn(`Could not load content for file ${file.id}:`, error.message);
      // Continue without content if it can't be loaded
    }
    
    // Prepare response
    const response = {
      id: file.id,
      name: file.originalName || file.name,
      size: file.size,
      type: file.type,
      mimeType: file.mimeType,
      uploadedAt: file.uploadedAt,
      status: file.status || 'completed',
      url: file.url || null,
      localPath: file.localPath ? path.relative(process.cwd(), file.localPath) : null,
      content: content,
      hasContent: !!content,
      contentLength: content ? content.length : 0
    };
    
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ 
      success: false,
      error: 'FAILED_TO_FETCH_FILE',
      message: 'Failed to fetch file',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get document content
router.get("/:id/content", validateDocumentId, async (req, res) => {
  try {
    const file = getUserFile(req.user.id, req.params.id);
    if (!file) {
      return res.status(404).json({
        success: false,
        error: "FILE_NOT_FOUND",
        message: "The requested file was not found"
      });
    }
    
    let content;
    try {
      content = await getDocumentContent(req.user.id, req.params.id);
      if (!content) {
        // If content is not in the database, try to extract from the file
        if (file.localPath && fs.existsSync(file.localPath)) {
          console.log('Content not found in database, extracting from file:', file.localPath);
          content = await extractTextFromFile(file.localPath, file.mimeType);
          
          // Save the extracted content for future use
          if (content) {
            await saveDocumentContent(req.user.id, req.params.id, content);
          }
        }
        
        if (!content) {
          return res.status(404).json({
            success: false,
            error: "CONTENT_NOT_FOUND",
            message: "Document content is not available"
          });
        }
      }
      
      res.json({
        success: true,
        data: { content }
      });
    } catch (extractError) {
      console.error('Error extracting document content:', extractError);
      throw new Error('Failed to extract document content');
    }
  } catch (error) {
    console.error('Error getting document content:', error);
    res.status(500).json({
      success: false,
      error: "FAILED_TO_RETRIEVE_CONTENT",
      message: "Failed to retrieve document content",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get or generate a summary for a document
router.get("/:id/summary", validateDocumentId, async (req, res) => {
  try {
    const documentId = req.params.id;
    const userId = req.user.id;
    
    const file = getUserFile(userId, documentId);
    if (!file) {
      return res.status(404).json({ 
        success: false,
        error: "FILE_NOT_FOUND",
        message: "The requested document was not found"
      });
    }

    // If document is still processing
    if (file.status === 'processing') {
      return res.status(400).json({
        success: false,
        error: "DOCUMENT_PROCESSING",
        message: "Document is still being processed. Please try again in a few moments.",
        status: 'processing'
      });
    }
    
    // If document processing failed
    if (file.status === 'error') {
      return res.status(400).json({
        success: false,
        error: "DOCUMENT_PROCESSING_FAILED",
        message: "Document processing failed. Please try uploading the document again.",
        details: file.error,
        status: 'error'
      });
    }
    
    // Return cached summary if available
    if (file.summary) {
      return res.json({ 
        success: true,
        data: { 
          summary: file.summary,
          isCached: true
        }
      });
    }

    // Get the document content
    let documentContent;
    try {
      documentContent = await getDocumentContent(userId, documentId);
      
      // If content is not found in the database, try to extract from local file
      if (!documentContent && file.localPath && fs.existsSync(file.localPath)) {
        console.log('Content not found in database, extracting from local file:', file.localPath);
        documentContent = await extractTextFromFile(file.localPath, file.mimeType);
        
        // Save the extracted content for future use
        if (documentContent) {
          await saveDocumentContent(userId, documentId, documentContent);
        }
      }
      
      if (!documentContent) {
        return res.status(400).json({
          success: false,
          error: "CONTENT_NOT_AVAILABLE",
          message: "Document content is not available for summarization"
        });
      }
      
      // Ensure retrieval index exists (build on-demand for existing documents)
      try {
        const existingIndex = await loadIndex(userId, documentId);
        if (!existingIndex) {
          await buildIndex(userId, documentId, documentContent);
          console.log('Built retrieval index on-demand for summary:', documentId);
        }
      } catch (idxErr) {
        console.warn('Index ensure failed (summary path):', idxErr.message);
      }

      // Generate summary using AI
      const summary = await generateSummary(documentContent, documentId, req.ip, { fileName: file.originalName || file.name });
      
      // Update the file with the generated summary
      const userFiles = getUserFiles(userId);
      const fileIndex = userFiles.findIndex(f => f.id === documentId);
      if (fileIndex !== -1) {
        userFiles[fileIndex].summary = summary;
      }
      
      return res.json({
        success: true,
        data: {
          summary,
          isCached: false
        }
      });
      
    } catch (contentError) {
      console.error('Error processing document content:', contentError);
      
      // If there was an error with the AI summary, try to return an extractive summary
      try {
        const content = await getDocumentContent(userId, documentId);
        if (content) {
          const extractiveSummary = generateExtractiveSummary(content);
          return res.json({ 
            success: true,
            data: {
              summary: extractiveSummary,
              isExtractive: true,
              warning: "AI-generated summary unavailable. Showing extractive summary instead."
            }
          });
        }
      } catch (fallbackError) {
        console.error('Fallback summary generation failed:', fallbackError);
      }
      
      throw new Error('Failed to process document content for summarization');
    }
    
  } catch (error) {
    console.error('Error in summary endpoint:', error);
    
    // If we have a specific error from the try block, use that
    if (error.message === 'Failed to process document content for summarization') {
      return res.status(500).json({
        success: false,
        error: 'SUMMARIZATION_FAILED',
        message: 'Failed to generate document summary',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // Generic error handler for any other errors
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred while processing your request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Ask a question about a document
router.post("/:id/ask", validateDocumentId, async (req, res) => {
  try {
    const documentId = req.params.id;
    const userId = req.user.id;
    const { question } = req.body;
    
    if (!question || typeof question !== 'string' || question.trim() === '') {
      return res.status(400).json({
        success: false,
        error: "INVALID_QUESTION",
        message: "Please provide a valid question"
      });
    }
    
    // Small-talk / system intents (no document needed)
    const qLower = String(question).toLowerCase().trim();
    if (/^(hi|hello|hey|hola|namaste)[!.\s]*$/.test(qLower)) {
      return res.json({ success: true, data: { response: 'Hello! How can I help you with your document?', type: 'greeting' } });
    }
    if (/who\s+are\s+you\??/.test(qLower)) {
      return res.json({ success: true, data: { response: 'I am the LegalLens assistant bot. Ask me anything about your document.', type: 'identity' } });
    }
    
    // Get the document
    const file = getUserFile(userId, documentId);
    if (!file) {
      return res.status(404).json({
        success: false,
        error: "DOCUMENT_NOT_FOUND",
        message: "The requested document was not found"
      });
    }
    
    // Get the document content
    let content;
    try {
      content = await getDocumentContent(userId, documentId);
      
      // If content is not found in the database, try to extract from local file
      if (!content && file.localPath && fs.existsSync(file.localPath)) {
        console.log('Content not found in database, extracting from local file:', file.localPath);
        content = await extractTextFromFile(file.localPath, file.mimeType);
        
        // Save the extracted content for future use
        if (content) {
          await saveDocumentContent(userId, documentId, content);
        }
      }
      
      if (!content) {
        return res.status(400).json({
          success: false,
          error: "CONTENT_NOT_AVAILABLE",
          message: "Document content is not available for analysis"
        });
      }
      
      // Do not auto-return summaries; always run QnA over retrieved context

      // Use RAG to retrieve relevant context for better Q&A
      let finalContext = content;
      try {
        // Try to use RAG retrieval for better context
        const retrievedContext = await retrieveTopK(userId, documentId, question, 4);
        if (retrievedContext && retrievedContext.trim().length > 0) {
          finalContext = retrievedContext;
          console.log(`QnA context chosen: RAG_RETRIEVED length=${finalContext?.length || 0}`);
        } else {
          // Fallback to truncated full content if RAG fails
          finalContext = content.length > 8000 ? content.substring(0, 8000) + '...' : content;
          console.log(`QnA context chosen: TRUNCATED_FULL length=${finalContext?.length || 0}`);
        }
      } catch (ragError) {
        console.warn('RAG retrieval failed, using truncated content:', ragError.message);
        finalContext = content.length > 8000 ? content.substring(0, 8000) + '...' : content;
        console.log(`QnA context chosen: FALLBACK_TRUNCATED length=${finalContext?.length || 0}`);
      }

      // Otherwise, generate response using AI with fallback
      const response = await askQuestion(question, finalContext);
      
      // Create analysis record
      const analysisId = generateId();
      const analysis = {
        id: analysisId,
        documentId,
        documentName: file.originalName || file.name,
        question,
        response,
        timestamp: new Date().toISOString(),
        userId
      };
      
      // Save analysis to user's analyses (you'll need to implement saveAnalysis function)
      // saveAnalysis(userId, analysis);
      
      // Return the analysis
      return res.json({
        success: true,
        data: analysis
      });
      
    } catch (contentError) {
      console.error('Error processing document content for question:', contentError);
      throw new Error('Failed to process document content for question answering');
    }
    
  } catch (error) {
    console.error('Error in ask endpoint:', error);
    
    // Handle rate limiting specifically
    if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('rate limit')) {
      return res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded for the AI service. Please try again later.'
      });
    }
    
    // Handle specific error from content processing
    if (error.message === 'Failed to process document content for question answering') {
      return res.status(500).json({
        success: false,
        error: 'DOCUMENT_PROCESSING_ERROR',
        message: 'Error generating response',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // Generic error handler
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Error generating response',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Summarize multiple documents
router.post("/summaries", async (req, res) => {
  try {
    const userId = req.user.id;
    const { documentIds, strategy = 'stuff' } = req.body || {};

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_INPUT',
        message: 'Please provide an array of documentIds to summarize'
      });
    }

    // Load contents for each document (with extraction fallback)
    const contents = [];
    for (const id of documentIds) {
      const file = getUserFile(userId, id);
      if (!file) {
        continue;
      }
      let content = await getDocumentContent(userId, id);
      if (!content && file.localPath && fs.existsSync(file.localPath)) {
        try {
          content = await extractTextFromFile(file.localPath, file.mimeType);
          if (content) {
            await saveDocumentContent(userId, id, content);
          }
        } catch (e) {
          console.warn(`Failed to extract content for ${id}:`, e.message);
        }
      }
      if (content) contents.push(content);
    }

    if (contents.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'NO_CONTENT',
        message: 'No document content available to summarize'
      });
    }

    // Apply strategy
    let finalSummary;
    if (strategy === 'map-reduce') {
      // Map: summarize each document individually (use fast extractive summary as map step to save tokens)
      const partials = await Promise.all(
        contents.map(text => generateSummary(text, `map-${generateId()}`, req.ip))
      );

      // Reduce: summarize the combined summaries
      const combined = partials.join('\n\n');
      finalSummary = await generateSummary(combined, `reduce-${generateId()}`, req.ip);
    } else {
      // Stuff: concatenate all docs and summarize once
      const joined = contents.join('\n\n');
      finalSummary = await generateSummary(joined, `stuff-${generateId()}`, req.ip);
    }

    return res.json({
      success: true,
      data: {
        summary: finalSummary,
        strategy,
        documentsSummarized: contents.length
      }
    });
  } catch (error) {
    console.error('Error summarizing documents:', error);
    return res.status(500).json({
      success: false,
      error: 'FAILED_TO_SUMMARIZE',
      message: 'Failed to summarize documents',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
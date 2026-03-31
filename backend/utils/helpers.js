const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const { promisify } = require('util');
const stream = require('stream');
const pdfLib = require('pdf-parse');
const mammoth = require('mammoth');
const { Readable } = require('stream');
const pipeline = promisify(stream.pipeline);

// Helper function to download a file from URL to a buffer
async function downloadFileToBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download file: ${response.statusCode} ${response.statusMessage}`));
      }
      
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

// Helper function to get a readable stream from a buffer
function bufferToStream(buffer) {
  const readable = new Readable();
  readable._read = () => {}; // _read is required but we can noop it
  readable.push(buffer);
  readable.push(null);
  return readable;
}

// Helper function to extract text from PDF buffer or stream
async function extractTextFromPdf(input) {
  try {
    let data;
    if (Buffer.isBuffer(input)) {
      data = await pdfLib(input);
    } else if (typeof input === 'string') {
      // If it's a URL, download it first
      const buffer = await downloadFileToBuffer(input);
      data = await pdfLib(buffer);
    } else if (input.pipe) {
      // If it's a stream
      data = await pdfLib(input);
    } else {
      throw new Error('Unsupported input type for PDF extraction');
    }
    return data.text || '';
  } catch (error) {
    console.error('Error in PDF text extraction:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

const FILE_TYPE_LABELS = {
  'application/pdf': 'PDF',
  'text/plain': 'Text',
  'application/msword': 'Word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
  'application/vnd.ms-excel': 'Excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
  'text/csv': 'CSV',
  'application/rtf': 'Rich Text',
  'application/json': 'JSON'
};

// Supported MIME types for text extraction
const SUPPORTED_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/markdown',
  'text/csv',
  'application/json'
]);

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getFileType(mimetype) {
  return FILE_TYPE_LABELS[mimetype] || 'Unknown';
}

function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '0 Bytes';
  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${Math.round(value * 100) / 100} ${units[i]}`;
}

/**
 * Extract text from a file or URL based on its MIME type
 * @param {string|Buffer} fileInput - Path to the file, URL, or file buffer
 * @param {string} mimeType - MIME type of the file
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.isUrl] - Whether the input is a URL
 * @returns {Promise<string>} Extracted text content
 */
async function extractTextFromFile(fileInput, mimeType, options = {}) {
  const { isUrl = false } = options;
  let fileBuffer;
  let filePath;
  
  try {
    // Validate input parameters
    if (!fileInput) {
      throw new Error('File input is required');
    }
    
    // Handle different input types
    if (isUrl || (typeof fileInput === 'string' && (fileInput.startsWith('http://') || fileInput.startsWith('https://')))) {
      // Handle URL input (download to buffer)
      const url = fileInput;
      console.log(`Downloading file from URL: ${url}`);
      fileBuffer = await downloadFileToBuffer(url);
    } else if (Buffer.isBuffer(fileInput)) {
      // Handle buffer input
      fileBuffer = fileInput;
    } else if (typeof fileInput === 'string') {
      // Handle file path input
      filePath = path.resolve(fileInput);
      if (!(await fs.stat(filePath).then(s => s.isFile()).catch(() => false))) {
        throw new Error(`File not found: ${filePath}`);
      }
      fileBuffer = await fs.readFile(filePath);
    } else {
      throw new Error('Unsupported input type');
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('File is empty');
    }

    // Determine file type from MIME type or file extension
    const fileType = mimeType || (filePath ? path.extname(filePath).toLowerCase().slice(1) : '') || 'pdf';
    
    // Process based on file type
    switch (fileType.toLowerCase()) {
      case 'application/pdf':
      case 'pdf':
        return await extractTextFromPdf(fileBuffer);
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'docx':
        // Use mammoth to extract text from DOCX files
        const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
        return docxResult.value;
      
      case 'text/plain':
      case 'txt':
      case 'md':
      case 'markdown':
        return fileBuffer.toString('utf-8');
      
      default:
        // Try to extract text as plain text as a fallback
        try {
          return fileBuffer.toString('utf-8');
        } catch (e) {
          throw new Error(`Unsupported file type: ${fileType}`);
        }
    }
  } catch (error) {
    console.error(`Error extracting text from file (${mimeType}):`, error);
    
    // Provide more user-friendly error messages
    let errorMessage = 'Failed to process the document';
    if (error.message.includes('unsupported file format') || 
        error.message.includes('Invalid PDF structure')) {
      errorMessage = 'The file appears to be corrupted or in an unsupported format';
    } else if (error.message.includes('File is empty')) {
      errorMessage = 'The file is empty';
    } else if (error.message.includes('File type') || error.message.includes('Unsupported')) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  } finally {
    // Clear the buffer reference to free memory
    fileBuffer = null;
  }
}

module.exports = {
  generateId,
  getFileType,
  formatFileSize,
  extractTextFromFile,
  SUPPORTED_TYPES: new Set(Array.from(SUPPORTED_TYPES)) // Export a copy of the set
};
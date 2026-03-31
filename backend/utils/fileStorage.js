const fs = require("fs");
const path = require("path");
const fsPromises = fs.promises;

// In-memory storage for user files (in production, use a database)
let userFiles = {};

// Helper: path to user's uploads dir and files metadata JSON
const getUserUploadsDir = (userId) => path.join(process.cwd(), 'uploads', `user-${userId}`);
const getUserFilesPath = (userId) => path.join(getUserUploadsDir(userId), 'files.json');

/**
 * Ensure a user's file list exists
 * @param {string} userId - The user's ID
 * @returns {Array} The user's file list
 */
function ensureUserFiles(userId) {
  if (!userFiles[userId]) {
    // Try to load from disk if available
    try {
      const filesPath = getUserFilesPath(userId);
      if (require('fs').existsSync(filesPath)) {
        const raw = require('fs').readFileSync(filesPath, 'utf-8');
        const parsed = JSON.parse(raw);
        userFiles[userId] = Array.isArray(parsed) ? parsed : [];
      } else {
        userFiles[userId] = [];
      }
    } catch (e) {
      console.warn(`Failed to load files.json for user ${userId}:`, e.message);
      userFiles[userId] = [];
    }
  }
  return userFiles[userId];
}

// In-memory storage for document contents (in production, use a database)
const documentContents = new Map();

// Track uploads in progress to prevent duplicate uploads
const uploadsInProgress = new Map();

// Maximum file size for uploads (25MB)
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

/**
 * Get the local storage path for a user's uploads
 * @param {string} userId - The user's ID
 * @returns {string} The local storage path
 */
// moved above so it can be used by ensureUserFiles

/**
 * Add a file to the user's file list and save to local storage if needed
 * @param {string} userId - The user's ID
 * @param {Object} fileInfo - File information
 * @returns {Promise<Object>} The saved file info
 */
async function addUserFile(userId, fileInfo) {
  // Validate input
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  if (!fileInfo || typeof fileInfo !== 'object') {
    throw new Error('Invalid file information');
  }
  
  // Initialize user's file array if it doesn't exist
  if (!userFiles[userId]) {
    userFiles[userId] = [];
  }
  
  const uploadId = `${userId}-${fileInfo.id || Date.now()}`;
  
  try {
    // If file is being uploaded (has a path), save it to local storage
    if (fileInfo.path && fs.existsSync(fileInfo.path)) {
      // Check if this file is already being uploaded
      if (uploadsInProgress.has(uploadId)) {
        throw new Error('File upload already in progress');
      }
      
      // Check file size
      const stats = fs.statSync(fileInfo.path);
      if (stats.size > MAX_FILE_SIZE) {
        throw new Error(`File size (${formatFileSize(stats.size)}) exceeds maximum allowed size (25MB)`);
      }
      
      // Mark upload as in progress
      uploadsInProgress.set(uploadId, true);
      
      try {
        // Ensure user's upload directory exists
        const userDir = getUserUploadsDir(userId);
        await fsPromises.mkdir(userDir, { recursive: true });
        
        // Create a unique filename to prevent conflicts
        const fileExt = path.extname(fileInfo.originalname || 'file');
        const uniqueFilename = `${fileInfo.id || Date.now()}${fileExt}`;
        const destinationPath = path.join(userDir, uniqueFilename);
        
        // Move the file to the user's upload directory
        await fsPromises.rename(fileInfo.path, destinationPath);
        
        // Update file info with local storage data (store absolute path)
        fileInfo.localPath = destinationPath;
        fileInfo.url = `/uploads/user-${userId}/${uniqueFilename}`;
        fileInfo.bytes = stats.size;
        fileInfo.uploadedAt = new Date().toISOString();
        
        // Add file to user's file list
        ensureUserFiles(userId).push(fileInfo);
        // Persist to disk
        try {
          const filesPath = getUserFilesPath(userId);
          await fsPromises.mkdir(path.dirname(filesPath), { recursive: true });
          await fsPromises.writeFile(filesPath, JSON.stringify(userFiles[userId], null, 2));
        } catch (persistErr) {
          console.warn('Failed to persist files.json:', persistErr.message);
        }
        
        return { ...fileInfo };
      } finally {
        // Remove from in-progress tracking
        uploadsInProgress.delete(uploadId);
      }
    } else {
      // For files without a path (metadata only)
      ensureUserFiles(userId).push(fileInfo);
      // Persist to disk
      try {
        const filesPath = getUserFilesPath(userId);
        await fsPromises.mkdir(path.dirname(filesPath), { recursive: true });
        await fsPromises.writeFile(filesPath, JSON.stringify(userFiles[userId], null, 2));
      } catch (persistErr) {
        console.warn('Failed to persist files.json:', persistErr.message);
      }
      return { ...fileInfo };
    }
  } catch (error) {
    console.error('Error in addUserFile:', error);
    
    // Clean up in case of error
    if (fileInfo.path && fs.existsSync(fileInfo.path)) {
      try {
        fs.unlinkSync(fileInfo.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file after error:', cleanupError);
      }
    }
    
    // Re-throw with additional context
    const uploadError = new Error(`Failed to add file: ${error.message}`);
    uploadError.code = error.code || 'FILE_UPLOAD_ERROR';
    throw uploadError;
  }
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get all files for a user
function getUserFiles(userId) {
  if (!userId) {
    console.error('No user ID provided to getUserFiles');
    return [];
  }
  return ensureUserFiles(userId);
}

function getUserFile(userId, fileId) {
  const files = ensureUserFiles(userId);
  if (!files || files.length === 0) return null;
  return files.find(file => file.id === fileId) || null;
}

async function removeUserFile(userId, fileId) {
  if (!userFiles[userId]) return false;
  
  const index = userFiles[userId].findIndex(file => file.id === fileId);
  if (index !== -1) {
    const file = userFiles[userId][index];
    
    try {
      // Delete local file if it exists
      if (file.localPath && fs.existsSync(file.localPath)) {
        await fsPromises.unlink(file.localPath);
      }
      
      // Remove document content
      await removeDocumentContent(userId, fileId);
      
      // Remove from user files
      userFiles[userId].splice(index, 1);
      // Persist to disk
      try {
        const filesPath = getUserFilesPath(userId);
        await fsPromises.writeFile(filesPath, JSON.stringify(userFiles[userId], null, 2));
      } catch (persistErr) {
        console.warn('Failed to persist files.json after delete:', persistErr.message);
      }
      return true;
    } catch (error) {
      console.error('Error removing file:', error);
      throw new Error('Failed to remove file');
    }
  }
  return false;
}

async function cleanupUserDirectory(userId) {
  try {
    const userDir = getUserUploadsDir(userId);
    if (fs.existsSync(userDir)) {
      // Remove the directory and all its contents
      await fsPromises.rm(userDir, { recursive: true, force: true });
    }
    return true;
  } catch (error) {
    console.error(`Error cleaning up directory for user ${userId}:`, error);
    throw new Error('Failed to clean up user directory');
  }
}

// Save document content to storage
async function saveDocumentContent(userId, documentId, content) {
  if (!userId || !documentId || !content) {
    console.error('Missing required parameters for saveDocumentContent:', { 
      userId, 
      documentId, 
      hasContent: !!content 
    });
    throw new Error('Missing required parameters');
  }

  const contentKey = `${userId}-${documentId}`;
  
  try {
    console.log(`Saving content for document ${documentId}, length: ${content.length} chars`);
    
    // Store in memory
    documentContents.set(contentKey, content);
    // Persist to local file so it survives restarts
    try {
      const userDir = getUserUploadsDir(userId);
      await fsPromises.mkdir(userDir, { recursive: true });
      const contentPath = path.join(userDir, `content-${documentId}.txt`);
      await fsPromises.writeFile(contentPath, content, 'utf-8');
    } catch (persistErr) {
      console.warn('Failed to persist document content to disk:', persistErr.message);
    }
    
    // Also update the file's status in the user's file list
    if (userFiles[userId]) {
      const fileIndex = userFiles[userId].findIndex(file => file.id === documentId);
      if (fileIndex !== -1) {
        userFiles[userId][fileIndex] = {
          ...userFiles[userId][fileIndex],
          hasContent: true,
          contentLength: content.length,
          processedAt: new Date().toISOString()
        };
      }
    }
    
    console.log(`Successfully saved content for document ${documentId}`);
    return true;
  } catch (error) {
    console.error('Error saving document content:', error);
    throw new Error(`Failed to save document content: ${error.message}`);
  }
}

// Get document content from storage
async function getDocumentContent(userId, documentId) {
  if (!userId || !documentId) {
    console.error('Missing required parameters for getDocumentContent:', { userId, documentId });
    return null;
  }

  const contentKey = `${userId}-${documentId}`;
  
  try {
    // Try to get from memory first
    if (documentContents.has(contentKey)) {
      const content = documentContents.get(contentKey);
      console.log(`Retrieved content for document ${documentId} from memory, length: ${content?.length || 0} chars`);
      return content;
    }
    
    // If not in memory, try disk first
    const diskPath = path.join(getUserUploadsDir(userId), `content-${documentId}.txt`);
    if (require('fs').existsSync(diskPath)) {
      try {
        const diskContent = await fs.readFile(diskPath, 'utf-8');
        if (diskContent) {
          documentContents.set(contentKey, diskContent);
          return diskContent;
        }
      } catch (e) {
        console.warn('Failed to read content from disk:', e.message);
      }
    }

    // If not in memory or disk, try to get from the file object
    const file = getUserFile(userId, documentId);
    if (!file) {
      console.error(`Document ${documentId} not found for user ${userId}`);
      return null;
    }
    
    // If the file has a contentUrl, try to fetch from there
    if (file.contentUrl) {
      try {
        console.log(`Fetching content from URL: ${file.contentUrl}`);
        const response = await fetch(file.contentUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch document content: ${response.statusText}`);
        }
        
        const content = await response.text();
        
        // Cache in memory for future access
        documentContents.set(contentKey, content);
        return content;
      } catch (fetchError) {
        console.error('Error fetching document content:', fetchError);
      }
    }
    
    // If we get here, we couldn't find the content
    console.error(`No content found for document ${documentId}`);
    return null;
  } catch (error) {
    console.error('Error in getDocumentContent:', error);
    return null;
  }
}

// Clean up document content when a file is deleted
async function removeDocumentContent(userId, documentId) {
  try {
    // Remove from memory cache
    const memoryKey = `${userId}-${documentId}`;
    documentContents.delete(memoryKey);
    
    // Fallback to local file system cleanup
    const contentPath = path.join('uploads', `user-${userId}`, `content-${documentId}.txt`);
    if (fs.existsSync(contentPath)) {
      await fsPromises.unlink(contentPath);
    }
    
    return true;
  } catch (error) {
    console.error('Error removing document content:', error);
    throw error;
  }
}

module.exports = {
  addUserFile,
  getUserFiles,
  getUserFile,
  removeUserFile,
  cleanupUserDirectory,
  saveDocumentContent,
  getDocumentContent,
  removeDocumentContent
};
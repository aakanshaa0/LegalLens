const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Safely creates a directory if it doesn't exist
 * @param {string} dirPath - Path to the directory
 * @returns {string} The normalized directory path
 */
const ensureDirectoryExists = (dirPath) => {
  const normalizedPath = path.normalize(dirPath);
  
  // Prevent directory traversal
  if (normalizedPath.indexOf(process.cwd()) !== 0) {
    throw new Error('Invalid directory path');
  }
  
  if (!fs.existsSync(normalizedPath)) {
    fs.mkdirSync(normalizedPath, { recursive: true, mode: 0o755 });
  }
  
  return normalizedPath;
};

/**
 * Sanitizes a filename to prevent directory traversal and other security issues
 * @param {string} filename - The original filename
 * @returns {string} Sanitized filename
 */
const sanitizeFilename = (filename) => {
  if (!filename) return '';
  
  // Remove any path traversal attempts
  const basename = path.basename(filename);
  
  // Replace any non-alphanumeric, hyphen, underscore, or dot with underscore
  return basename.replace(/[^a-zA-Z0-9\-_.]/g, '_');
};

/**
 * Generates a secure temporary file path
 * @param {string} [extension=''] - File extension (e.g., '.pdf', '.txt')
 * @returns {string} Full path to a temporary file
 */
const getTempFilePath = (extension = '') => {
  const tempDir = path.join(os.tmpdir(), 'legal-lens-temp');
  ensureDirectoryExists(tempDir);
  
  const filename = `${uuidv4()}${extension}`;
  return path.join(tempDir, filename);
};

/**
 * Safely removes a file if it exists
 * @param {string} filePath - Path to the file to remove
 * @returns {Promise<boolean>} True if file was removed, false if it didn't exist
 */
const safeRemoveFile = async (filePath) => {
  try {
    if (!filePath) return false;
    
    const normalizedPath = path.normalize(filePath);
    
    // Extra security check to prevent accidental deletion of system files
    if (!normalizedPath.startsWith(os.tmpdir()) && 
        !normalizedPath.startsWith(path.join(process.cwd(), 'uploads'))) {
      throw new Error('Invalid file path for deletion');
    }
    
    if (fs.existsSync(normalizedPath)) {
      await fs.promises.unlink(normalizedPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error removing file ${filePath}:`, error);
    return false;
  }
};

/**
 * Gets file metadata in a safe way
 * @param {string} filePath - Path to the file
 * @returns {Promise<Object|null>} File stats or null if file doesn't exist
 */
const getFileStats = async (filePath) => {
  try {
    const normalizedPath = path.normalize(filePath);
    
    // Prevent access to files outside the project directory
    if (!normalizedPath.startsWith(process.cwd())) {
      throw new Error('Access to file denied');
    }
    
    const stats = await fs.promises.stat(normalizedPath);
    return {
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory()
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
};

module.exports = {
  ensureDirectoryExists,
  sanitizeFilename,
  getTempFilePath,
  safeRemoveFile,
  getFileStats
};

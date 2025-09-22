const multer = require("multer");
const path = require("path");

// Define allowed file types and their corresponding MIME types and extensions
const ALLOWED_TYPES = {
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt', '.md', '.csv'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/rtf': ['.rtf'],
  'application/json': ['.json'],
  'text/markdown': ['.md']
};

// File filter to validate file types
const fileFilter = (req, file, cb) => {
  // Check if user is authenticated
  if (!req.user || !req.user.id) {
    return cb(new Error("User not authenticated"), false);
  }

  // Get file extension
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Check if MIME type is allowed
  if (!Object.keys(ALLOWED_TYPES).includes(file.mimetype)) {
    return cb(new Error(`File type ${file.mimetype} is not allowed.`), false);
  }
  
  // Check if extension is allowed for this MIME type
  if (!ALLOWED_TYPES[file.mimetype].includes(ext)) {
    return cb(new Error(`File extension ${ext} is not allowed for ${file.mimetype}.`), false);
  }
  
  cb(null, true);
};

// Configure multer with memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  }
});

/**
 * Handles file upload errors and sends appropriate responses
 */
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: 'file_too_large',
        message: 'File size exceeds the 10MB limit.'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'too_many_files',
        message: 'Only one file can be uploaded at a time.'
      });
    }
    
    return res.status(400).json({
      success: false,
      error: 'upload_error',
      message: error.message || 'Error uploading file.'
    });
  } else if (error) {
    // Other errors
    return res.status(400).json({
      success: false,
      error: 'upload_failed',
      message: error.message || 'Failed to upload file.'
    });
  }
  
  // No error, proceed to next middleware
  next();
};

module.exports = {
  upload,
  handleUploadError
};

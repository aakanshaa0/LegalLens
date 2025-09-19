const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const getUploadDir = (userId) => {
  const userDir = `uploads/user-${userId}/`;
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  return userDir;
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!req.user || !req.user.id) {
      return cb(new Error("User not authenticated"), false);
    }
    const userDir = getUploadDir(req.user.id);
    cb(null, userDir);
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(16, (err, buffer) => {
      if (err){
        return cb(err)
      }
      const uniqueName = buffer.toString("hex") + path.extname(file.originalname);
      cb(null, uniqueName);
    });
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf", 
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } 
  else {
    cb(new Error("Only PDF, TXT, and DOCX files are allowed"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 //10MB
  }
});

const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File too large. Maximum size is 10MB." });
    }
  }
  res.status(400).json({ error: error.message });
};

module.exports = {
  upload,
  handleUploadError
};
const express = require("express");
const { upload, handleUploadError } = require("../config/upload");
const { protect } = require("../middleware/auth");
const { validateUpload, validateDocumentId } = require("../middleware/validation");
const { addUserFile, getUserFiles, getUserFile, removeUserFile, cleanupUserDirectory } = require("../utils/fileStorage");
const { generateId, getFileType, formatFileSize } = require("../utils/helpers");

const router = express.Router();

router.use(protect);

router.post("/upload", upload.single("document"), handleUploadError, validateUpload, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileInfo = {
      id: generateId(),
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      sizeLabel: formatFileSize(req.file.size),
      mimetype: req.file.mimetype,
      fileType: getFileType(req.file.mimetype),
      uploadDate: new Date().toISOString(),
      userId: req.user.id
    };

    addUserFile(req.user.id, fileInfo);

    res.json({ 
      message: "File uploaded securely", 
      file: fileInfo 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/", (req, res) => {
  const files = getUserFiles(req.user.id);
  res.json({ 
    message: "Your uploaded documents",
    files: files 
  });
});

router.get("/:id", validateDocumentId, (req, res) => {
  const file = getUserFile(req.user.id, req.params.id);
  
  if (!file) {
    return res.status(404).json({ error: "File not found" });
  }
  
  res.json({ file });
});

router.delete("/:id", validateDocumentId, (req, res) => {
  const success = removeUserFile(req.user.id, req.params.id);
  
  if (!success) {
    return res.status(404).json({ error: "File not found" });
  }
  cleanupUserDirectory(req.user.id);
  res.json({ message: "File deleted successfully" });
});

module.exports = router;
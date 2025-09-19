const express = require("express");
const { protect } = require("../middleware/auth");
const { getUserFile } = require("../utils/fileStorage");
const { validateTranslation, validateDocumentId } = require("../middleware/validation");

const router = express.Router();

router.use(protect);

router.post("/", validateTranslation, (req, res) => {
  const { documentId, language } = req.body;
  
  if (!documentId || !language) {
    return res.status(400).json({ error: "Document ID and language are required" });
  }
  
  const document = getUserFile(req.user.id, documentId);
  
  if (!document) {
    return res.status(404).json({ error: "Document not found" });
  }
  
  setTimeout(() => {
    res.json({
      message: "Translation request received",
      documentId: documentId,
      language: language,
      status: "processing",
      estimatedCompletion: new Date(Date.now() + 2 * 60000).toISOString() // 2 minutes from now
    });
  }, 1000);
});

router.get("/status/:documentId", validateDocumentId, (req, res) => {
  const documentId = req.params.documentId;
  
  const document = getUserFile(req.user.id, documentId);
  
  if (!document) {
    return res.status(404).json({ error: "Document not found" });
  }
  
  res.json({
    documentId: documentId,
    status: "completed",
    downloadUrl: `/translation/download/${documentId}/translated.pdf`,
    completedAt: new Date().toISOString()
  });
});

router.get("/download/:documentId/:filename", validateDocumentId, (req, res) => {
  const documentId = req.params.documentId;
  
  const document = getUserFile(req.user.id, documentId);
  
  if (!document) {
    return res.status(404).json({ error: "Document not found" });
  }
  
  res.json({
    message: "Download endpoint - file would be served here",
    documentId: documentId,
    filename: req.params.filename,
    secure: true
  });
});

module.exports = router;
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const validateUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  next();
};

const validateDocumentId = (req, res, next) => {
  const documentId = req.params.id || req.body.documentId;
  
  if (!documentId) {
    return res.status(400).json({ error: 'Document ID is required' });
  }
  
  if (documentId.length > 100) {
    return res.status(400).json({ error: 'Document ID is too long' });
  }
  
  next();
};

const validateTranslation = (req, res, next) => {
  const { documentId, language } = req.body;
  
  if (!documentId) {
    return res.status(400).json({ error: 'Document ID is required' });
  }
  
  if (!language) {
    return res.status(400).json({ error: 'Language is required' });
  }
  
  const supportedLanguages = ['spanish', 'french', 'hindi', 'german'];
  if (!supportedLanguages.includes(language.toLowerCase())) {
    return res.status(400).json({ 
      error: 'Language not supported. Try: spanish, french, hindi, german' 
    });
  }
  
  next();
};

const handleValidationErrors = (req, res, next) => {
  next();
};

module.exports = {
  validateUpload,
  validateDocumentId,
  validateTranslation,
  handleValidationErrors,
  ALLOWED_MIME_TYPES
};
const FILE_TYPE_LABELS = {
  'application/pdf': 'PDF',
  'text/plain': 'Text',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word'
};

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

module.exports = {
  generateId,
  getFileType,
  formatFileSize
};
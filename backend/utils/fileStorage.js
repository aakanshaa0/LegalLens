const fs = require("fs");
const path = require("path");

let userFiles = {};

function addUserFile(userId, fileInfo) {
  if (!userFiles[userId]) {
    userFiles[userId] = [];
  }
  userFiles[userId].push(fileInfo);
  return fileInfo;
}

function getUserFiles(userId) {
  return userFiles[userId] || [];
}

function getUserFile(userId, fileId) {
  if (!userFiles[userId]) return null;
  return userFiles[userId].find(file => file.id === fileId);
}

function removeUserFile(userId, fileId) {
  if (!userFiles[userId]) return false;
  
  const index = userFiles[userId].findIndex(file => file.id === fileId);
  if (index !== -1) {
    const file = userFiles[userId][index];
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    userFiles[userId].splice(index, 1);
    return true;
  }
  return false;
}

function cleanupUserDirectory(userId) {
  const userDir = path.join('uploads', `user-${userId}`);
  if (fs.existsSync(userDir)) {
    const files = fs.readdirSync(userDir);
    if (files.length === 0) {
      try {
        fs.rmdirSync(userDir, { recursive: false });
      } 
      catch (e) {
        try { fs.rmSync(userDir, { recursive: true, force: true }); } catch (_) {}
      }
    }
  }
}

module.exports = {
  addUserFile,
  getUserFiles,
  getUserFile,
  removeUserFile,
  cleanupUserDirectory
};
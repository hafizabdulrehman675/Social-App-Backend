'use strict';

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const AppError = require('../utils/appError');
const { isCloudinaryEnabled } = require('../utils/mediaStorage');

const uploadsRootDir = path.join(__dirname, '..', 'uploads');
const avatarsDir = path.join(uploadsRootDir, 'avatars');
const postsDir = path.join(uploadsRootDir, 'posts');
fs.mkdirSync(avatarsDir, { recursive: true });
fs.mkdirSync(postsDir, { recursive: true });

function createDiskStorage(targetDir, prefix) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, targetDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
      const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
      cb(null, `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${safeExt}`);
    },
  });
}

function createImageUpload(storage) {
  return multer({
    storage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype || !file.mimetype.startsWith('image/')) {
        cb(new AppError('Only image files are allowed', 400));
        return;
      }
      cb(null, true);
    },
  });
}

const imageUpload = createImageUpload(
  isCloudinaryEnabled
    ? multer.memoryStorage()
    : createDiskStorage(avatarsDir, 'avatar'),
);
const postImageUpload = createImageUpload(
  isCloudinaryEnabled
    ? multer.memoryStorage()
    : createDiskStorage(postsDir, 'post'),
);

module.exports = {
  imageUpload,
  postImageUpload,
};

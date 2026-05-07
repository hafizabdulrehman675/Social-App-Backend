'use strict';

const { v2: cloudinary } = require('cloudinary');

const isCloudinaryEnabled = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET,
);

if (isCloudinaryEnabled) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

function uploadBufferToCloudinary(file, { folder, publicIdPrefix }) {
  if (!file || !file.buffer) {
    throw new Error('File buffer is required for cloud upload');
  }

  return new Promise((resolve, reject) => {
    const publicId = `${publicIdPrefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result.secure_url);
      },
    );

    stream.end(file.buffer);
  });
}

async function resolveUploadedImageUrl(file, {
  baseUrl,
  localSubdir,
  cloudinaryFolder,
  publicIdPrefix,
}) {
  if (!file) return null;

  if (isCloudinaryEnabled) {
    return uploadBufferToCloudinary(file, {
      folder: cloudinaryFolder,
      publicIdPrefix,
    });
  }

  const normalizedBaseUrl = (baseUrl || '').replace(/\/$/, '');
  return `${normalizedBaseUrl}/uploads/${localSubdir}/${file.filename}`;
}

module.exports = {
  isCloudinaryEnabled,
  resolveUploadedImageUrl,
};

const multer = require('multer');
const ApiError = require('../utils/ApiError');
const cloudinary = require('../config/cloudinary');

// Use memory storage so we can stream to Cloudinary or handle locally
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest('Only image files (JPEG, PNG, WebP) are allowed'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 5,                  // 5 files max
  },
  fileFilter,
});

/**
 * Upload single buffer to Cloudinary with fallback to data URI if Cloudinary is unconfigured
 */
const uploadToCloudinary = (buffer, mimetype = 'image/jpeg') => {
  return new Promise((resolve, reject) => {
    // If Cloudinary is not configured, fallback to base64 Data URI
    if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_CLOUD_NAME) {
      const base64 = buffer.toString('base64');
      const dataUri = `data:${mimetype};base64,${base64}`;
      return resolve({
        url: dataUri,
        publicId: `local_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'campus-auction',
        transformation: [{ width: 1200, height: 900, crop: 'limit', quality: 'auto' }],
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    uploadStream.end(buffer);
  });
};

module.exports = {
  upload,
  uploadToCloudinary,
};

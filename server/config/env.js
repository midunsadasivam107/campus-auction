const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Try loading .env from:
// 1. Current working directory
// 2. server/ directory
// 3. Project root directory
const envPaths = [
  path.join(process.cwd(), '.env'),
  path.join(__dirname, '..', '.env'),
  path.join(__dirname, '..', '..', '.env'),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const requiredVars = ['MONGODB_URI', 'JWT_SECRET'];
const optionalVars = [
  'PORT',
  'NODE_ENV',
  'JWT_EXPIRES_IN',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'GEMINI_API_KEY',
  'CLIENT_URL',
];

// Default fallbacks for development convenience
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/campus-auction';
  console.log('ℹ️ MONGODB_URI not set; defaulting to mongodb://127.0.0.1:27017/campus-auction');
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'campus_auction_dev_secret_key_super_secure_32chars!';
  console.log('ℹ️ JWT_SECRET not set; using development fallback secret.');
}

module.exports = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
};

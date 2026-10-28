const express = require('express');
const router = express.Router();

const {
  sendOtp,
  register,
  login,
  logout,
  getMe,
  updateProfile,
} = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  sendOtpSchema,
  registerSchema,
  loginSchema,
  updateProfileSchema,
} = require('../validations/auth.validation');

// Public routes with rate limiting
router.post('/send-otp', authLimiter, validate(sendOtpSchema), sendOtp);
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', logout);

// Protected routes
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, validate(updateProfileSchema), updateProfile);

module.exports = router;

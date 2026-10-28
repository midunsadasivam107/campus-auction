const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { JWT_SECRET, JWT_EXPIRES_IN, NODE_ENV } = require('../config/env');
const { sendOtpEmail } = require('../services/email.service');

/**
 * Generate JWT and send cookie
 */
const sendAuthResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const cookieOptions = {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  res.cookie('token', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token, // Also returned for mobile or authorization header clients
    user: user.toSafeObject(),
  });
};

/**
 * @desc    Send 6-digit OTP verification code to student email
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
const sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  // Check if student is already registered
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw ApiError.badRequest('A student with this email is already registered. Please log in.');
  }

  // Rate limiting check: max 5 OTP requests per 10 minutes for this email
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const recentOtps = await Otp.countDocuments({
    email: normalizedEmail,
    createdAt: { $gte: tenMinutesAgo },
  });

  if (recentOtps >= 5) {
    throw ApiError.badRequest('Too many verification codes requested. Please wait 10 minutes before trying again.');
  }

  // Generate secure 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Invalidate previous OTPs for this email
  await Otp.deleteMany({ email: normalizedEmail });

  // Store new OTP with 10-minute validity
  await Otp.create({
    email: normalizedEmail,
    otp: otpCode,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  // Send email (or log to console in development)
  const emailResult = await sendOtpEmail(normalizedEmail, otpCode);

  res.status(200).json({
    status: 'success',
    message: `Verification code sent to ${normalizedEmail}`,
    ...(emailResult.dev || NODE_ENV !== 'production' ? { devOtp: otpCode } : {}),
  });
});

/**
 * @desc    Register a new student with OTP verification
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, studentId, graduationYear, otp } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  // Check if email already in use
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw ApiError.badRequest('A student with this email is already registered');
  }

  // Verify OTP
  if (!otp) {
    throw ApiError.badRequest('Email verification code is required');
  }

  const otpRecord = await Otp.findOne({ email: normalizedEmail }).sort({ createdAt: -1 });
  if (!otpRecord) {
    throw ApiError.badRequest('Verification code has expired or was not requested. Please click "Resend Code".');
  }

  if (new Date() > otpRecord.expiresAt) {
    await Otp.deleteOne({ _id: otpRecord._id });
    throw ApiError.badRequest('Verification code has expired. Please request a new code.');
  }

  if (otpRecord.attempts >= 5) {
    await Otp.deleteOne({ _id: otpRecord._id });
    throw ApiError.badRequest('Too many failed attempts. Please request a new verification code.');
  }

  if (otpRecord.otp !== otp.trim()) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    throw ApiError.badRequest('Invalid verification code. Please check your email and try again.');
  }

  // OTP verified successfully — delete to prevent replay attacks
  await Otp.deleteOne({ _id: otpRecord._id });

  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash: password, // Will be hashed by pre('save') hook in User model
    studentId,
    graduationYear,
  });

  sendAuthResponse(user, 201, res);
});

/**
 * @desc    Log in student
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Include passwordHash for comparison
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  sendAuthResponse(user, 200, res);
});

/**
 * @desc    Log out student (clears cookie)
 * @route   POST /api/auth/logout
 * @access  Public (or Authenticated)
 */
const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
  });

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
});

/**
 * @desc    Get current student profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: 'success',
    user: req.user.toSafeObject(),
  });
});

/**
 * @desc    Update current student profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    'name',
    'studentId',
    'graduationYear',
    'bio',
    'spendingLimit',
    'avatarUrl',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      req.user[field] = req.body[field];
    }
  });

  await req.user.save();

  res.status(200).json({
    status: 'success',
    user: req.user.toSafeObject(),
  });
});

module.exports = {
  sendOtp,
  register,
  login,
  logout,
  getMe,
  updateProfile,
};

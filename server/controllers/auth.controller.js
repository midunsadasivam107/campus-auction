const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { JWT_SECRET, JWT_EXPIRES_IN, NODE_ENV } = require('../config/env');

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
 * @desc    Register a new student
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, studentId, graduationYear } = req.body;

  // Check if email already in use
  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.badRequest('A student with this email is already registered');
  }

  const user = await User.create({
    name,
    email,
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
  register,
  login,
  logout,
  getMe,
  updateProfile,
};

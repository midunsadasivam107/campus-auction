const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { JWT_SECRET } = require('../config/env');

/**
 * Authentication middleware.
 * Verifies JWT token from httpOnly cookie or Authorization: Bearer header.
 * Attaches user document to req.user (excluding passwordHash).
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check cookies
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // 2. Fallback to Authorization header
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw ApiError.unauthorized('Please log in to continue');
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Session expired. Please log in again.');
      }
      throw ApiError.unauthorized('Invalid authentication token');
    }

    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      throw ApiError.unauthorized('User account no longer exists');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware.
 * If token is present and valid, attaches user; otherwise leaves req.user = null.
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token = null;
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);
      req.user = user || null;
    } catch {
      req.user = null;
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
  optionalAuth,
};

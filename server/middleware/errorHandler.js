const ApiError = require('../utils/ApiError');
const { NODE_ENV } = require('../config/env');

/**
 * Central error handling middleware.
 * Converts all errors to a consistent JSON response format.
 */
const errorHandler = (err, req, res, next) => {
  // Default to 500 if no status code set
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let code = err.code || 'INTERNAL_ERROR';
  let details = err.details || null;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_ERROR';
    const field = Object.keys(err.keyValue)[0];
    message = `A record with this ${field} already exists`;
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    code = 'NOT_FOUND';
    message = 'Resource not found';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = 'Token expired';
  }

  // Log server errors in development
  if (statusCode >= 500 && NODE_ENV === 'development') {
    console.error('🔴 Server Error:', err);
  }

  const response = { error: message, code };
  if (details) response.details = details;

  // Don't leak stack traces in production
  if (NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;

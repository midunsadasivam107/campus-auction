const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 100 characters',
  }),
  email: Joi.string().trim().email().lowercase().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address',
  }),
  password: Joi.string().min(6).max(128).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters long',
  }),
  studentId: Joi.string().trim().max(50).allow('', null),
  graduationYear: Joi.number().integer().min(2020).max(2035).allow(null),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
  }),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  studentId: Joi.string().trim().max(50).allow('', null),
  graduationYear: Joi.number().integer().min(2020).max(2035).allow(null),
  bio: Joi.string().max(500).allow('', null),
  spendingLimit: Joi.number().min(0).allow(null),
  avatarUrl: Joi.string().uri().allow('', null),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
};

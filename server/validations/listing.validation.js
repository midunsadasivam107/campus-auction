const Joi = require('joi');
const { CATEGORIES, CONDITIONS } = require('../utils/constants');

const createListingSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).required().messages({
    'string.empty': 'Item title is required',
    'string.min': 'Title must be at least 2 characters long',
    'string.max': 'Title cannot exceed 200 characters',
  }),
  description: Joi.string().trim().min(3).max(5000).required().messages({
    'string.empty': 'Description is required',
    'string.min': 'Description must be at least 3 characters long',
  }),
  category: Joi.string().valid(...CATEGORIES).required().messages({
    'any.only': `Category must be one of: ${CATEGORIES.join(', ')}`,
  }),
  condition: Joi.string().valid(...CONDITIONS).required().messages({
    'any.only': `Condition must be one of: ${CONDITIONS.join(', ')}`,
  }),
  startingPrice: Joi.number().min(1).required().messages({
    'number.min': 'Starting price must be at least ₹1',
  }),
  minBidIncrement: Joi.number().min(1).default(10),
  closingTime: Joi.date().greater('now').required().messages({
    'date.greater': 'Closing time must be in the future',
    'date.base': 'Please provide a valid closing date and time',
    'any.required': 'Closing date and time is required',
  }),
  images: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().required(),
        publicId: Joi.string().allow('', null),
      })
    )
    .max(5)
    .default([]),
});

const updateListingSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200),
  description: Joi.string().trim().min(3).max(5000),
  category: Joi.string().valid(...CATEGORIES),
  condition: Joi.string().valid(...CONDITIONS),
  images: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().required(),
        publicId: Joi.string().allow('', null),
      })
    )
    .max(5),
  startingPrice: Joi.number().min(1),
  minBidIncrement: Joi.number().min(1),
  closingTime: Joi.date(),
});

module.exports = {
  createListingSchema,
  updateListingSchema,
};

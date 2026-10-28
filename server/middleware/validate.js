const Joi = require('joi');
const ApiError = require('../utils/ApiError');

/**
 * Creates a validation middleware for the given Joi schema.
 * Formats details into clear, specific, human-readable error messages.
 *
 * @param {Joi.ObjectSchema} schema - Joi validation schema
 * @param {string} source - 'body' | 'query' | 'params'
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/"/g, ''),
      }));

      // Combine messages into a clean, human-readable summary
      const readableMessage = details.map((d) => d.message).join('. ');
      return next(ApiError.badRequest(readableMessage, details));
    }

    // Replace with validated + sanitized values
    req[source] = value;
    next();
  };
};

module.exports = validate;

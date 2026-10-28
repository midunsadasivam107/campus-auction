const Joi = require('joi');

const askQuestionSchema = Joi.object({
  question: Joi.string().trim().min(5).max(1000).required().messages({
    'string.empty': 'Question cannot be empty',
    'string.min': 'Question must be at least 5 characters long',
    'string.max': 'Question cannot exceed 1000 characters',
    'any.required': 'Question is required',
  }),
});

const answerQuestionSchema = Joi.object({
  answer: Joi.string().trim().min(2).max(2000).required().messages({
    'string.empty': 'Answer cannot be empty',
    'string.min': 'Answer must be at least 2 characters long',
    'string.max': 'Answer cannot exceed 2000 characters',
    'any.required': 'Answer is required',
  }),
});

module.exports = {
  askQuestionSchema,
  answerQuestionSchema,
};

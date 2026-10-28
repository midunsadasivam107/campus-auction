const Joi = require('joi');

const placeBidSchema = Joi.object({
  amount: Joi.number().min(1).required().messages({
    'number.base': 'Bid amount must be a number',
    'number.min': 'Bid amount must be at least ₹1',
    'any.required': 'Bid amount is required',
  }),
});

module.exports = {
  placeBidSchema,
};

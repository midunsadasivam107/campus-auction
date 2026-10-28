const rateLimit = require('express-rate-limit');
const { RATE_LIMITS } = require('../utils/constants');

/**
 * Creates rate limiter middleware from a config object.
 */
const createLimiter = (config) => {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Too many requests, please try again later',
      code: 'RATE_LIMITED',
    },
  });
};

const generalLimiter = createLimiter(RATE_LIMITS.GENERAL);
const authLimiter = createLimiter(RATE_LIMITS.AUTH);
const bidLimiter = createLimiter(RATE_LIMITS.BID);
const questionLimiter = createLimiter(RATE_LIMITS.QUESTION);
const aiLimiter = createLimiter(RATE_LIMITS.AI);

module.exports = {
  generalLimiter,
  authLimiter,
  bidLimiter,
  questionLimiter,
  aiLimiter,
};

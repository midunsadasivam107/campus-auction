const express = require('express');
const router = express.Router();

const { chatWithAI } = require('../controllers/ai.controller');
const { optionalAuth } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

// Rate limited to 10 queries/min
router.post('/chat', optionalAuth, aiLimiter, chatWithAI);

module.exports = router;

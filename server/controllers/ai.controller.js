const { processAIChat } = require('../services/ai.service');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Chat with AI Assistant
 * @route   POST /api/ai/chat
 * @access  Private (or Optional Auth)
 */
const chatWithAI = asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    throw ApiError.badRequest('Message cannot be empty');
  }

  const result = await processAIChat(message, req.user);

  res.status(200).json({
    status: 'success',
    ...result,
  });
});

module.exports = {
  chatWithAI,
};

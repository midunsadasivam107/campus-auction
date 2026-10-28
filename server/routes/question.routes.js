const express = require('express');
const router = express.Router({ mergeParams: true });

const {
  askQuestion,
  getListingQuestions,
  answerQuestion,
} = require('../controllers/question.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { questionLimiter } = require('../middleware/rateLimiter');
const {
  askQuestionSchema,
  answerQuestionSchema,
} = require('../validations/question.validation');

// Public: get questions for listing
router.get('/:id/questions', getListingQuestions);

// Protected: ask question on listing
router.post(
  '/:id/questions',
  authenticate,
  questionLimiter,
  validate(askQuestionSchema),
  askQuestion
);

// Protected: seller answers question
router.put(
  '/:qid/answer',
  authenticate,
  validate(answerQuestionSchema),
  answerQuestion
);

module.exports = router;

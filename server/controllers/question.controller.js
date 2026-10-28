const Question = require('../models/Question');
const Listing = require('../models/Listing');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { anonymizeName } = require('../services/bid.service');

/**
 * @desc    Ask a question on an auction listing
 * @route   POST /api/listings/:id/questions
 * @access  Private
 */
const askQuestion = asyncHandler(async (req, res) => {
  const listingId = req.params.id;
  const askerId = req.user._id;
  const { question } = req.body;

  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw ApiError.notFound('Auction listing not found');
  }

  // Seller shouldn't ask questions on their own listing
  if (listing.seller.toString() === askerId.toString()) {
    throw ApiError.badRequest('You cannot ask questions on your own listing');
  }

  // Spam prevention: Max 5 questions per student per auction within the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentQuestionsCount = await Question.countDocuments({
    listing: listingId,
    asker: askerId,
    createdAt: { $gte: oneHourAgo },
  });

  if (recentQuestionsCount >= 5) {
    throw ApiError.tooMany(
      'Spam protection: You can ask a maximum of 5 questions per hour on this auction.'
    );
  }

  const q = await Question.create({
    listing: listingId,
    asker: askerId,
    question,
  });

  await q.populate('asker', 'name');

  // Notify seller via Socket.IO
  const io = req.app.get('io');
  if (io) {
    io.to(`user:${listing.seller}`).emit('new-question', {
      listingId,
      listingTitle: listing.title,
      questionId: q._id,
      question: q.question,
      askerName: anonymizeName(q.asker?.name),
    });
    // Broadcast to public auction room
    io.to(`auction:${listingId}`).emit('question-posted', {
      _id: q._id,
      question: q.question,
      createdAt: q.createdAt,
      asker: { name: anonymizeName(q.asker?.name) },
      answer: null,
    });
  }

  res.status(201).json({
    status: 'success',
    question: {
      _id: q._id,
      question: q.question,
      createdAt: q.createdAt,
      asker: { name: anonymizeName(q.asker?.name) },
      answer: null,
    },
  });
});

/**
 * @desc    Get all questions for an auction
 * @route   GET /api/listings/:id/questions
 * @access  Public
 */
const getListingQuestions = asyncHandler(async (req, res) => {
  const listingId = req.params.id;

  const questions = await Question.find({ listing: listingId })
    .sort({ createdAt: -1 })
    .populate('asker', 'name')
    .populate('answeredBy', 'name')
    .lean();

  const publicQuestions = questions.map((q) => ({
    _id: q._id,
    question: q.question,
    createdAt: q.createdAt,
    asker: { name: anonymizeName(q.asker?.name) },
    answer: q.answer,
    answeredBy: q.answeredBy ? { name: q.answeredBy.name } : null,
    answeredAt: q.answeredAt,
  }));

  res.status(200).json({
    status: 'success',
    count: publicQuestions.length,
    questions: publicQuestions,
  });
});

/**
 * @desc    Answer a question (Seller only)
 * @route   PUT /api/questions/:qid/answer
 * @access  Private (Seller only)
 */
const answerQuestion = asyncHandler(async (req, res) => {
  const { qid } = req.params;
  const { answer } = req.body;

  const q = await Question.findById(qid).populate('listing');
  if (!q) {
    throw ApiError.notFound('Question not found');
  }

  // Authorization: Only the seller of the listing can answer
  if (q.listing.seller.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Only the seller of this item can answer questions');
  }

  q.answer = answer;
  q.answeredBy = req.user._id;
  q.answeredAt = new Date();
  await q.save();

  await q.populate('answeredBy', 'name');
  await q.populate('asker', 'name');

  // Notify asker via Socket.IO
  const io = req.app.get('io');
  if (io) {
    io.to(`user:${q.asker._id}`).emit('question-answered', {
      listingId: q.listing._id,
      listingTitle: q.listing.title,
      question: q.question,
      answer: q.answer,
      sellerName: req.user.name,
    });
    // Broadcast update to auction room
    io.to(`auction:${q.listing._id}`).emit('answer-posted', {
      _id: q._id,
      answer: q.answer,
      answeredAt: q.answeredAt,
      answeredBy: { name: req.user.name },
    });
  }

  res.status(200).json({
    status: 'success',
    question: {
      _id: q._id,
      question: q.question,
      answer: q.answer,
      answeredAt: q.answeredAt,
      answeredBy: { name: req.user.name },
      asker: { name: anonymizeName(q.asker?.name) },
    },
  });
});

module.exports = {
  askQuestion,
  getListingQuestions,
  answerQuestion,
};

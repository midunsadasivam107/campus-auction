const SavedSearch = require('../models/SavedSearch');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Create a saved search
 * @route   POST /api/saved-searches
 * @access  Private
 */
const createSavedSearch = asyncHandler(async (req, res) => {
  const { label, filters } = req.body;

  if (!label || !label.trim()) {
    throw ApiError.badRequest('Search label is required');
  }

  // Limit students to a maximum of 15 saved searches
  const existingCount = await SavedSearch.countDocuments({
    user: req.user._id,
    isActive: true,
  });

  if (existingCount >= 15) {
    throw ApiError.badRequest('You have reached the maximum limit of 15 saved searches');
  }

  const savedSearch = await SavedSearch.create({
    user: req.user._id,
    label: label.trim(),
    filters: filters || {},
  });

  res.status(201).json({
    status: 'success',
    message: 'Search saved! We will notify you when matching items appear.',
    savedSearch,
  });
});

/**
 * @desc    Get current student's saved searches
 * @route   GET /api/saved-searches
 * @access  Private
 */
const getMySavedSearches = asyncHandler(async (req, res) => {
  const savedSearches = await SavedSearch.find({
    user: req.user._id,
    isActive: true,
  }).sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    count: savedSearches.length,
    savedSearches,
  });
});

/**
 * @desc    Delete a saved search
 * @route   DELETE /api/saved-searches/:id
 * @access  Private
 */
const deleteSavedSearch = asyncHandler(async (req, res) => {
  const savedSearch = await SavedSearch.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: { isActive: false } },
    { new: true }
  );

  if (!savedSearch) {
    throw ApiError.notFound('Saved search not found');
  }

  res.status(200).json({
    status: 'success',
    message: 'Saved search removed',
  });
});

module.exports = {
  createSavedSearch,
  getMySavedSearches,
  deleteSavedSearch,
};

const Listing = require('../models/Listing');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { LISTING_STATUS } = require('../utils/constants');
const { uploadToCloudinary } = require('../middleware/upload');
const { matchSavedSearches } = require('../services/search.service');

/**
 * @desc    Upload images for a listing
 * @route   POST /api/listings/upload
 * @access  Private
 */
const uploadImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw ApiError.badRequest('Please upload at least one image');
  }

  const uploadPromises = req.files.map((file) =>
    uploadToCloudinary(file.buffer, file.mimetype)
  );

  const images = await Promise.all(uploadPromises);

  res.status(200).json({
    status: 'success',
    images,
  });
});

/**
 * @desc    Create a new listing
 * @route   POST /api/listings
 * @access  Private
 */
const createListing = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    condition,
    startingPrice,
    minBidIncrement = 10,
    closingTime,
    images = [],
  } = req.body;

  // Validate closing time
  const closingDate = new Date(closingTime);
  const minClosing = new Date(Date.now() + 60 * 1000); // At least 1 min in future for tests, default 1 hour in UI
  if (closingDate <= minClosing) {
    throw ApiError.badRequest('Auction closing time must be in the future');
  }

  const listing = await Listing.create({
    seller: req.user._id,
    title,
    description,
    category,
    condition,
    startingPrice,
    currentPrice: startingPrice,
    minBidIncrement,
    closingTime: closingDate,
    images,
    status: LISTING_STATUS.ACTIVE,
  });

  const populated = await Listing.findById(listing._id).populate(
    'seller',
    'name email studentId graduationYear avatarUrl'
  );

  // Match against saved searches in background
  const io = req.app.get('io');
  matchSavedSearches(listing, io).catch((err) =>
    console.error('Error in matchSavedSearches:', err.message)
  );

  res.status(201).json({
    status: 'success',
    listing: populated,
  });
});

/**
 * @desc    Browse, search and filter listings
 * @route   GET /api/listings
 * @access  Public
 */
const getListings = asyncHandler(async (req, res) => {
  const {
    q,
    category,
    condition,
    minPrice,
    maxPrice,
    closingSoon,
    status = LISTING_STATUS.ACTIVE,
    sort = 'closing_soon',
    page = 1,
    limit = 20,
  } = req.query;

  const filter = {};

  // Status filter (default to active for browse)
  if (status !== 'all') {
    filter.status = status;
  }

  // Text search on title or description
  if (q && q.trim()) {
    filter.$or = [
      { title: { $regex: q.trim(), $options: 'i' } },
      { description: { $regex: q.trim(), $options: 'i' } },
    ];
  }

  // Category filter
  if (category) {
    filter.category = category;
  }

  // Condition filter
  if (condition) {
    filter.condition = condition;
  }

  // Price range
  if (minPrice || maxPrice) {
    filter.currentPrice = {};
    if (minPrice) filter.currentPrice.$gte = Number(minPrice);
    if (maxPrice) filter.currentPrice.$lte = Number(maxPrice);
  }

  // Closing soon (closing within 1 hour or 24 hours)
  if (closingSoon === 'true' || closingSoon === true) {
    const oneDayFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    filter.closingTime = { $gt: new Date(), $lte: oneDayFromNow };
  }

  // Sorting
  let sortOption = {};
  switch (sort) {
    case 'latest':
      sortOption = { createdAt: -1 };
      break;
    case 'price_asc':
      sortOption = { currentPrice: 1 };
      break;
    case 'price_desc':
      sortOption = { currentPrice: -1 };
      break;
    case 'closing_soon':
    default:
      sortOption = { closingTime: 1 };
      break;
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [listings, total] = await Promise.all([
    Listing.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .populate('seller', 'name studentId graduationYear avatarUrl')
      .populate('currentWinner', 'name')
      .lean(),
    Listing.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    results: listings.length,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      total,
    },
    listings,
  });
});

/**
 * @desc    Get listing detail by ID
 * @route   GET /api/listings/:id
 * @access  Public
 */
const getListingById = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id)
    .populate('seller', 'name email studentId graduationYear bio avatarUrl createdAt')
    .populate('currentWinner', 'name studentId graduationYear avatarUrl');

  if (!listing) {
    throw ApiError.notFound('Auction listing not found');
  }

  res.status(200).json({
    status: 'success',
    listing,
  });
});

/**
 * @desc    Edit a listing
 * @route   PUT /api/listings/:id
 * @access  Private (Seller only)
 */
const updateListing = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    throw ApiError.notFound('Listing not found');
  }

  // Check ownership
  if (listing.seller.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You can only edit your own listings');
  }

  // Restriction: cannot edit if bids have already been placed
  if (listing.bidCount > 0) {
    throw ApiError.badRequest('Cannot edit listing after bids have been placed');
  }

  // Restriction: cannot edit closed or completed listing
  if (
    listing.status !== LISTING_STATUS.DRAFT &&
    listing.status !== LISTING_STATUS.ACTIVE
  ) {
    throw ApiError.badRequest(`Cannot edit listing in '${listing.status}' status`);
  }

  const updatable = [
    'title',
    'description',
    'category',
    'condition',
    'images',
    'startingPrice',
    'minBidIncrement',
    'closingTime',
  ];

  updatable.forEach((field) => {
    if (req.body[field] !== undefined) {
      listing[field] = req.body[field];
      if (field === 'startingPrice' && listing.bidCount === 0) {
        listing.currentPrice = req.body[field];
      }
    }
  });

  listing.statusHistory.push({
    status: listing.status,
    timestamp: new Date(),
    note: 'Listing updated by seller',
  });

  await listing.save();

  res.status(200).json({
    status: 'success',
    listing,
  });
});

/**
 * @desc    Cancel a listing
 * @route   DELETE /api/listings/:id
 * @access  Private (Seller only)
 */
const cancelListing = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    throw ApiError.notFound('Listing not found');
  }

  if (listing.seller.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You can only cancel your own listings');
  }

  if (listing.bidCount > 0) {
    throw ApiError.badRequest('Cannot cancel listing after bids have been placed');
  }

  listing.status = LISTING_STATUS.CANCELLED;
  listing.statusHistory.push({
    status: LISTING_STATUS.CANCELLED,
    timestamp: new Date(),
    note: 'Listing cancelled by seller',
  });

  await listing.save();

  res.status(200).json({
    status: 'success',
    message: 'Listing cancelled successfully',
  });
});

/**
 * @desc    Seller approves winning bid
 * @route   POST /api/listings/:id/approve
 * @access  Private (Seller only)
 */
const approveWinningBid = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    throw ApiError.notFound('Listing not found');
  }

  if (listing.seller.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Only the seller can approve this sale');
  }

  if (
    listing.status !== LISTING_STATUS.PENDING_APPROVAL &&
    listing.status !== LISTING_STATUS.CLOSED
  ) {
    throw ApiError.badRequest(`Cannot approve listing in status '${listing.status}'`);
  }

  if (!listing.currentWinner || listing.bidCount === 0) {
    throw ApiError.badRequest('Cannot approve an auction with no bids');
  }

  listing.status = LISTING_STATUS.SOLD;
  listing.approvedAt = new Date();
  listing.statusHistory.push({
    status: LISTING_STATUS.SOLD,
    timestamp: new Date(),
    note: `Winning price of ₹${listing.currentPrice} approved by seller`,
  });

  await listing.save();

  res.status(200).json({
    status: 'success',
    message: 'Winning price approved. Item is reserved for the winning student.',
    listing,
  });
});

/**
 * @desc    Seller rejects winning bid
 * @route   POST /api/listings/:id/reject
 * @access  Private (Seller only)
 */
const rejectWinningBid = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    throw ApiError.notFound('Listing not found');
  }

  if (listing.seller.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Only the seller can reject this sale');
  }

  if (
    listing.status !== LISTING_STATUS.PENDING_APPROVAL &&
    listing.status !== LISTING_STATUS.CLOSED
  ) {
    throw ApiError.badRequest(`Cannot reject listing in status '${listing.status}'`);
  }

  listing.status = LISTING_STATUS.REJECTED;
  listing.statusHistory.push({
    status: LISTING_STATUS.REJECTED,
    timestamp: new Date(),
    note: 'Winning price rejected by seller',
  });

  await listing.save();

  res.status(200).json({
    status: 'success',
    message: 'Sale rejected by seller. Item marked as rejected.',
    listing,
  });
});

/**
 * @desc    Confirm campus handover
 * @route   POST /api/listings/:id/confirm-pickup
 * @access  Private (Seller or Winner)
 */
const confirmPickup = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    throw ApiError.notFound('Listing not found');
  }

  const isSeller = listing.seller.toString() === req.user._id.toString();
  const isWinner =
    listing.currentWinner &&
    listing.currentWinner.toString() === req.user._id.toString();

  if (!isSeller && !isWinner) {
    throw ApiError.forbidden('Only the seller or winner can confirm campus handover');
  }

  if (listing.status !== LISTING_STATUS.SOLD) {
    throw ApiError.badRequest('Handover can only be confirmed for approved (sold) auctions');
  }

  listing.status = LISTING_STATUS.COMPLETED;
  listing.completedAt = new Date();
  listing.statusHistory.push({
    status: LISTING_STATUS.COMPLETED,
    timestamp: new Date(),
    note: `Handover confirmed by ${isSeller ? 'seller' : 'buyer'}`,
  });

  await listing.save();

  res.status(200).json({
    status: 'success',
    message: 'Campus handover confirmed. Deal completed!',
    listing,
  });
});

/**
 * @desc    Report failed pickup / no show
 * @route   POST /api/listings/:id/failed-pickup
 * @access  Private (Seller only)
 */
const reportFailedPickup = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    throw ApiError.notFound('Listing not found');
  }

  if (listing.seller.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Only the seller can report failed pickup');
  }

  if (listing.status !== LISTING_STATUS.SOLD) {
    throw ApiError.badRequest('Can only report failed pickup for approved (sold) items');
  }

  listing.status = LISTING_STATUS.FAILED_PICKUP;
  listing.statusHistory.push({
    status: LISTING_STATUS.FAILED_PICKUP,
    timestamp: new Date(),
    note: 'Pickup failed / buyer no-show reported by seller',
  });

  await listing.save();

  res.status(200).json({
    status: 'success',
    message: 'Pickup marked as failed. You can relist this item.',
    listing,
  });
});

/**
 * @desc    Get user's selling listings
 * @route   GET /api/listings/my/selling
 * @access  Private
 */
const getMySellingListings = asyncHandler(async (req, res) => {
  const listings = await Listing.find({ seller: req.user._id })
    .sort({ createdAt: -1 })
    .populate('currentWinner', 'name studentId email')
    .lean();

  res.status(200).json({
    status: 'success',
    listings,
  });
});

module.exports = {
  uploadImages,
  createListing,
  getListings,
  getListingById,
  updateListing,
  cancelListing,
  approveWinningBid,
  rejectWinningBid,
  confirmPickup,
  reportFailedPickup,
  getMySellingListings,
};

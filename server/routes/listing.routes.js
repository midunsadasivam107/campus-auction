const express = require('express');
const router = express.Router();

const {
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
} = require('../controllers/listing.controller');
const { authenticate, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { upload } = require('../middleware/upload');
const {
  createListingSchema,
  updateListingSchema,
} = require('../validations/listing.validation');

// Public listing browsing
router.get('/', optionalAuth, getListings);

// Protected routes for seller dashboard (placed BEFORE /:id to prevent matching as id)
router.get('/my/selling', authenticate, getMySellingListings);

// Upload images
router.post('/upload', authenticate, upload.array('images', 5), uploadImages);

// Create new listing
router.post('/', authenticate, validate(createListingSchema), createListing);

// Single listing detail
router.get('/:id', optionalAuth, getListingById);

// Update listing (restricted to seller with 0 bids)
router.put('/:id', authenticate, validate(updateListingSchema), updateListing);

// Cancel listing (restricted to seller with 0 bids)
router.delete('/:id', authenticate, cancelListing);

// Auction outcome actions
router.post('/:id/approve', authenticate, approveWinningBid);
router.post('/:id/reject', authenticate, rejectWinningBid);
router.post('/:id/confirm-pickup', authenticate, confirmPickup);
router.post('/:id/failed-pickup', authenticate, reportFailedPickup);

module.exports = router;

const express = require('express');
const router = express.Router({ mergeParams: true });

const {
  placeBid,
  getBidHistory,
  getMyBids,
} = require('../controllers/bid.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { bidLimiter } = require('../middleware/rateLimiter');
const { placeBidSchema } = require('../validations/bid.validation');

// Get user's own bids
router.get('/my', authenticate, getMyBids);

// Public bid history for listing
router.get('/:id/bids', getBidHistory);

// Place a bid (rate limited to 30 bids/min)
router.post('/:id/bids', authenticate, bidLimiter, validate(placeBidSchema), placeBid);

module.exports = router;

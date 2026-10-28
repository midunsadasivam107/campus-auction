const express = require('express');
const router = express.Router({ mergeParams: true });

const {
  placeBid,
  getBidHistory,
  getMyBids,
  setAutoBidHandler,
  getMyAutoBidHandler,
  cancelAutoBidHandler,
} = require('../controllers/bid.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { bidLimiter } = require('../middleware/rateLimiter');
const { placeBidSchema, setAutoBidSchema } = require('../validations/bid.validation');

// Get user's own bids
router.get('/my', authenticate, getMyBids);

// Public bid history for listing
router.get('/:id/bids', getBidHistory);

// Place a bid (rate limited to 30 bids/min)
router.post('/:id/bids', authenticate, bidLimiter, validate(placeBidSchema), placeBid);

// Auto-bidding endpoints
router.post(
  '/:id/auto-bid',
  authenticate,
  validate(setAutoBidSchema),
  setAutoBidHandler
);
router.get('/:id/auto-bid', authenticate, getMyAutoBidHandler);
router.delete('/:id/auto-bid', authenticate, cancelAutoBidHandler);

module.exports = router;

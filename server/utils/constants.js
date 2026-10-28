// Listing categories
const CATEGORIES = [
  'textbooks',
  'electronics',
  'bicycles',
  'calculators',
  'furniture',
  'clothing',
  'sports',
  'stationery',
  'other',
];

// Item conditions
const CONDITIONS = ['like_new', 'good', 'fair', 'worn'];

// Listing statuses
const LISTING_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  CLOSED: 'closed',
  PENDING_APPROVAL: 'pending_approval',
  SOLD: 'sold',
  UNSOLD: 'unsold',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  FAILED_PICKUP: 'failed_pickup',
};

// Notification types
const NOTIFICATION_TYPES = [
  'outbid',
  'auction_won',
  'auction_lost',
  'auction_closed',
  'seller_approved',
  'seller_rejected',
  'new_question',
  'question_answered',
  'saved_search_match',
  'pickup_confirmed',
  'listing_cancelled',
  'auto_bid_exhausted',
];

// Auction rules
const AUCTION_RULES = {
  MIN_DURATION_MS: 60 * 60 * 1000,        // 1 hour minimum
  ANTI_SNIPE_THRESHOLD_MS: 30 * 1000,     // 30 seconds
  ANTI_SNIPE_EXTENSION_MS: 60 * 1000,     // Extend to 60 seconds
  MAX_IMAGES: 5,
  MAX_IMAGE_SIZE_MB: 2,
  CLOSER_INTERVAL_MS: 10 * 1000,          // Check every 10 seconds
};

// Rate limits
const RATE_LIMITS = {
  GENERAL: { windowMs: 15 * 60 * 1000, max: 100 },      // 100 req / 15 min
  AUTH: { windowMs: 15 * 60 * 1000, max: 20 },           // 20 req / 15 min
  BID: { windowMs: 60 * 1000, max: 30 },                 // 30 bids / min
  QUESTION: { windowMs: 60 * 60 * 1000, max: 5 },        // 5 questions / hour per auction
  AI: { windowMs: 60 * 1000, max: 10 },                  // 10 AI requests / min
};

module.exports = {
  CATEGORIES,
  CONDITIONS,
  LISTING_STATUS,
  NOTIFICATION_TYPES,
  AUCTION_RULES,
  RATE_LIMITS,
};

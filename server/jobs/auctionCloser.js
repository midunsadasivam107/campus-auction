const cron = require('node-cron');
const Listing = require('../models/Listing');
const { LISTING_STATUS, AUCTION_RULES } = require('../utils/constants');

/**
 * Close expired auctions atomically
 * Prevents double-closure and race conditions.
 */
const closeExpiredAuctions = async (io = null) => {
  const now = new Date();

  try {
    // 1. Find all active auctions whose closing time has passed
    const expiredListings = await Listing.find({
      status: LISTING_STATUS.ACTIVE,
      closingTime: { $lte: now },
    });

    if (expiredListings.length === 0) return;

    for (const listing of expiredListings) {
      // Determine outcome: unsold if 0 bids, pending_approval if has bids
      const newStatus =
        listing.bidCount === 0
          ? LISTING_STATUS.UNSOLD
          : LISTING_STATUS.PENDING_APPROVAL;

      const note =
        listing.bidCount === 0
          ? 'Auction closed with no bids (unsold)'
          : `Auction closed with winning bid of ₹${listing.currentPrice}. Awaiting seller approval.`;

      // Atomically update listing only if still active
      const updated = await Listing.findOneAndUpdate(
        {
          _id: listing._id,
          status: LISTING_STATUS.ACTIVE,
        },
        {
          $set: {
            status: newStatus,
            closedAt: now,
          },
          $push: {
            statusHistory: {
              status: newStatus,
              timestamp: now,
              note,
            },
          },
        },
        { new: true }
      );

      if (updated && io) {
        // Emit close event to auction room
        io.to(`auction:${listing._id}`).emit('auction-closed', {
          listingId: listing._id,
          status: newStatus,
          currentWinner: updated.currentWinner,
          currentPrice: updated.currentPrice,
          bidCount: updated.bidCount,
          note,
        });

        // If there is a winner, emit private notification to winner
        if (updated.currentWinner) {
          io.to(`user:${updated.currentWinner}`).emit('auction-won-provisional', {
            listingId: listing._id,
            title: updated.title,
            amount: updated.currentPrice,
            message: `🎉 You are the provisional winner of "${updated.title}" at ₹${updated.currentPrice}! Awaiting seller approval.`,
          });
        }

        // Emit private notification to seller
        io.to(`user:${updated.seller}`).emit('auction-ended-seller', {
          listingId: listing._id,
          title: updated.title,
          status: newStatus,
          currentPrice: updated.currentPrice,
          bidCount: updated.bidCount,
        });
      }
    }
  } catch (error) {
    console.error('❌ Error closing expired auctions:', error.message);
  }
};

/**
 * Start the recurring auction closer job
 * Runs every 10 seconds (AUCTION_RULES.CLOSER_INTERVAL_MS)
 */
const startAuctionCloser = (app = null) => {
  // node-cron pattern: every 10 seconds: '*/10 * * * * *'
  const task = cron.schedule('*/10 * * * * *', async () => {
    const io = app ? app.get('io') : null;
    await closeExpiredAuctions(io);
  });

  console.log('✅ Auction closer cron job started (every 10s)');
  return task;
};

module.exports = {
  closeExpiredAuctions,
  startAuctionCloser,
};

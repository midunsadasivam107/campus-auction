const AutoBid = require('../models/AutoBid');
const Listing = require('../models/Listing');
const Bid = require('../models/Bid');
const ApiError = require('../utils/ApiError');
const { createNotification } = require('./notification.service');
const { anonymizeName } = require('./bid.service');
const { LISTING_STATUS } = require('../utils/constants');

/**
 * Configure or update a student's automatic bidding maximum
 */
const setAutoBid = async (listingId, bidderId, maxAmount, io = null) => {
  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw ApiError.notFound('Auction listing not found');
  }

  if (listing.seller.toString() === bidderId.toString()) {
    throw ApiError.forbidden('You cannot set auto-bidding on your own listing');
  }

  if (
    listing.status !== LISTING_STATUS.ACTIVE ||
    new Date(listing.closingTime) <= new Date()
  ) {
    throw ApiError.badRequest('This auction has already closed');
  }

  const minIncrement = listing.minBidIncrement || 10;
  const currentPrice = listing.currentPrice ?? listing.startingPrice;
  const minRequired =
    listing.bidCount === 0 ? listing.startingPrice : currentPrice + minIncrement;

  if (maxAmount < minRequired) {
    throw ApiError.badRequest(
      `Your maximum auto-bid must be at least ₹${minRequired}`
    );
  }

  // Deactivate any existing active auto-bid for this student on this listing
  await AutoBid.updateMany(
    { listing: listingId, bidder: bidderId, isActive: true },
    { $set: { isActive: false } }
  );

  // Create new active auto-bid
  const autoBid = await AutoBid.create({
    listing: listingId,
    bidder: bidderId,
    maxAmount,
    isActive: true,
    createdAt: new Date(),
  });

  // If the student is not currently the leading bidder, immediately place the minimum required bid
  const isAlreadyWinner =
    listing.currentWinner &&
    listing.currentWinner.toString() === bidderId.toString();

  if (!isAlreadyWinner) {
    await processCompetingAutoBids(listing._id, null, io);
  }

  return autoBid;
};

/**
 * Evaluate all active auto-bids on an auction and place minimum counter-bids deterministically
 */
const processCompetingAutoBids = async (listingId, triggerBidderId = null, io = null) => {
  // Loop guard to prevent infinite cycles
  let iterations = 0;
  const MAX_ITERATIONS = 20;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    // Fetch fresh listing state
    const listing = await Listing.findById(listingId);
    if (!listing || listing.status !== LISTING_STATUS.ACTIVE) break;
    if (new Date(listing.closingTime) <= new Date()) break;

    const minIncrement = listing.minBidIncrement || 10;
    const currentPrice = listing.currentPrice ?? listing.startingPrice;

    // Find active auto-bids where bidder is NOT currently winning, ordered by createdAt ASC (first-set priority)
    const candidates = await AutoBid.find({
      listing: listingId,
      isActive: true,
      bidder: { $ne: listing.currentWinner },
    }).sort({ createdAt: 1 });

    if (candidates.length === 0) break;

    let bidPlacedInIteration = false;

    for (const autoBid of candidates) {
      const requiredBid =
        listing.bidCount === 0 ? listing.startingPrice : currentPrice + minIncrement;

      if (autoBid.maxAmount >= requiredBid) {
        // Place minimum necessary proxy bid
        const now = new Date();
        const updated = await Listing.findOneAndUpdate(
          {
            _id: listingId,
            status: LISTING_STATUS.ACTIVE,
            $or: [
              { bidCount: 0, startingPrice: { $lte: requiredBid } },
              {
                bidCount: { $gt: 0 },
                $expr: {
                  $lte: [{ $add: ['$currentPrice', '$minBidIncrement'] }, requiredBid],
                },
              },
            ],
          },
          {
            $set: { currentPrice: requiredBid, currentWinner: autoBid.bidder },
            $inc: { bidCount: 1 },
          },
          { new: true }
        );

        if (updated) {
          const bidRecord = await Bid.create({
            listing: listingId,
            bidder: autoBid.bidder,
            amount: requiredBid,
            isAutoBid: true,
            createdAt: now,
          });

          await bidRecord.populate('bidder', 'name');

          // Broadcast via Socket.IO
          if (io) {
            io.to(`auction:${listingId}`).emit('new-bid', {
              listingId,
              amount: requiredBid,
              currentPrice: requiredBid,
              bidCount: updated.bidCount,
              createdAt: bidRecord.createdAt,
              bidderName: anonymizeName(bidRecord.bidder?.name),
              isAutoBid: true,
              closingTime: updated.closingTime,
            });
          }

          bidPlacedInIteration = true;
          break; // Break inner loop and re-evaluate next state
        }
      } else {
        // Auto-bid max amount exhausted
        autoBid.isActive = false;
        await autoBid.save();

        // Notify student that their auto-bid was exhausted
        await createNotification({
          userId: autoBid.bidder,
          type: 'auto_bid_exhausted',
          title: 'Auto-Bid Max Reached',
          message: `Your automatic bid limit of ₹${autoBid.maxAmount} for "${listing.title}" has been exceeded.`,
          listingId: listing._id,
          dedupKey: `auto_exhaust_${autoBid._id}`,
          io,
        });
      }
    }

    if (!bidPlacedInIteration) break;
  }
};

/**
 * Get student's own auto-bid status (confidential)
 */
const getMyAutoBid = async (listingId, bidderId) => {
  const autoBid = await AutoBid.findOne({
    listing: listingId,
    bidder: bidderId,
    isActive: true,
  });
  return autoBid;
};

/**
 * Cancel active auto-bid
 */
const cancelAutoBid = async (listingId, bidderId) => {
  const result = await AutoBid.findOneAndUpdate(
    { listing: listingId, bidder: bidderId, isActive: true },
    { $set: { isActive: false } },
    { new: true }
  );
  return result;
};

module.exports = {
  setAutoBid,
  processCompetingAutoBids,
  getMyAutoBid,
  cancelAutoBid,
};

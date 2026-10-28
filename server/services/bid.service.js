const Listing = require('../models/Listing');
const Bid = require('../models/Bid');
const ApiError = require('../utils/ApiError');
const { AUCTION_RULES, LISTING_STATUS } = require('../utils/constants');

/**
 * Anonymize student name for public bid logs (e.g., "Rahul Kumar" -> "Rahul K.")
 */
const anonymizeName = (name) => {
  if (!name) return 'Student';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
};

/**
 * Atomic bid placement engine
 * Handles concurrency, validation, and anti-snipe extensions.
 *
 * @param {string} listingId - ID of the auction
 * @param {string} bidderId - ID of the student placing the bid
 * @param {number} amount - Bid amount in INR
 * @param {boolean} isAutoBid - Whether bid is placed by proxy engine
 */
const placeBidAtomic = async (listingId, bidderId, amount, isAutoBid = false) => {
  const now = new Date();

  // Pre-check for clear, human-friendly error messages if invalid
  const existingListing = await Listing.findById(listingId);
  if (!existingListing) {
    throw ApiError.notFound('Auction listing not found');
  }

  if (existingListing.seller.toString() === bidderId.toString()) {
    throw ApiError.forbidden('You cannot bid on your own listing');
  }

  if (
    existingListing.status !== LISTING_STATUS.ACTIVE ||
    new Date(existingListing.closingTime) <= now
  ) {
    throw ApiError.badRequest('This auction has already closed');
  }

  const minIncrement = existingListing.minBidIncrement || 10;
  const currentPrice = existingListing.currentPrice ?? existingListing.startingPrice;
  const minRequired =
    existingListing.bidCount === 0
      ? existingListing.startingPrice
      : currentPrice + minIncrement;

  if (amount < minRequired) {
    throw ApiError.badRequest(
      existingListing.bidCount === 0
        ? `First bid must be at least the starting price of ₹${existingListing.startingPrice}`
        : `Bid must be at least ₹${minRequired} (current ₹${currentPrice} + min increment ₹${minIncrement})`
    );
  }

  // Atomic findOneAndUpdate with concurrency condition
  const updatedListing = await Listing.findOneAndUpdate(
    {
      _id: listingId,
      status: LISTING_STATUS.ACTIVE,
      seller: { $ne: bidderId },
      closingTime: { $gt: now },
      $or: [
        // Case 1: First bid
        {
          bidCount: 0,
          startingPrice: { $lte: amount },
        },
        // Case 2: Subsequent bid
        {
          bidCount: { $gt: 0 },
          $expr: {
            $lte: [{ $add: ['$currentPrice', '$minBidIncrement'] }, amount],
          },
        },
      ],
    },
    {
      $set: {
        currentPrice: amount,
        currentWinner: bidderId,
      },
      $inc: { bidCount: 1 },
    },
    { new: true }
  );

  // If atomic update returned null, a concurrent bid won the race or state changed
  if (!updatedListing) {
    throw ApiError.conflict(
      'Another student placed a higher or simultaneous bid. Please refresh and try again.'
    );
  }

  // Create the immutable Bid record
  const bidRecord = await Bid.create({
    listing: listingId,
    bidder: bidderId,
    amount,
    isAutoBid,
    createdAt: now,
  });

  // Check Last-Minute Anti-Snipe Extension:
  // If bid placed within <= 30 seconds of closing time, extend deadline to now + 60s
  let wasExtended = false;
  let newClosingTime = null;
  const timeRemainingMs = new Date(updatedListing.closingTime).getTime() - now.getTime();

  if (timeRemainingMs <= AUCTION_RULES.ANTI_SNIPE_THRESHOLD_MS && timeRemainingMs > 0) {
    newClosingTime = new Date(now.getTime() + AUCTION_RULES.ANTI_SNIPE_EXTENSION_MS);
    updatedListing.closingTime = newClosingTime;
    updatedListing.statusHistory.push({
      status: LISTING_STATUS.ACTIVE,
      timestamp: now,
      note: `Anti-snipe extension: deadline extended by 60s due to bid with ${Math.round(
        timeRemainingMs / 1000
      )}s remaining`,
    });
    await updatedListing.save();
    wasExtended = true;
  }

  // Populate bidder for the response/event
  await bidRecord.populate('bidder', 'name studentId');

  return {
    listing: updatedListing,
    bid: bidRecord,
    wasExtended,
    newClosingTime,
    anonymizedBidder: anonymizeName(bidRecord.bidder?.name),
  };
};

module.exports = {
  placeBidAtomic,
  anonymizeName,
};

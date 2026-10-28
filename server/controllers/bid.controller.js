const Bid = require('../models/Bid');
const asyncHandler = require('../utils/asyncHandler');
const { placeBidAtomic, anonymizeName } = require('../services/bid.service');

/**
 * @desc    Place a bid on an auction
 * @route   POST /api/listings/:id/bids
 * @access  Private
 */
const placeBid = asyncHandler(async (req, res) => {
  const listingId = req.params.id;
  const bidderId = req.user._id;
  const { amount } = req.body;

  const result = await placeBidAtomic(listingId, bidderId, Number(amount));

  // If Socket.IO is active, emit to auction room
  const io = req.app.get('io');
  if (io) {
    // 1. Broadcast new bid event
    io.to(`auction:${listingId}`).emit('new-bid', {
      listingId,
      amount: result.bid.amount,
      currentPrice: result.listing.currentPrice,
      bidCount: result.listing.bidCount,
      createdAt: result.bid.createdAt,
      bidderName: result.anonymizedBidder,
      isAutoBid: result.bid.isAutoBid,
      closingTime: result.listing.closingTime,
    });

    // 2. If auction deadline was extended by anti-snipe rule, broadcast extension
    if (result.wasExtended) {
      io.to(`auction:${listingId}`).emit('auction-extended', {
        listingId,
        newClosingTime: result.newClosingTime,
        message: '⚡ Anti-sniping rule triggered: Auction extended by 60 seconds!',
      });
    }
  }

  res.status(201).json({
    status: 'success',
    message: result.wasExtended
      ? 'Bid placed! Auction extended by 60s (anti-sniping protection).'
      : 'Bid placed successfully!',
    bid: {
      _id: result.bid._id,
      amount: result.bid.amount,
      createdAt: result.bid.createdAt,
      isAutoBid: result.bid.isAutoBid,
      bidder: {
        _id: result.bid.bidder._id,
        name: result.anonymizedBidder,
      },
    },
    listing: {
      _id: result.listing._id,
      currentPrice: result.listing.currentPrice,
      bidCount: result.listing.bidCount,
      closingTime: result.listing.closingTime,
      currentWinner: result.listing.currentWinner,
    },
    wasExtended: result.wasExtended,
    newClosingTime: result.newClosingTime,
  });
});

/**
 * @desc    Get public bid history for an auction
 * @route   GET /api/listings/:id/bids
 * @access  Public
 */
const getBidHistory = asyncHandler(async (req, res) => {
  const listingId = req.params.id;

  const bids = await Bid.find({ listing: listingId })
    .sort({ createdAt: -1 })
    .populate('bidder', 'name')
    .lean();

  // Anonymize bidder name for public view
  const publicBids = bids.map((b) => ({
    _id: b._id,
    amount: b.amount,
    createdAt: b.createdAt,
    isAutoBid: b.isAutoBid,
    bidder: {
      name: anonymizeName(b.bidder?.name),
    },
  }));

  res.status(200).json({
    status: 'success',
    count: publicBids.length,
    bids: publicBids,
  });
});

/**
 * @desc    Get student's own bids across all auctions
 * @route   GET /api/bids/my
 * @access  Private
 */
const getMyBids = asyncHandler(async (req, res) => {
  const bids = await Bid.find({ bidder: req.user._id })
    .sort({ createdAt: -1 })
    .populate({
      path: 'listing',
      select: 'title category currentPrice closingTime status images currentWinner startingPrice',
    })
    .lean();

  res.status(200).json({
    status: 'success',
    bids,
  });
});

module.exports = {
  placeBid,
  getBidHistory,
  getMyBids,
};

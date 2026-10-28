const mongoose = require('mongoose');

const autoBidSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: [true, 'Listing reference is required'],
    },
    bidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Bidder reference is required'],
    },
    maxAmount: {
      type: Number,
      required: [true, 'Maximum bid amount is required'],
      min: [1, 'Maximum bid amount must be at least ₹1'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Indexes: Ensure one active auto-bid per student per auction
autoBidSchema.index({ listing: 1, bidder: 1, isActive: 1 });
autoBidSchema.index({ listing: 1, isActive: 1, createdAt: 1 });

const AutoBid = mongoose.model('AutoBid', autoBidSchema);

module.exports = AutoBid;

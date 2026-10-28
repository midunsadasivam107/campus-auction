const mongoose = require('mongoose');
const { CATEGORIES, CONDITIONS, LISTING_STATUS } = require('../utils/constants');

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String },
  },
  { _id: false }
);

const listingSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: CATEGORIES,
        message: '{VALUE} is not a valid category',
      },
    },
    condition: {
      type: String,
      required: [true, 'Condition is required'],
      enum: {
        values: CONDITIONS,
        message: '{VALUE} is not a valid condition',
      },
    },
    images: {
      type: [imageSchema],
      default: [],
      validate: {
        validator: function (val) {
          return val.length <= 5;
        },
        message: 'A maximum of 5 images are allowed',
      },
    },
    startingPrice: {
      type: Number,
      required: [true, 'Starting price is required'],
      min: [1, 'Starting price must be at least ₹1'],
    },
    minBidIncrement: {
      type: Number,
      required: [true, 'Minimum bid increment is required'],
      min: [1, 'Minimum bid increment must be at least ₹1'],
      default: 10,
    },
    currentPrice: {
      type: Number,
      default: null,
    },
    currentWinner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    bidCount: {
      type: Number,
      default: 0,
    },
    closingTime: {
      type: Date,
      required: [true, 'Closing date and time is required'],
    },
    originalClosingTime: {
      type: Date,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(LISTING_STATUS),
      default: LISTING_STATUS.ACTIVE,
    },
    statusHistory: [statusHistorySchema],
    closedAt: { type: Date },
    approvedAt: { type: Date },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Indexes
listingSchema.index({ status: 1, closingTime: 1 });
listingSchema.index({ seller: 1, status: 1 });
listingSchema.index({ category: 1, status: 1 });
listingSchema.index({ currentPrice: 1 });
listingSchema.index({ title: 'text', description: 'text' });

// Pre-save hook to initialize currentPrice and history
listingSchema.pre('save', function (next) {
  if (this.isNew) {
    if (this.currentPrice === null || this.currentPrice === undefined) {
      this.currentPrice = this.startingPrice;
    }
    if (!this.originalClosingTime) {
      this.originalClosingTime = this.closingTime;
    }
    if (!this.statusHistory || this.statusHistory.length === 0) {
      this.statusHistory = [{ status: this.status, timestamp: new Date(), note: 'Listing created' }];
    }
  }
  next();
});

const Listing = mongoose.model('Listing', listingSchema, 'listings');

module.exports = Listing;

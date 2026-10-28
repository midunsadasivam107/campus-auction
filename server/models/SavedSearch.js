const mongoose = require('mongoose');

const savedSearchSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    label: {
      type: String,
      required: [true, 'Label is required'],
      trim: true,
      maxlength: [200, 'Label cannot exceed 200 characters'],
    },
    filters: {
      query: { type: String, trim: true },
      category: { type: String },
      condition: { type: String },
      minPrice: { type: Number },
      maxPrice: { type: Number },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastMatchedAt: {
      type: Date,
      default: null,
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

savedSearchSchema.index({ user: 1, isActive: 1 });

const SavedSearch = mongoose.model('SavedSearch', savedSearchSchema);

module.exports = SavedSearch;

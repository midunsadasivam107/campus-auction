const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: [true, 'Listing reference is required'],
    },
    asker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Asker reference is required'],
    },
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true,
      minlength: [5, 'Question must be at least 5 characters'],
      maxlength: [1000, 'Question cannot exceed 1000 characters'],
    },
    answer: {
      type: String,
      trim: true,
      maxlength: [2000, 'Answer cannot exceed 2000 characters'],
      default: null,
    },
    answeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    answeredAt: {
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

questionSchema.index({ listing: 1, createdAt: -1 });
questionSchema.index({ asker: 1, createdAt: -1 });

const Question = mongoose.model('Question', questionSchema, 'questions');

module.exports = Question;

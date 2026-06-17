// src/models/Upvote.js
// ─────────────────────────────────────────────────────────────
// Upvote Model (Mongoose Schema)
//
// Relational schema to track upvotes individually to avoid
// unbounded array growth on hot Complaint documents.
// ─────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

const upvoteSchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee uniqueness of upvotes per user per complaint
upvoteSchema.index({ complaintId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Upvote', upvoteSchema);

// src/models/Notification.js
// ─────────────────────────────────────────────────────────────
// Notification Model (Mongoose Schema)
//
// Notifications are generated automatically by the backend
// when specific events occur:
//   - A complaint's status is updated by department staff
//   - Another citizen upvotes your complaint
//
// Previously this was done inside the Flutter app itself
// (in firebase_service.dart). The problem with that approach:
//   - Every client has to run the logic - wasteful and
//     inconsistent if different app versions have different code.
//   - The app can't generate notifications for web portal actions.
//
// By moving this to the backend, ONE place handles notifications
// for BOTH the Flutter app AND the web portal. Consistent.
// ─────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    // The user who RECEIVES this notification
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // The complaint that triggered this notification
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
    },
    type: {
      type: String,
      enum: ['status_update', 'upvote', 'new_complaint'],
      required: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index on (userId, read) for fast "get unread notifications for user" queries
notificationSchema.index({ userId: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);

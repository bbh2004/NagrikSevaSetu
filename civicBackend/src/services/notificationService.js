// src/services/notificationService.js
// ─────────────────────────────────────────────────────────────
// Notification Service (Business Logic)
//
// This service is responsible for creating notifications.
// Previously this logic lived in the Flutter app (firebase_service.dart).
//
// WHY move it to the backend?
//   Clean Architecture rule: Business logic belongs in services,
//   not in clients. The backend is the single source of truth.
//
//   This means:
//   - Web portal actions (status updates) will ALSO trigger
//     notifications to the Flutter app. Previously, only the
//     app could trigger notifications.
//   - You change notification logic in ONE place, not in both
//     the Flutter and React codebases.
//
// This is a "pure" service - it only handles Mongoose operations.
// It knows nothing about HTTP, req, or res.
// ─────────────────────────────────────────────────────────────

const Notification = require('../models/Notification');
const User = require('../models/User');
const admin = require('firebase-admin');

/**
 * Creates a notification document in MongoDB.
 * @param {Object} params
 * @param {mongoose.Types.ObjectId} params.userId - The recipient's MongoDB _id
 * @param {mongoose.Types.ObjectId} params.complaintId - The complaint's MongoDB _id
 * @param {string} params.type - 'status_update' | 'upvote' | 'new_complaint'
 * @param {string} params.message - Human-readable notification message
 */
const createNotification = async ({ userId, complaintId, type, message }) => {
  try {
    const notification = new Notification({ userId, complaintId, type, message });
    await notification.save();

    const user = await User.findById(userId);
    if (user && user.fcmTokens && user.fcmTokens.length > 0) {
      const payload = {
        notification: {
          title: 'Civic Update',
          body: message,
        },
        data: {
          complaintId: complaintId.toString(),
          type: type,
        }
      };
      
      await admin.messaging().sendEachForMulticast({
        tokens: user.fcmTokens,
        ...payload
      });
    }

    return notification;
  } catch (error) {
    // Notifications are non-critical. We log the error but don't
    // throw it - we don't want a notification failure to cause
    // the main operation (e.g., status update) to fail.
    console.error(`[NotificationService] Failed to create notification: ${error.message}`);
    return null;
  }
};

module.exports = { createNotification };

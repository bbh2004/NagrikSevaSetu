// src/controllers/notificationController.js
// ─────────────────────────────────────────────────────────────
// Notification Controller
//
// Routes:
//   GET   /api/notifications      → Get all notifications for current user
//   PATCH /api/notifications/:id/read  → Mark one as read
//   PATCH /api/notifications/read-all  → Mark all as read
// ─────────────────────────────────────────────────────────────

const Notification = require('../models/Notification');

/**
 * GET /api/notifications
 * Fetches all notifications for the currently authenticated user.
 * @access Private
 */
const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.dbUser._id })
      .sort({ createdAt: -1 })
      .limit(50) // Cap at 50 to avoid sending too much data
      .populate('complaintId', 'category description status') // Fetch complaint details
      .lean();

    // Count unread for the app's notification badge
    const unreadCount = await Notification.countDocuments({
      userId: req.dbUser._id,
      read: false,
    });

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Marks a single notification as read.
 * @access Private
 */
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.dbUser._id, // Security: ensure user owns this notification
      },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/notifications/read-all
 * Marks all of the user's notifications as read.
 * @access Private
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.dbUser._id, read: false },
      { read: true }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead };

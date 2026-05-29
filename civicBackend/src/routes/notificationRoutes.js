// src/routes/notificationRoutes.js

const express = require('express');
const router = express.Router();

const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notificationController');
const { verifyFirebaseToken } = require('../middleware/auth');

// All notification routes require authentication
router.use(verifyFirebaseToken);

// GET  /api/notifications            → Get all notifications for current user
router.get('/', getMyNotifications);

// PATCH /api/notifications/read-all  → Mark ALL as read
// NOTE: This MUST come before /:id or 'read-all' would be matched as an ID
router.patch('/read-all', markAllAsRead);

// PATCH /api/notifications/:id/read  → Mark one notification as read
router.patch('/:id/read', markAsRead);

module.exports = router;

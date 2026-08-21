// src/routes/userRoutes.js
// Routes for user profile management

const express = require('express');
const router = express.Router();

const { syncUser, getMyProfile, changeDeptPassword, registerFcmToken } = require('../controllers/userController');
const { verifyFirebaseToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

// POST /api/users/sync
// Called after Firebase sign-up/sign-in to create/update user in MongoDB
router.post('/sync', verifyFirebaseToken, validate(schemas.syncUser), syncUser);

// GET /api/users/me
// Get current user's profile
router.get('/me', verifyFirebaseToken, getMyProfile);

// POST /api/users/admin/change-dept-password
// Allow admin to reset a department password
router.post('/admin/change-dept-password', verifyFirebaseToken, changeDeptPassword);

// POST /api/users/fcm-token
// Register a device FCM token for push notifications
router.post('/fcm-token', verifyFirebaseToken, registerFcmToken);

module.exports = router;

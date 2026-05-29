// src/routes/userRoutes.js
// Routes for user profile management

const express = require('express');
const router = express.Router();

const { syncUser, getMyProfile } = require('../controllers/userController');
const { verifyFirebaseToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

// POST /api/users/sync
// Called after Firebase sign-up/sign-in to create/update user in MongoDB
router.post('/sync', verifyFirebaseToken, validate(schemas.syncUser), syncUser);

// GET /api/users/me
// Get current user's profile
router.get('/me', verifyFirebaseToken, getMyProfile);

module.exports = router;

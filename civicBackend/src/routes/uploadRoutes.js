// src/routes/uploadRoutes.js

const express = require('express');
const router = express.Router();

const { getUploadSignature } = require('../controllers/uploadController');
const { verifyFirebaseToken } = require('../middleware/auth');

// GET /api/upload/signature
// Returns a Cloudinary signed upload signature
router.get('/signature', verifyFirebaseToken, getUploadSignature);

module.exports = router;

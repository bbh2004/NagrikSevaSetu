// src/config/cloudinary.js
// ─────────────────────────────────────────────────────────────
// Cloudinary SDK Configuration
//
// Previously in the Flutter app, images were uploaded DIRECTLY
// from the phone to Cloudinary using an unsecured "upload preset".
//
// The NEW (more secure) approach is:
//   1. Flutter app asks our backend for a "signed upload signature"
//   2. Backend generates a time-limited cryptographic signature
//      using the API Secret (which NEVER leaves the backend)
//   3. Flutter uses that signature to upload directly to Cloudinary
//   4. Cloudinary verifies the signature and accepts the upload
//
// This means our API Secret is never exposed in the mobile app.
// We can also use this module to delete images from Cloudinary
// when a complaint is removed.
// ─────────────────────────────────────────────────────────────

const cloudinary = require('cloudinary').v2;

const initializeCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true, // Always use HTTPS
  });

  console.log('✅ Cloudinary Configured');
  return cloudinary;
};

module.exports = { initializeCloudinary, cloudinary };

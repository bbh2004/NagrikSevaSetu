// src/controllers/uploadController.js
// ─────────────────────────────────────────────────────────────
// Upload Controller - Cloudinary Signed Upload
//
// WHY a separate upload controller?
//   Currently, the Flutter app uploads images DIRECTLY to
//   Cloudinary using an "unsigned" upload preset. This is OK
//   for hackathons but has a problem: anyone can upload to
//   your Cloudinary account if they find the cloud name and
//   preset in the APK.
//
//   The SECURE approach uses SIGNED uploads:
//   1. Flutter calls GET /api/upload/signature
//   2. Backend generates a time-limited signature using the
//      API Secret (which never leaves the backend)
//   3. Flutter uses the signature to upload directly to Cloudinary
//   4. Cloudinary validates the signature and accepts the upload
//
//   For now we generate the signature. Direct uploads from the
//   app to Cloudinary are still supported for backward compatibility.
// ─────────────────────────────────────────────────────────────

const { cloudinary } = require('../config/cloudinary');

/**
 * GET /api/upload/signature
 * Generates a signed Cloudinary upload signature.
 * The Flutter/Web client uses this to securely upload files.
 * @access Private
 */
const getUploadSignature = (req, res, next) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = `civic_complaints/${req.dbUser._id}`; // Organize by user

    // Parameters that MUST match what the client sends to Cloudinary
    const paramsToSign = {
      timestamp,
      folder,
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || 'civic_sih2025',
    };

    // Generate the signature using our secret key
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    res.status(200).json({
      success: true,
      data: {
        signature,
        timestamp,
        folder,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || 'civic_sih2025',
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUploadSignature };

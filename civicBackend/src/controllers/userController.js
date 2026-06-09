// src/controllers/userController.js
// ─────────────────────────────────────────────────────────────
// User Controller
//
// A controller's ONLY job is:
//   1. Extract data from the HTTP request (req.body, req.params)
//   2. Call the appropriate service or Model
//   3. Send back an HTTP response
//
// Controllers should have NO business logic. They are thin
// wrappers between HTTP and your services/models.
//
// Routes in this controller:
//   POST /api/users/sync   → Create or update user in MongoDB
//   GET  /api/users/me     → Get current user's profile
// ─────────────────────────────────────────────────────────────

const User = require('../models/User');

/**
 * POST /api/users/sync
 *
 * WHY does this endpoint exist?
 *   When a user signs up via Firebase Auth (on the Flutter app),
 *   they exist in Firebase's system but NOT in our MongoDB.
 *   This endpoint is called right after successful signup/login
 *   to create (or update) their profile in our database.
 *
 *   We use "upsert" (update-or-insert): if the user already
 *   exists, update their info; if not, create them. This makes
 *   the call idempotent (safe to call multiple times).
 *
 * @access Private (requires Firebase token)
 */
const syncUser = async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;
    const firebaseUid = req.user.uid; // From verifyFirebaseToken middleware

    // findOneAndUpdate with upsert:true creates the doc if it doesn't exist
    // new:true returns the updated document (not the old one)
    const user = await User.findOneAndUpdate(
      { firebaseUid },                   // Find by Firebase UID
      { firebaseUid, name, email, phone }, // Set these fields
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'User synced successfully',
      data: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        // Alias department as deptCategory for frontend compatibility.
        // The React AuthContext reads 'deptCategory' for routing decisions.
        department: user.department,
        deptCategory: user.department,
      },
    });
  } catch (error) {
    next(error); // Pass to global error handler
  }
};

/**
 * GET /api/users/me
 * Returns the currently authenticated user's profile.
 * @access Private
 */
const getMyProfile = async (req, res, next) => {
  try {
    // req.dbUser is already populated by the auth middleware
    const user = req.dbUser;

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        department: user.department,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { syncUser, getMyProfile };

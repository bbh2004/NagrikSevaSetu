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
const admin = require('firebase-admin');

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
    const { name, phone } = req.body;
    const email = req.user.email || ''; // Always from the verified Firebase ID token
    const firebaseUid = req.user.uid; // From verifyFirebaseToken middleware

    // First try to find by firebaseUid
    let user = await User.findOne({ firebaseUid });
    
    if (!user) {
      // If not found by UID, check if email exists (user recreated Firebase account)
      user = await User.findOne({ email });
      if (user) {
        // Re-link the new Firebase UID to the existing MongoDB user
        user.firebaseUid = firebaseUid;
        user.name = name;
        if (phone) user.phone = phone;
        await user.save();
      } else {
        // Completely new user
        user = await User.create({ firebaseUid, name, email, phone });
      }
    } else {
      // User exists with this UID, just update their details
      user.name = name;
      if (phone) user.phone = phone;
      await user.save();
    }

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

const changePasswordDone = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    await admin.auth().updateUser(req.dbUser.firebaseUid, {
      password: newPassword,
    });

    req.dbUser.mustChangePassword = false;
    await req.dbUser.save();
    res.status(200).json({
      success: true,
      message: 'Password successfully changed.',
    });
  } catch (error) {
    next(error);
  }
};

const registerFcmToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'FCM token is required.' });
    }
    const User = require('../models/User');

    // Remove this token from ALL users to ensure it's only tied to the currently logged in user
    await User.updateMany(
      { fcmTokens: token },
      { $pull: { fcmTokens: token } }
    );

    // Add it strictly to the current user
    if (!req.dbUser.fcmTokens.includes(token)) {
      req.dbUser.fcmTokens.push(token);
      await req.dbUser.save();
    }

    res.status(200).json({
      success: true,
      message: 'FCM token registered successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { syncUser, getMyProfile, changePasswordDone, registerFcmToken };

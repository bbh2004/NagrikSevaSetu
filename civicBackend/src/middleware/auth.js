// src/middleware/auth.js
// ─────────────────────────────────────────────────────────────
// Authentication & Authorization Middleware
//
// THIS IS THE MOST IMPORTANT SECURITY FILE IN THE BACKEND.
//
// How it works (step by step):
//
//  1. Flutter/React app calls Firebase Auth (login) and gets
//     back an "ID Token" (a long JWT string).
//
//  2. The app puts this token in every API request:
//     Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
//
//  3. THIS MIDDLEWARE intercepts the request before it reaches
//     any controller. It:
//       a) Extracts the token from the header
//       b) Calls Firebase Admin SDK's verifyIdToken()
//       c) If valid: Firebase returns the decoded user info
//          (uid, email, etc.). We attach it to req.user.
//       d) If invalid: We return 401 Unauthorized immediately.
//          The request never reaches the controller.
//
//  4. Controllers can then safely use req.user.uid to know
//     WHO is making the request, without trusting the client.
//
// This is the "bouncer" pattern. Every protected route has this
// middleware as a gatekeeper.
// ─────────────────────────────────────────────────────────────

const admin = require('firebase-admin');
const User = require('../models/User');

/**
 * verifyFirebaseToken
 * Middleware to authenticate any incoming request.
 * Attaches req.user (Firebase decoded token) and req.dbUser (MongoDB user doc).
 */
const verifyFirebaseToken = async (req, res, next) => {
  try {
    // 1. Extract the token from the Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided. Include "Authorization: Bearer <token>" header.',
      });
    }

    const idToken = authHeader.split('Bearer ')[1];

    // 2. Verify the token with Firebase Admin SDK
    // This call hits Firebase's servers to validate the token's signature.
    // It throws an error if the token is expired, tampered, or invalid.
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // 3. Attach the decoded Firebase info to the request object
    // Available in all subsequent middleware and controllers as req.user
    req.user = decodedToken; // Contains: uid, email, name, etc.

    // 4. Look up the user in OUR MongoDB database
    // This gives us our role (citizen/admin/staff) and MongoDB _id
    const dbUser = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!dbUser) {
      // User is authenticated with Firebase but not registered in our DB.
      // This can happen if the user was created on Firebase but our
      // POST /api/users/sync endpoint was never called.
      return res.status(403).json({
        success: false,
        message: 'User account not found in database. Please sync your account first.',
      });
    }

    // 5. Attach MongoDB user to the request
    req.dbUser = dbUser; // Contains: _id, role, department, etc.

    next(); // 🟢 All good, pass to the next middleware/controller
  } catch (error) {
    // Firebase throws specific error codes we can inspect
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please log in again.',
      });
    }
    if (error.code === 'auth/argument-error' || error.code === 'auth/invalid-id-token') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Authentication failed.',
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication service error.',
    });
  }
};

/**
 * requireRole
 * Authorization middleware factory.
 * Usage: router.get('/admin-only', verifyFirebaseToken, requireRole('admin'), controller)
 *
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'department_staff')
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    // verifyFirebaseToken must run BEFORE this middleware
    if (!req.dbUser) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    if (!roles.includes(req.dbUser.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.dbUser.role}`,
      });
    }

    next(); // ✅ User has the right role
  };
};

module.exports = { verifyFirebaseToken, requireRole };

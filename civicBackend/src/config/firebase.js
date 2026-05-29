// src/config/firebase.js
// ─────────────────────────────────────────────────────────────
// Firebase Admin SDK Initialization
//
// Why Firebase Admin on the BACKEND?
//   The Firebase CLIENT SDK (used in Flutter/React) logs users
//   in and gives them a JWT token (ID Token).
//   The Firebase ADMIN SDK (used here) verifies that token.
//
//   Think of it like a concert:
//   - The CLIENT SDK = gives the user a ticket.
//   - The ADMIN SDK  = is the bouncer who checks if the ticket is real.
//
//   Without this, anyone could forge a request and pretend to be
//   any user. This is the #1 security feature we are adding.
//
// The private key is read from environment variables, NOT hardcoded.
// ─────────────────────────────────────────────────────────────

const admin = require('firebase-admin');

const initializeFirebaseAdmin = () => {
  // Only initialize once (important when using hot-reload in dev)
  if (admin.apps.length > 0) {
    return admin;
  }

  // The private key is stored in .env with \n as literal characters.
  // We replace them with real newlines for the SDK to parse correctly.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!privateKey || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
    throw new Error(
      '❌ Firebase Admin credentials missing. Check your .env file for FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.'
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });

  console.log('✅ Firebase Admin SDK Initialized');
  return admin;
};

module.exports = initializeFirebaseAdmin;

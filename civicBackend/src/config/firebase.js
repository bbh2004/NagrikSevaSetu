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
const path = require('path');
const fs = require('fs');

const initializeFirebaseAdmin = () => {
  // Only initialize once (important when using hot-reload in dev)
  if (admin.apps.length > 0) {
    return admin;
  }

  // Path to the securely stored service account key
  const keyPath = path.join(__dirname, '../../firebase-admin-key.json');

  if (fs.existsSync(keyPath)) {
    // If the file exists, initialize using the file directly
    const raw = fs.readFileSync(keyPath, 'utf8');
    const serviceAccount = JSON.parse(raw);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin SDK Initialized (Using local JSON key)');
  } else {
    // Fallback for production (Render/Railway) where we use environment variables
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!privateKey || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
      throw new Error(
        '❌ Firebase Admin credentials missing. Missing firebase-admin-key.json OR .env variables.'
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
    console.log('✅ Firebase Admin SDK Initialized (Using .env variables)');
  }

  return admin;
};

module.exports = initializeFirebaseAdmin;

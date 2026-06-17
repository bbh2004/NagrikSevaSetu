// src/models/User.js
// ─────────────────────────────────────────────────────────────
// User Model (Mongoose Schema)
//
// What's happening here?
//   Mongoose lets us define a "schema" - a strict contract for
//   what data is allowed into our MongoDB collection.
//   If you try to save a user without an 'email', Mongoose
//   will throw a ValidationError BEFORE it even touches the DB.
//
//   This is different from Firestore, which lets you save ANY
//   object - including typos and wrong data types - without
//   complaining.
//
// Key fields:
//   - firebaseUid: This is the link between Firebase Auth and
//     our MongoDB. When a user signs up via Firebase, we get
//     a UID. We store that UID here so we can always look up
//     a user's MongoDB document from their Firebase token.
//   - role: 'citizen', 'department_staff', or 'admin'. This
//     drives authorization on every protected endpoint.
// ─────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    // The Firebase UID from Firebase Auth (e.g., "Abc123xyz")
    // This is our bridge between Firebase and MongoDB.
    firebaseUid: {
      type: String,
      required: [true, 'Firebase UID is required'],
      unique: true,
      index: true, // We'll look this up on EVERY request, so index it
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true, // Always store as lowercase to prevent duplicates
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    role: {
      type: String,
      enum: {
        values: ['citizen', 'department_staff', 'admin', 'main_officer'],
        message: 'Role must be citizen, department_staff, admin, or main_officer',
      },
      default: 'citizen',
    },
    // Only relevant for department_staff role
    department: {
      type: String,
      enum: {
        values: ['Sanitation', 'Water', 'Electrical', 'Road', 'Others'],
        message: 'Department must be one of: Sanitation, Water, Electrical, Road, Others',
      },
      required: function () {
        return this.role === 'department_staff';
      },
      default: undefined,
    },
    // Firebase Cloud Messaging (FCM) tokens for push notifications
    fcmTokens: [
      {
        type: String,
      },
    ],
    // Force staff to change password on first login
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
  },
  {
    // Automatically add 'createdAt' and 'updatedAt' timestamps
    // to every document. No need to manage these manually.
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);

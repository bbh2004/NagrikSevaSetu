// src/models/Complaint.js
// ─────────────────────────────────────────────────────────────
// Complaint Model (Mongoose Schema)
//
// This is the MOST IMPORTANT model. It represents a civic
// complaint submitted by a citizen.
//
// Key design decisions:
//   1. userId: Stores the MongoDB User _id (an ObjectId). This
//      creates a proper "foreign key" relationship. We can use
//      .populate('userId') to fetch user details in one query.
//
//   2. upvotedBy: An ARRAY of User ObjectIds. To check if a
//      user has upvoted, we just check if their ID is in this
//      array. The 'upvotes' field is the count for fast reads.
//      We keep both for performance.
//
//   3. urgency: Initially 'Medium'. After saving, our AI service
//      will update this based on the description text. This is
//      the Phase 2.3 feature.
//
//   4. location: GeoJSON format. This is MongoDB's native
//      geospatial format. Using this allows us to run queries
//      like "find all complaints within 5km of this point".
//      (Phase 2.5 feature)
// ─────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    // Reference to the User who filed this complaint
    // ObjectId is MongoDB's auto-generated unique ID type
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Tells Mongoose this links to the 'User' model
      required: [true, 'User ID is required'],
      index: true,
    },
    // Also store the Firebase UID for easy cross-reference
    // without having to join to the User collection every time
    firebaseUid: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['Sanitation', 'Water', 'Electrical', 'Road', 'Others'],
        message: 'Invalid category. Choose from: Sanitation, Water, Electrical, Road, Others',
      },
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
        message: 'Invalid status',
      },
      default: 'Pending',
    },
    urgency: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium', // AI will update this after submission
    },
    // Cloudinary image URL
    imageUrl: {
      type: String,
      default: null,
    },
    // Cloudinary voice note URL (Phase 2.3)
    voiceNoteUrl: {
      type: String,
      default: null,
    },
    // Upvote count - denormalized for fast reads (no aggregation needed)
    upvotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Array of User ObjectIds who have upvoted this complaint.
    // We use this to prevent double-voting and to undo upvotes.
    upvotedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // GeoJSON Point format - enables MongoDB's native geo queries
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude] - NOTE: GeoJSON is lng,lat order
        required: [true, 'Location coordinates are required'],
        validate: {
          validator: function (v) {
            return v.length === 2 && v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90;
          },
          message: 'Invalid coordinates. Must be [longitude, latitude]',
        },
      },
    },
    // Status history for auditing
    statusHistory: [
      {
        status: { type: String, required: true },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        changedAt: { type: Date, default: Date.now },
        note: { type: String, default: '' },
      },
    ],
    // Tracking AI urgency classification status
    urgencyClassification: {
      type: String,
      enum: ['pending', 'done', 'failed'],
      default: 'pending',
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Create a 2dsphere index on location for geospatial queries.
// This is what makes "find nearby complaints" possible.
complaintSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Complaint', complaintSchema);

// src/controllers/complaintController.js
// ─────────────────────────────────────────────────────────────
// Complaint Controller - The Heart of the Backend
//
// This is the most feature-rich controller. It handles:
//   POST   /api/complaints          → Submit a new complaint
//   GET    /api/complaints          → Get all complaints (with filtering)
//   GET    /api/complaints/:id      → Get one complaint by ID
//   GET    /api/complaints/mine     → Get logged-in user's complaints
//   PATCH  /api/complaints/:id/status   → Update status (staff only)
//   POST   /api/complaints/:id/upvote  → Toggle upvote
//
// Each function is async and wrapped with try/catch → next(error)
// so errors bubble up to the global errorHandler middleware.
// ─────────────────────────────────────────────────────────────

const Complaint = require('../models/Complaint');
const { createNotification } = require('../services/notificationService');
const { detectAndUpdateUrgency } = require('../services/urgencyService');

/**
 * POST /api/complaints
 * Creates a new complaint. Available to authenticated citizens.
 * @access Private (citizen, admin)
 */
const createComplaint = async (req, res, next) => {
  try {
    const { category, description, lat, lng, imageUrl, voiceNoteUrl } = req.body;

    // Build the GeoJSON location object MongoDB understands
    // IMPORTANT: GeoJSON uses [longitude, latitude] order, NOT [lat, lng]
    const location = {
      type: 'Point',
      coordinates: [lng, lat], // [longitude, latitude]
    };

    const complaint = new Complaint({
      userId: req.dbUser._id,
      firebaseUid: req.user.uid,
      category,
      description,
      location,
      imageUrl: imageUrl || null,
      voiceNoteUrl: voiceNoteUrl || null,
    });

    const savedComplaint = await complaint.save();

    // ─── AI URGENCY DETECTION (Fire and Forget) ───────────────
    // We do NOT await this. The complaint is already saved.
    // This runs in the background and updates the urgency field
    // when the Gemini API responds (~1-2 seconds later).
    detectAndUpdateUrgency(savedComplaint._id.toString(), description);

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      data: savedComplaint,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/complaints
 * Fetch all complaints with optional filtering and pagination.
 * Query params: category, status, urgency, page, limit, sortBy
 * @access Private
 */
const getAllComplaints = async (req, res, next) => {
  try {
    const { category, status, urgency, page = 1, limit = 20, sortBy = 'createdAt' } = req.query;

    // Build a dynamic MongoDB filter object
    // Only add fields to the filter if they were actually passed as query params
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (urgency) filter.urgency = urgency;

    // Department staff can ONLY see their own department's complaints.
    // Admins and main_officers see everything (no extra filter applied).
    if (req.dbUser.role === 'department_staff' && req.dbUser.department) {
      filter.category = req.dbUser.department;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Complaint.countDocuments(filter);

    const complaints = await Complaint.find(filter)
      .sort({ [sortBy]: -1 }) // Sort descending (newest first)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email') // Join User data into the complaint
      .lean(); // Return plain JS objects (faster than full Mongoose docs)

    res.status(200).json({
      success: true,
      data: complaints,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/complaints/mine
 * Get all complaints submitted by the currently logged-in user.
 * @access Private
 */
const getMyComplaints = async (req, res, next) => {
  try {
    const complaints = await Complaint.find({ userId: req.dbUser._id })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: complaints,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/complaints/:id
 * Get a single complaint by its MongoDB ID.
 * @access Private
 */
const getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('userId', 'name email phone')
      .lean();

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      });
    }

    res.status(200).json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    next(error); // CastError (invalid ID format) is handled in errorHandler.js
  }
};

/**
 * PATCH /api/complaints/:id/status
 * Update a complaint's status. Only accessible by staff/admin.
 * This also triggers a notification to the complaint owner.
 * @access Private (department_staff, admin)
 */
const updateComplaintStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Department staff can only update complaints in their own department
    if (
      req.dbUser.role === 'department_staff' &&
      req.dbUser.department !== complaint.category
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only update complaints in your own department.',
      });
    }

    const previousStatus = complaint.status;
    complaint.status = status;
    await complaint.save();

    // ─── CREATE NOTIFICATION ──────────────────────────────────
    // Notify the complaint owner that their status was updated.
    // This runs asynchronously (non-blocking).
    if (complaint.userId && previousStatus !== status) {
      createNotification({
        userId: complaint.userId, // Recipient = the citizen who filed the complaint
        complaintId: complaint._id,
        type: 'status_update',
        message: `Your complaint "${complaint.category}" status has been updated to "${status}".`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Status updated to ${status}`,
      data: { id: complaint._id, status: complaint.status },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/complaints/:id/upvote
 * Toggle upvote on a complaint. Calling this endpoint again removes the upvote.
 * @access Private (citizen, admin)
 */
const toggleUpvote = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    const userId = req.dbUser._id;

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Check if this user has already upvoted
    const hasUpvoted = complaint.upvotedBy.some((id) => id.equals(userId));

    if (hasUpvoted) {
      // Remove upvote: pull from array and decrement count
      complaint.upvotedBy.pull(userId);
      complaint.upvotes = Math.max(0, complaint.upvotes - 1); // Never go below 0
    } else {
      // Add upvote: push to array and increment count
      complaint.upvotedBy.push(userId);
      complaint.upvotes += 1;

      // Notify the complaint owner (only when adding, not removing)
      if (complaint.userId && !complaint.userId.equals(userId)) {
        createNotification({
          userId: complaint.userId,
          complaintId: complaint._id,
          type: 'upvote',
          message: `Someone upvoted your complaint "${complaint.category}".`,
        });
      }
    }

    await complaint.save();

    res.status(200).json({
      success: true,
      data: {
        upvotes: complaint.upvotes,
        hasUpvoted: !hasUpvoted, // Return the NEW state
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/complaints/stats
 * Aggregate statistics for the admin dashboard.
 * Scopes results by department for department_staff; main_officer and admin see all.
 * @access Private (admin, main_officer, department_staff)
 */
const getStats = async (req, res, next) => {
  try {
    // Build filter based on role. Department staff are scoped to their category.
    const matchFilter = {};
    if (req.dbUser.role === 'department_staff' && req.dbUser.department) {
      matchFilter.category = req.dbUser.department;
    }

    // MongoDB Aggregation Pipeline — server-side counting (fast, no client loops needed)
    const stats = await Complaint.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } },
          highUrgency: { $sum: { $cond: [{ $eq: ['$urgency', 'High'] }, 1, 0] } },
        },
      },
    ]);

    // Count by category — used by Analytics bar chart
    const byCategory = await Complaint.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$category', count: { $sum: 1 }, resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } } } },
      { $sort: { count: -1 } },
    ]);

    // Count by day for last 14 days — used by Analytics line chart
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const byDay = await Complaint.aggregate([
      { $match: { ...matchFilter, createdAt: { $gte: fourteenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Status breakdown for Pie chart — pre-computed on server to avoid client-side looping
    const totals = stats[0] || { total: 0, pending: 0, inProgress: 0, resolved: 0, rejected: 0, highUrgency: 0 };
    const byStatus = [
      { name: 'Pending', value: totals.pending },
      { name: 'In Progress', value: totals.inProgress },
      { name: 'Resolved', value: totals.resolved },
      { name: 'Rejected', value: totals.rejected },
    ];

    res.status(200).json({
      success: true,
      data: {
        totals,
        byCategory,
        byDay,
        byStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/complaints/map
 * Returns lightweight complaint data for map rendering within a viewport bounding box.
 * Uses MongoDB $geoWithin to avoid returning the entire complaints collection.
 *
 * Query params: swLat, swLng, neLat, neLng (bounding box corners)
 * Falls back to returning all non-resolved complaints with coordinates if no bbox provided.
 *
 * @access Private (admin, main_officer, department_staff)
 */
const getMapComplaints = async (req, res, next) => {
  try {
    const { swLat, swLng, neLat, neLng } = req.query;

    const filter = { status: { $ne: 'Resolved' } };

    // If viewport bounding box is provided, use geo query (fast, uses 2dsphere index)
    if (swLat && swLng && neLat && neLng) {
      filter.location = {
        $geoWithin: {
          $box: [
            [parseFloat(swLng), parseFloat(swLat)], // SW corner [lng, lat]
            [parseFloat(neLng), parseFloat(neLat)], // NE corner [lng, lat]
          ],
        },
      };
    }

    // Return only the fields the map needs — no heavy description text
    const complaints = await Complaint.find(filter)
      .select('_id category status urgency location upvotes createdAt')
      .limit(500) // Safety cap — no browser should ever render 500+ map pins at once
      .lean();

    res.status(200).json({ success: true, data: complaints });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComplaint,
  getAllComplaints,
  getMyComplaints,
  getComplaintById,
  updateComplaintStatus,
  toggleUpvote,
  getStats,
  getMapComplaints,
};

// src/services/complaintService.js
// ─────────────────────────────────────────────────────────────
// Complaint Service (Business Logic Layer)
// ─────────────────────────────────────────────────────────────

const Complaint = require('../models/Complaint');
const Upvote = require('../models/Upvote');
const User = require('../models/User');
const { createNotification } = require('./notificationService');
const { detectAndUpdateUrgency } = require('./urgencyService');
const { scopeFilterForUser, serializeComplaint } = require('./complaintAccess');

/**
 * Creates a new complaint.
 */
const createComplaint = async (dbUser, firebaseUid, data) => {
  const { category, description, lat, lng, imageUrl, voiceNoteUrl } = data;

  const location = {
    type: 'Point',
    coordinates: [lng, lat],
  };

  const complaint = new Complaint({
    userId: dbUser._id,
    firebaseUid,
    category,
    description: description || '',
    location,
    imageUrl: imageUrl || null,
    voiceNoteUrl: voiceNoteUrl || null,
    urgencyClassification: 'pending',
  });

  // Initialize status history
  complaint.statusHistory.push({
    status: 'Pending',
    changedBy: dbUser._id,
    note: 'Complaint submitted by citizen.',
  });

  const savedComplaint = await complaint.save();

  // Trigger AI urgency detection asynchronously (fire-and-forget).
  // Pass voiceNoteUrl so the service can also transcribe the audio
  // and use the combined text for a more accurate urgency classification.
  detectAndUpdateUrgency(savedComplaint._id.toString(), description, voiceNoteUrl || null);

  return serializeComplaint(savedComplaint, dbUser);
};

/**
 * Lists complaints with pagination and filtering.
 */
const listComplaints = async (dbUser, query) => {
  const { category, status, urgency, page = 1, limit = 20, sortBy = 'createdAt' } = query;

  const ALLOWED_SORT_FIELDS = ['createdAt', 'upvotes', 'urgency'];
  const sortField = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';

  let filter = {};
  if (category) filter.category = category;
  
  if (status) {
    filter.status = status.includes(',') ? { $in: status.split(',') } : status;
  }
  
  if (urgency) filter.urgency = urgency;

  filter = scopeFilterForUser(dbUser, filter);

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Complaint.countDocuments(filter);

  const complaints = await Complaint.find(filter)
    .sort({ [sortField]: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('userId', 'name email phone')
    .lean();

  return {
    data: complaints.map((c) => serializeComplaint(c, dbUser)),
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
};

/**
 * Lists complaints filed by the current user.
 */
const listMyComplaints = async (dbUser) => {
  const complaints = await Complaint.find({ userId: dbUser._id })
    .sort({ createdAt: -1 })
    .lean();

  return complaints.map((c) => serializeComplaint(c, dbUser));
};

/**
 * Retrieves a single complaint by ID.
 */
const getComplaintById = async (dbUser, id) => {
  const complaint = await Complaint.findOne(scopeFilterForUser(dbUser, { _id: id }))
    .populate('userId', 'name email phone')
    .populate({
      path: 'statusHistory.changedBy',
      select: 'name role department',
    });

  if (!complaint) return null;
  return serializeComplaint(complaint, dbUser);
};

/**
 * Updates status of a complaint.
 */
const updateComplaintStatus = async (dbUser, id, status, note = '') => {
  const complaint = await Complaint.findById(id);
  if (!complaint) return { error: 404, message: 'Complaint not found' };

  // Access Control: department staff only update own category
  if (dbUser.role === 'department_staff' && dbUser.department !== complaint.category) {
    return { error: 403, message: 'You can only update complaints in your own department.' };
  }

  const previousStatus = complaint.status;
  if (previousStatus !== status) {
    complaint.status = status;
    complaint.statusHistory.push({
      status,
      changedBy: dbUser._id,
      note: note || `Status updated to ${status} by department staff.`,
    });
    await complaint.save();

    // Trigger Notification
    if (complaint.userId) {
      createNotification({
        userId: complaint.userId,
        complaintId: complaint._id,
        type: 'status_update',
        message: `Your complaint "${complaint.category}" status has been updated to "${status}".`,
      });
    }
  }

  return { data: { id: complaint._id, status: complaint.status } };
};

/**
 * Toggles upvote on a complaint (relational database refactor).
 */
const toggleUpvote = async (dbUser, id) => {
  const complaint = await Complaint.findById(id);
  if (!complaint) return { error: 404, message: 'Complaint not found' };

  const userId = dbUser._id;
  const existingUpvote = await Upvote.findOneAndDelete({ complaintId: id, userId });

  let upvotes;
  if (existingUpvote) {
    const updated = await Complaint.findByIdAndUpdate(id, { $inc: { upvotes: -1 } }, { new: true });
    upvotes = updated.upvotes;
  } else {
    await Upvote.create({ complaintId: id, userId });
    const updated = await Complaint.findByIdAndUpdate(id, { $inc: { upvotes: 1 } }, { new: true });
    upvotes = updated.upvotes;

    // Notify complaint owner
    if (complaint.userId && !complaint.userId.equals(userId)) {
      createNotification({
        userId: complaint.userId,
        complaintId: complaint._id,
        type: 'upvote',
        message: `Someone upvoted your complaint "${complaint.category}".`,
      });
    }
  }

  return { data: { upvotes, hasUpvoted: !existingUpvote } };
};

/**
 * Aggregates statistics for the dashboard.
 */
const getStats = async (dbUser) => {
  const matchFilter = {};
  if (dbUser.role === 'department_staff' && dbUser.department) {
    matchFilter.category = dbUser.department;
  }

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

  const byCategory = await Complaint.aggregate([
    { $match: matchFilter },
    { $group: { _id: '$category', count: { $sum: 1 }, resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } } } },
    { $sort: { count: -1 } },
  ]);

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

  const totals = stats[0] || { total: 0, pending: 0, inProgress: 0, resolved: 0, rejected: 0, highUrgency: 0 };
  const byStatus = [
    { name: 'Pending', value: totals.pending },
    { name: 'In Progress', value: totals.inProgress },
    { name: 'Resolved', value: totals.resolved },
    { name: 'Rejected', value: totals.rejected },
  ];

  return {
    totals,
    byCategory,
    byDay,
    byStatus,
  };
};

/**
 * Returns lightweight complaint data for map viewport rendering.
 */
const getMapComplaints = async (dbUser, query) => {
  const { swLat, swLng, neLat, neLng } = query;

  let filter = scopeFilterForUser(dbUser, { status: { $ne: 'Resolved' } });

  if (swLat && swLng && neLat && neLng) {
    filter.location = {
      $geoWithin: {
        $box: [
          [parseFloat(swLng), parseFloat(swLat)],
          [parseFloat(neLng), parseFloat(neLat)],
        ],
      },
    };
  }

  const complaints = await Complaint.find(filter)
    .select('_id category status urgency location upvotes createdAt')
    .limit(500)
    .lean();

  return complaints;
};

/**
 * Performs a geospatial search for nearby complaints to prevent duplicates.
 */
const getNearbyComplaints = async (lat, lng, category, radiusMeters = 100) => {
  return Complaint.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        distanceField: 'distanceMeters',
        maxDistance: parseFloat(radiusMeters),
        query: { category, status: { $ne: 'Resolved' } },
        spherical: true,
      },
    },
    { $limit: 5 },
    { $project: { description: 1, status: 1, upvotes: 1, distanceMeters: 1, createdAt: 1 } },
  ]);
};

/**
 * Allows a citizen to withdraw their own pending complaint.
 */
const withdrawComplaint = async (dbUser, id) => {
  const complaint = await Complaint.findOne({ _id: id, userId: dbUser._id });
  if (!complaint) return { error: 404, message: 'Complaint not found.' };

  if (complaint.status !== 'Pending') {
    return { error: 409, message: 'Only Pending complaints can be withdrawn.' };
  }

  await complaint.deleteOne();
  return { success: true };
};

module.exports = {
  createComplaint,
  listComplaints,
  listMyComplaints,
  getComplaintById,
  updateComplaintStatus,
  toggleUpvote,
  getStats,
  getMapComplaints,
  getNearbyComplaints,
  withdrawComplaint,
};

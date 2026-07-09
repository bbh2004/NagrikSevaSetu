// src/controllers/complaintController.js
// ─────────────────────────────────────────────────────────────
// Complaint Controller - Thin HTTP wrapper around Complaint Service
// ─────────────────────────────────────────────────────────────

const complaintService = require('../services/complaintService');

const createComplaint = async (req, res, next) => {
  try {
    const data = await complaintService.createComplaint(req.dbUser, req.user.uid, req.body);
    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getAllComplaints = async (req, res, next) => {
  try {
    const result = await complaintService.listComplaints(req.dbUser, req.query);
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const getMyComplaints = async (req, res, next) => {
  try {
    const data = await complaintService.listMyComplaints(req.dbUser);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getComplaintById = async (req, res, next) => {
  try {
    const data = await complaintService.getComplaintById(req.dbUser, req.params.id);
    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      });
    }
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const updateComplaintStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const result = await complaintService.updateComplaintStatus(req.dbUser, req.params.id, status, note);
    if (result.error) {
      return res.status(result.error).json({
        success: false,
        message: result.message,
      });
    }
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const toggleUpvote = async (req, res, next) => {
  try {
    const result = await complaintService.toggleUpvote(req.dbUser, req.params.id);
    if (result.error) {
      return res.status(result.error).json({
        success: false,
        message: result.message,
      });
    }
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    const data = await complaintService.getStats(req.dbUser, req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getMapComplaints = async (req, res, next) => {
  try {
    const data = await complaintService.getMapComplaints(req.dbUser, req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getNearbyComplaints = async (req, res, next) => {
  try {
    const { lat, lng, category, radius } = req.query;
    if (!lat || !lng || !category) {
      return res.status(400).json({
        success: false,
        message: 'lat, lng, and category are required parameters.',
      });
    }
    const VALID_CATEGORIES = ['Sanitation', 'Water', 'Electrical', 'Road', 'Others'];
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid category.' });
    }
    const data = await complaintService.getNearbyComplaints(lat, lng, category, radius);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const withdrawComplaint = async (req, res, next) => {
  try {
    const result = await complaintService.withdrawComplaint(req.dbUser, req.params.id);
    if (result.error) {
      return res.status(result.error).json({
        success: false,
        message: result.message,
      });
    }
    res.status(200).json({
      success: true,
      message: 'Complaint withdrawn successfully',
    });
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
  getNearbyComplaints,
  withdrawComplaint,
};

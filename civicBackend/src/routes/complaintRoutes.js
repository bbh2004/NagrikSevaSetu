// src/routes/complaintRoutes.js
// ─────────────────────────────────────────────────────────────
// Complaint Routes
//
// Route design follows REST conventions:
//   Nouns (not verbs) for resource paths
//   HTTP verbs for actions (GET, POST, PATCH, DELETE)
//
// Middleware stack on each route:
//   1. verifyFirebaseToken  - Authenticate the user
//   2. requireRole(...)     - Authorize specific roles (if needed)
//   3. validate(schema)     - Validate request body (if needed)
//   4. controller function  - Handle the actual logic
// ─────────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();

const {
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
} = require('../controllers/complaintController');

const { verifyFirebaseToken, requireRole } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

// ── All routes below require authentication ──────────────────
router.use(verifyFirebaseToken);

// GET  /api/complaints/stats → MUST come before /:id or Express
//      will try to match "stats" as an ID (and fail)
router.get('/stats', requireRole('admin', 'main_officer', 'department_staff'), getStats);

// GET  /api/complaints/map → Viewport-bounded map pins (uses $geoWithin on 2dsphere index)
//      Must also come before /:id for the same reason as /stats
router.get('/map', requireRole('admin', 'main_officer', 'department_staff'), getMapComplaints);

// GET  /api/complaints/nearby → Search for nearby complaints
//      Must also come before /:id for the same reason
router.get('/nearby', getNearbyComplaints);

// GET  /api/complaints/mine → Get logged-in user's own complaints
router.get('/mine', getMyComplaints);

// GET  /api/complaints      → Get all complaints (with filters)
router.get('/', getAllComplaints);

// POST /api/complaints      → Submit a new complaint
router.post('/', validate(schemas.createComplaint), createComplaint);

// GET  /api/complaints/:id  → Get one complaint by MongoDB ID
router.get('/:id', getComplaintById);

// PATCH /api/complaints/:id/status → Update status (staff/admin/main_officer only)
router.patch(
  '/:id/status',
  requireRole('admin', 'main_officer', 'department_staff'),
  validate(schemas.updateStatus),
  updateComplaintStatus
);

// POST /api/complaints/:id/upvote → Toggle upvote (citizens only)
router.post('/:id/upvote', toggleUpvote);

// DELETE /api/complaints/:id → Withdraw a complaint (citizens only)
router.delete('/:id', withdrawComplaint);

module.exports = router;

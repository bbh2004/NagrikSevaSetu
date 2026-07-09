// src/services/complaintAccess.js
// ─────────────────────────────────────────────────────────────
// Complaint Access Management (Authorization and Serialization)
// ─────────────────────────────────────────────────────────────

/**
 * Returns a MongoDB filter object scoping complaints to what `dbUser` is
 * allowed to see. Citizens see everything EXCEPT other users' PII
 * (handled separately by serializeComplaint, not by this filter) —
 * department_staff are hard-scoped to their own category.
 */
const scopeFilterForUser = (dbUser, baseFilter = {}) => {
  if (dbUser.role === 'department_staff' && dbUser.department) {
    return { ...baseFilter, category: dbUser.department };
  }
  return baseFilter; // admin / main_officer / citizen — no extra DB-level restriction
};

/**
 * Strips PII from the populated `userId` based on the REQUESTING user's role.
 * Citizens (and the public feed) NEVER see another citizen's email/phone —
 * only staff/admin handling the complaint do.
 * Also computes `hasUpvoted` dynamically based on the requesting user.
 */
const serializeComplaint = (complaint, dbUser, hasUpvoted = false) => {
  const c = complaint.toObject ? complaint.toObject() : { ...complaint };
  c.hasUpvoted = hasUpvoted;

  const canSeeReporterPII = ['admin', 'main_officer'].includes(dbUser.role) ||
    (dbUser.role === 'department_staff' && dbUser.department === c.category);

  if (c.userId && typeof c.userId === 'object') {
    c.userId = canSeeReporterPII
      ? { _id: c.userId._id, name: c.userId.name, email: c.userId.email, phone: c.userId.phone }
      : { _id: c.userId._id, name: c.userId.name }; // name only — never email/phone to the public feed
  }

  // Anonymize precise location for non-authorized users (HIGH-03)
  if (!canSeeReporterPII && c.location && c.location.coordinates) {
    const [lng, lat] = c.location.coordinates;
    const grid = 0.001; // roughly 111 meters
    c.location.coordinates = [
      Math.round(lng / grid) * grid,
      Math.round(lat / grid) * grid
    ];
  }

  delete c.upvotedBy; // never ship the raw voter-ID list to the client
  return c;
};

module.exports = { scopeFilterForUser, serializeComplaint };

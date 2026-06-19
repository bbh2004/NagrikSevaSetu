/**
 * civic.js — Shared constants for the civicWeb portal.
 *
 * IMPORTANT: These values are the SINGLE SOURCE OF TRUTH for the frontend.
 * They MUST match the backend's Joi validation schema (validate.js) and
 * Mongoose enum values (Complaint.js, User.js) exactly.
 *
 * Never hardcode category/status/urgency strings inline in components.
 * Always import from here.
 */

// Complaint categories — matches backend Complaint.js enum + Joi schema
export const CATEGORIES = ['Sanitation', 'Water', 'Electrical', 'Road', 'Others']

// Complaint statuses — matches backend Complaint.js enum
export const STATUSES = ['Pending', 'In Progress', 'Resolved', 'Rejected']

// Urgency levels — matches backend Complaint.js enum
export const URGENCY_LEVELS = ['Low', 'Medium', 'High']

// Map of category to display name and icon (emoji for accessibility)
export const CATEGORY_META = {
  Sanitation: { label: 'Sanitation', icon: '🗑️', color: '#f59e0b' },
  Water:      { label: 'Water',      icon: '💧', color: '#3b82f6' },
  Electrical: { label: 'Electrical', icon: '⚡', color: '#eab308' },
  Road:       { label: 'Road',       icon: '🛣️', color: '#6b7280' },
  Others:     { label: 'Others',     icon: '📋', color: '#8b5cf6' },
}

// Map default center — Bangalore (Bengaluru), Karnataka.
// Default zoom 12 gives a good city-wide overview.
// The Dashboard and DepartmentDashboard components dynamically pan to
// the centroid of loaded complaints once data arrives, so this is only
// the initial load position for officers logging in for the first time.
export const MAP_DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946 }
export const MAP_DEFAULT_ZOOM   = 12

// Urgency badge variant mapping for the ui.jsx Badge component
export const urgencyVariant = (urgency) => {
  if (urgency === 'High')   return 'danger'
  if (urgency === 'Medium') return 'warning'
  return 'default'
}

// Status badge variant mapping
export const statusVariant = (status) => {
  if (status === 'Resolved')    return 'success'
  if (status === 'Rejected')    return 'danger'
  if (status === 'In Progress') return 'warning'
  return 'default'
}

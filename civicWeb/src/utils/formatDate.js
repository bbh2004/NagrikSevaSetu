/**
 * formatDate.js — Date formatting utilities for the civic portal.
 *
 * WHY use date-fns instead of native Date methods?
 *   1. 'toLocaleDateString()' only gives you "6/9/2026" — no time context.
 *   2. 'formatRelative' gives officers "2 hours ago" — critical for
 *      triaging high-urgency issues like gas leaks or live wires.
 *   3. date-fns is tree-shakeable, so only the functions used get bundled.
 */
import { formatRelative, format, parseISO } from 'date-fns'

/**
 * Returns a human-readable relative time string.
 * e.g., "2 hours ago", "yesterday", "last Monday"
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function relativeTime(dateInput) {
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput
  return formatRelative(date, new Date())
}

/**
 * Returns a short date-time string for use in tables.
 * e.g., "09 Jun 2026, 4:15 PM"
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function shortDateTime(dateInput) {
  if (!dateInput) return '—'
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput
  return format(date, 'dd MMM yyyy, h:mm a')
}

/**
 * Returns date only for log-style views.
 * e.g., "09 Jun 2026"
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function shortDate(dateInput) {
  if (!dateInput) return '—'
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput
  return format(date, 'dd MMM yyyy')
}

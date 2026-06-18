/**
 * api.js — Configured Axios instance for the civicBackend REST API.
 *
 * Features:
 *   1. Automatically attaches Firebase Bearer tokens on every request.
 *   2. Response interceptor normalises our standard API envelope:
 *      { success: true, data: T, pagination: {...} }
 *      → Returns { data: T, pagination: {...} } or just T depending on endpoint.
 *
 * IMPORTANT — Pagination:
 *   The backend returns pagination metadata at response.data.pagination.
 *   The interceptor returns the full response.data object when pagination
 *   exists, so callers can destructure { data, pagination }.
 *   For endpoints without pagination, it returns response.data.data directly.
 */
import axios from 'axios'
import { auth } from './firebase'
import { signOut as firebaseSignOut } from 'firebase/auth'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000, // Fail fast after 15s — don't let officers stare at a spinner
})

// ── Request interceptor: attach Firebase ID token ─────────────
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser
    if (user) {
      // getIdToken(true) forces refresh if token is near expiry
      const token = await user.getIdToken()
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: normalise API envelope ──────────────
api.interceptors.response.use(
  (response) => {
    const body = response.data
    if (!body || typeof body !== 'object') return body

    // If the response has pagination, return the whole body so callers can
    // destructure { data, pagination }
    if (body.pagination !== undefined) {
      return body
    }

    // Standard envelope: { success: true, data: T }
    if (body.data !== undefined) {
      return body.data
    }

    // Fallback: return as-is (health check, etc.)
    return body
  },
  async (error) => {
    // Intercept 401 Unauthorized to force a secure logout
    if (error.response?.status === 401) {
      console.warn('[API Interceptor] 401 Unauthorized. Forcing logout...')
      try {
        await firebaseSignOut(auth)
      } catch (e) {
        console.error('Failed to sign out on 401', e)
      }
    }

    // Intercept 403 PASSWORD_CHANGE_REQUIRED
    if (error.response?.status === 403 && error.response?.data?.code === 'PASSWORD_CHANGE_REQUIRED') {
      if (window.location.pathname !== '/change-password') {
        window.location.href = '/change-password';
      }
    }

    // Surface a clean error message from the backend if available
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred'
    return Promise.reject(new Error(message))
  }
)

export default api

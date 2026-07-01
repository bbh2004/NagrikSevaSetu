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
  timeout: 15_000,
})

// Separate instance with a longer timeout for heavy analytics aggregation queries
export const analyticsApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30_000,
})

// ── Request interceptor: attach Firebase ID token ─────────────
const buildRequestInterceptor = () => [
  async (config) => {
    const user = auth.currentUser
    if (user) {
      const token = await user.getIdToken()
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
]
api.interceptors.request.use(...buildRequestInterceptor())
analyticsApi.interceptors.request.use(...buildRequestInterceptor())

// ── Response interceptor: normalise API envelope ──────────────
const buildResponseInterceptor = () => [
  (response) => {
    const body = response.data
    if (!body || typeof body !== 'object') return body
    if (body.pagination !== undefined) return body
    if (body.data !== undefined) return body.data
    return body
  },
  async (error) => {
    if (error.response?.status === 401) {
      console.warn('[API Interceptor] 401 Unauthorized. Forcing logout...')
      try { await firebaseSignOut(auth) } catch (e) { console.error('Failed to sign out', e) }
    }
    if (error.response?.status === 403 && error.response?.data?.code === 'PASSWORD_CHANGE_REQUIRED') {
      if (window.location.pathname !== '/change-password') window.location.href = '/change-password'
    }
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred'
    return Promise.reject(new Error(message))
  }
]
api.interceptors.response.use(...buildResponseInterceptor())
analyticsApi.interceptors.response.use(...buildResponseInterceptor())

export default api

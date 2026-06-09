import axios from 'axios'
import { auth } from './firebase'

// Create an Axios instance pointing to our Express backend
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: Automatically attach the Firebase ID token if the user is logged in
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser
    if (user) {
      const token = await user.getIdToken()
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor: Extract the 'data' field from our standardized API response format
// Format is usually { success: true, data: ... }
api.interceptors.response.use(
  (response) => {
    return response.data?.data !== undefined ? response.data.data : response.data
  },
  (error) => {
    // Return a clean error message from the backend if available
    const message = error.response?.data?.message || error.message || 'An error occurred'
    return Promise.reject(new Error(message))
  }
)

export default api

// Firebase initialization for the web-portal, aligned to the mobile app project
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

// NOTE: These values are now loaded from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)

export default app



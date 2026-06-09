/**
 * AuthContext.jsx — Global authentication state for the civic web portal.
 *
 * Flow:
 *   1. Firebase Auth triggers onAuthStateChanged on every page load / sign-in / sign-out.
 *   2. If a Firebase user exists, we call /api/users/sync to get our MongoDB role info.
 *   3. We merge Firebase info + MongoDB info into a single `user` object.
 *   4. All protected routes read from this context via useAuth().
 *
 * The user object shape:
 *   {
 *     uid: string          — Firebase UID
 *     email: string
 *     id: string           — MongoDB _id
 *     name: string
 *     role: 'admin' | 'main_officer' | 'department_staff' | 'citizen'
 *     deptCategory: string | null   — e.g., 'Water' for department_staff
 *   }
 */
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { auth } from '../services/firebase'
import api from '../services/api'
import { toast } from '../utils/toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  /**
   * Sync Firebase user with our backend to get role + department.
   * Returns the composed user object, or null on failure.
   */
  const syncWithBackend = useCallback(async (fbUser) => {
    try {
      const dbUser = await api.post('/users/sync', {
        name: fbUser.displayName || fbUser.email.split('@')[0],
        email: fbUser.email,
        phone: fbUser.phoneNumber || '',
      })
      return {
        uid: fbUser.uid,
        email: fbUser.email,
        id: dbUser.id,
        name: dbUser.name,
        role: dbUser.role,
        // deptCategory is the canonical field name used throughout the frontend.
        // The backend returns both `department` and `deptCategory` (alias).
        deptCategory: dbUser.deptCategory || dbUser.department || null,
      }
    } catch (error) {
      console.error('[AuthContext] Backend sync failed:', error.message)
      // Sign out of Firebase too — user is in an inconsistent state
      await firebaseSignOut(auth)
      return null
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const composedUser = await syncWithBackend(fbUser)
        setUser(composedUser)
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [syncWithBackend])

  /**
   * Login with email + password.
   * The actual user state is set by the onAuthStateChanged listener above.
   * Do NOT set state here — it will race with the listener.
   */
  const login = useCallback(async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password)
    // ✅ state update happens via onAuthStateChanged → syncWithBackend
  }, [])

  /**
   * Logout — clears Firebase session and local user state.
   */
  const logout = useCallback(async () => {
    try {
      await firebaseSignOut(auth)
      setUser(null)
    } catch (err) {
      toast.error('Failed to log out. Please try again.')
      console.error('[AuthContext] Logout failed:', err)
    }
  }, [])

  // Memoize context value to prevent unnecessary re-renders of consumers
  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout]
  )

  // Block all children until auth state is resolved (prevents flash of wrong page)
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth'
import { auth } from '../services/firebase'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          // Sync with our backend to get role and department info
          const dbUser = await api.post('/users/sync', {
            name: fbUser.displayName || fbUser.email.split('@')[0],
            email: fbUser.email,
            phone: fbUser.phoneNumber || ''
          })
          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            id: dbUser.id,
            name: dbUser.name,
            role: dbUser.role,
            deptCategory: dbUser.deptCategory,
          })
        } catch (error) {
          console.error("Failed to sync user with backend:", error)
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const login = async (email, password) => {
    // This will trigger the onAuthStateChanged listener above, which will fetch the role
    await signInWithEmailAndPassword(auth, email, password)
  }

  const logout = async () => {
    await firebaseSignOut(auth)
    setUser(null)
  }

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading])

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

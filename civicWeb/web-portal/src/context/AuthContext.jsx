import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { signInAsDepartment, signInAsOfficer, signOut } from '../services/firebasePlaceholders.js'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  // Observe Firebase auth state in case we wire it later
  // and map custom claims to roles
  // For now, keep placeholder-based session
  // but do not break when Firebase auth is active
  // eslint-disable-next-line no-unused-vars
  const _ = useMemo(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (!fbUser) return
      setUser(prev => prev || { uid: fbUser.uid, name: fbUser.email || 'User', role: 'citizen' })
    })
    return () => unsub()
  }, [])

  // Persist session
  useEffect(() => {
    const raw = localStorage.getItem('nss_user')
    if (raw && !user) {
      try { setUser(JSON.parse(raw)) } catch (_) {}
    }
  }, [])
  useEffect(() => {
    if (user) localStorage.setItem('nss_user', JSON.stringify(user))
    else localStorage.removeItem('nss_user')
  }, [user])

  const loginOfficer = async (credentials) => {
    // TODO: Replace with Firebase Auth sign-in and custom claims for roles
    const res = await signInAsOfficer(credentials)
    setUser(res)
  }

  const loginDepartmentStaff = async (deptCategory, credentials) => {
    // TODO: Replace with Firebase Auth sign-in and restrict by department in Firestore rules
    const res = await signInAsDepartment(deptCategory, credentials)
    setUser(res)
  }

  const logout = async () => {
    // TODO: Firebase signOut
    await signOut()
    setUser(null)
  }

  const value = useMemo(() => ({ user, loginOfficer, loginDepartmentStaff, logout }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}




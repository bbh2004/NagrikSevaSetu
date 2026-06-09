/**
 * Departments.jsx — Login portal for department officers and main officer.
 *
 * Fixes applied:
 *   1. CATEGORIES: Now imported from civic constants (fixes 'Other' vs 'Others' mismatch).
 *   2. Toast: Login errors shown via toast (visual polish).
 *   3. Department icons added via CATEGORY_META for better UX.
 *   4. Auto-redirect handles main_officer role identically to admin.
 */
import { useEffect, useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button, Modal, Input, Label } from '../components/ui.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'
import { CATEGORIES, CATEGORY_META } from '../constants/civic.js'
import { toast } from '../utils/toast.js'

export default function Departments() {
  const { user, login } = useAuth()
  const [loadingId, setLoadingId] = useState(null)
  const [loginModal, setLoginModal] = useState({ open: false, target: null })
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [error, setError]         = useState('')
  const navigate = useNavigate()

  // Build department objects from the canonical CATEGORIES constant
  // This guarantees 'Others' (plural) is used consistently — never 'Other'
  const departments = useMemo(() => {
    return CATEGORIES.map(cat => ({
      id:   cat,
      name: cat,
      icon: CATEGORY_META[cat]?.icon || '📋',
    }))
  }, [])

  // Redirect already-logged-in users to their home page
  useEffect(() => {
    if (!user) return
    if (user.role === 'department_staff' && user.deptCategory) {
      navigate(`/department/${user.deptCategory}`, { replace: true })
    } else if (user.role === 'admin' || user.role === 'main_officer') {
      navigate('/', { replace: true })
    }
    setLoginModal({ open: false, target: null })
    setLoadingId(null)
  }, [user, navigate])

  const startLogin = (deptId) => {
    setLoginModal({ open: true, target: deptId })
    // Pre-fill email as a convenience for demos
    const prefix = deptId === 'admin' ? 'admin' : deptId.toLowerCase()
    setEmail(`${prefix}@civic.gov.in`)
    setPassword('')
    setError('')
  }

  const handleLogin = async (e) => {
    e?.preventDefault()
    setLoadingId(loginModal.target)
    setError('')
    try {
      await login(email, password)
      // Do NOT navigate here. login() starts the Firebase auth process.
      // The useEffect above listens to `user` and redirects once the backend
      // role is fetched and the user state is set.
    } catch (err) {
      const message = 'Invalid email or password. Please try again.'
      setError(message)
      toast.error(message)
      setLoadingId(null)
    }
  }

  const isLoadingAdmin = loadingId === 'admin'

  return (
    <div>
      {/* ── Header ─────────────────────────────────── */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Departments</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Select your department to log in, or log in as Main Officer for full access.
          </p>
        </div>
        {!user && (
          <Button onClick={() => startLogin('admin')} disabled={isLoadingAdmin}>
            {isLoadingAdmin ? 'Logging in…' : '🏛️ Login as Main Officer'}
          </Button>
        )}
      </div>

      {/* ── Department Cards ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {departments.map(d => (
          <Card
            key={d.id}
            className={`transition-shadow ${user?.role === 'admin' || user?.role === 'main_officer' ? 'cursor-pointer hover:shadow-md hover:bg-accent/30' : ''}`}
            onClick={() => {
              if (user?.role === 'admin' || user?.role === 'main_officer') {
                navigate(`/department/${d.id}`)
              }
            }}
          >
            <CardHeader>
              <div className="text-3xl mb-1">{d.icon}</div>
              <CardTitle className="text-base">{d.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Show login button only for unauthenticated users or when staff are viewing */}
              {(!user || user.role === 'department_staff') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => { e.stopPropagation(); startLogin(d.id) }}
                  disabled={loadingId === d.id}
                  className="w-full"
                >
                  {loadingId === d.id ? 'Logging in…' : 'Login'}
                </Button>
              )}
              {(user?.role === 'admin' || user?.role === 'main_officer') && (
                <span className="text-xs text-muted-foreground">Click to view →</span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Login Modal ──────────────────────────────── */}
      <Modal
        open={loginModal.open}
        onClose={() => { setLoginModal({ open: false, target: null }); setLoadingId(null) }}
        title={loginModal.target === 'admin'
          ? '🏛️ Main Officer Login'
          : `${loginModal.target} Department Login`
        }
        actions={
          <>
            <Button
              onClick={handleLogin}
              disabled={!email || !password || loadingId === loginModal.target}
            >
              {loadingId === loginModal.target ? 'Logging in…' : 'Login'}
            </Button>
            <Button
              variant="outline"
              onClick={() => { setLoginModal({ open: false, target: null }); setLoadingId(null) }}
            >
              Cancel
            </Button>
          </>
        }
      >
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-md">
              {error}
            </div>
          )}
          <div>
            <Label htmlFor="dept-email">Email address</Label>
            <Input
              id="dept-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <Label htmlFor="dept-password">Password</Label>
            <Input
              id="dept-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          {/* Hidden submit enables Enter key to submit the form */}
          <button type="submit" className="hidden" aria-hidden />
        </form>
      </Modal>
    </div>
  )
}

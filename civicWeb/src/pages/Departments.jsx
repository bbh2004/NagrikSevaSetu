/**
 * Departments.jsx — Login portal for department officers and main officer.
 */
import { useEffect, useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button, Modal, Input, Label, cn } from '../components/ui.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'
import { CATEGORIES, CATEGORY_META } from '../constants/civic.js'
import { toast } from '../utils/toast.js'
import { Building } from 'lucide-react'

export default function Departments() {
  const { user, login } = useAuth()
  const [loadingId, setLoadingId] = useState(null)
  const [loginModal, setLoginModal] = useState({ open: false, target: null })
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [error, setError]         = useState('')
  const navigate = useNavigate()

  const departments = useMemo(() => {
    return CATEGORIES.map(cat => ({
      id:   cat,
      name: cat,
      icon: CATEGORY_META[cat]?.icon || '📋',
    }))
  }, [])

  useEffect(() => {
    if (!user) return
    if (user.role === 'department_staff' && user.deptCategory) {
      navigate(`/department/${user.deptCategory}/dashboard`, { replace: true })
    } else if (user.role === 'admin' || user.role === 'main_officer') {
      navigate('/admin/dashboard', { replace: true })
    }
    setLoginModal({ open: false, target: null })
    setLoadingId(null)
  }, [user, navigate])

  const startLogin = (deptId) => {
    setLoginModal({ open: true, target: deptId })
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
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.')
      toast.error(err.message || 'Invalid email or password.')
      setLoadingId(null)
    }
  }

  const isLoadingAdmin = loadingId === 'admin'

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Login Page Top Bar */}
      <header className="w-full h-16 bg-surface border-b border-outline-variant shadow-sm flex items-center px-4 md:px-margin-desktop">
        <div className="flex items-center gap-2">
          <Building className="text-primary w-6 h-6" />
          <h1 className="font-headline-sm text-headline-sm font-bold text-primary">NagrikSevaSetu</h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-container-max mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* ── Header ─────────────────────────────────── */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant pb-4">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-primary">Department Portal Access</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {departments.map(d => (
            <Card
              key={d.id}
              className={cn(
                "transition-all duration-200", 
                user?.role === 'admin' || user?.role === 'main_officer' ? 'cursor-pointer hover:shadow-md hover:border-primary' : ''
              )}
              onClick={() => {
                if (user?.role === 'admin' || user?.role === 'main_officer') {
                  navigate(`/department/${d.id}/dashboard`)
                }
              }}
            >
              <CardHeader className="flex flex-col items-center text-center">
                <div className="text-4xl mb-2">{d.icon}</div>
                <CardTitle>{d.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col justify-center text-center">
                {(!user || user.role === 'department_staff') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); startLogin(d.id) }}
                    disabled={loadingId === d.id}
                    className="w-full mt-2"
                  >
                    {loadingId === d.id ? 'Logging in…' : 'Login'}
                  </Button>
                )}
                {(user?.role === 'admin' || user?.role === 'main_officer') && (
                  <span className="font-label-sm text-label-sm text-on-surface-variant mt-2">Click to view →</span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

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
              variant="outline"
              onClick={() => { setLoginModal({ open: false, target: null }); setLoadingId(null) }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogin}
              disabled={!email || !password || loadingId === loginModal.target}
            >
              {loadingId === loginModal.target ? 'Logging in…' : 'Login'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-error-container text-on-error-container p-4 rounded font-label-md text-label-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
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
          <div className="space-y-2">
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
          <button type="submit" className="hidden" aria-hidden />
        </form>
      </Modal>
    </div>
  )
}

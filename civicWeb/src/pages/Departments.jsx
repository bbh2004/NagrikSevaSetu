/**
 * Departments.jsx — NagrikSevaSetu login portal.
 *
 * Full-page branded login with:
 *  - Hero section with gradient background
 *  - Animated department cards
 *  - Clean modal login form with password toggle
 *  - Proper error handling and loading states
 */
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'
import { CATEGORIES, CATEGORY_META } from '../constants/civic.js'
import { toast } from '../utils/toast.js'
import {
  Building, Shield, Eye, EyeOff, X, ArrowRight,
  Loader2, AlertCircle, Users, BarChart3, ClipboardList,
} from 'lucide-react'
import { cn, Alert } from '../components/ui.jsx'

// Department card colors
const DEPT_COLORS = {
  Sanitation: { bg: 'from-amber-50 to-orange-50', border: 'border-amber-200', icon: 'bg-amber-100', text: 'text-amber-700', hover: 'hover:border-amber-400' },
  Water:      { bg: 'from-sky-50 to-blue-50',     border: 'border-sky-200',   icon: 'bg-sky-100',  text: 'text-sky-700',  hover: 'hover:border-sky-400'  },
  Electrical: { bg: 'from-yellow-50 to-amber-50', border: 'border-yellow-200',icon: 'bg-yellow-100',text: 'text-yellow-700',hover: 'hover:border-yellow-400'},
  Road:       { bg: 'from-slate-50 to-gray-50',   border: 'border-slate-200', icon: 'bg-slate-100',text: 'text-slate-700', hover: 'hover:border-slate-400' },
  Others:     { bg: 'from-purple-50 to-violet-50',border: 'border-purple-200',icon: 'bg-purple-100',text: 'text-purple-700',hover: 'hover:border-purple-400'},
}

// Stats for the hero section
const PORTAL_FEATURES = [
  { icon: Users,        label: 'Department Access',   desc: 'Role-based for staff' },
  { icon: BarChart3,    label: 'Live Analytics',       desc: 'Real-time city data'  },
  { icon: ClipboardList,label: 'Complaint Tracking',  desc: 'Full audit trail'     },
]

export default function Departments() {
  const { user, login } = useAuth()
  const navigate = useNavigate()

  const [loadingId,   setLoadingId]   = useState(null)
  const [loginModal,  setLoginModal]  = useState({ open: false, target: null })
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [showPass,    setShowPass]    = useState(false)
  const [error,       setError]       = useState('')

  const departments = useMemo(() =>
    CATEGORIES.map(cat => ({
      id:   cat,
      name: cat,
      icon: CATEGORY_META[cat]?.icon || '📋',
    }))
  , [])

  // Redirect if already authenticated
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
    setEmail('')
    setPassword('')
    setError('')
    setShowPass(false)
  }

  const closeModal = () => {
    setLoginModal({ open: false, target: null })
    setLoadingId(null)
    setError('')
  }

  const handleLogin = async (e) => {
    e?.preventDefault()
    if (!email.trim()) { setError('Email is required.'); return }
    if (!password)      { setError('Password is required.'); return }

    setLoadingId(loginModal.target)
    setError('')
    try {
      await login(email.trim(), password)
    } catch (err) {
      const msg = err.message || 'Invalid credentials. Please try again.'
      setError(msg)
      toast.error(msg)
      setLoadingId(null)
    }
  }

  const isLoading    = loadingId !== null

  return (
    <div className="min-h-screen bg-[#f4f6fa] flex flex-col">

      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 card-shadow">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Building size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-none">NagrikSevaSetu</p>
              <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Government Portal</p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero Section ────────────────────────────────────────── */}
      <div className="bg-brand-gradient text-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16">
          <div className="max-w-2xl animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-xs font-semibold mb-5 backdrop-blur-sm">
              <Shield size={12} />
              Official Government Portal
            </div>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-3">
              Department Officers
              <span className="block text-gradient-brand">Command Centre</span>
            </h1>
            <p className="text-blue-200 text-sm md:text-base leading-relaxed">
              Access your department's dashboard to manage, analyze, and resolve civic complaints efficiently.
            </p>

            {/* Feature badges */}
            <div className="flex flex-wrap gap-3 mt-6">
              {PORTAL_FEATURES.map(f => (
                <div
                  key={f.label}
                  className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-3 py-2 backdrop-blur-sm"
                >
                  <f.icon size={14} className="text-blue-300" />
                  <div>
                    <p className="text-xs font-semibold leading-none">{f.label}</p>
                    <p className="text-[10px] text-blue-300 mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Department Cards ─────────────────────────────────────── */}
      <main className="flex-1 max-w-6xl mx-auto px-4 md:px-8 py-8 w-full">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Select Your Department</h2>
            <p className="text-sm text-gray-400 mt-1">
              Click the Login button on your department to proceed
            </p>
          </div>
          
          <button
            onClick={() => startLogin('admin')}
            disabled={isLoading}
            className="flex-shrink-0 flex items-center justify-center gap-2 bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-gray-800 transition-all shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50"
          >
            <Shield size={15} />
            Main Officer Login
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {departments.map((d, i) => {
            const style = DEPT_COLORS[d.id] || DEPT_COLORS.Others
            return (
              <div
                key={d.id}
                className={cn(
                  "bg-gradient-to-br rounded-2xl border-2 p-5 flex flex-col items-center text-center",
                  "transition-all duration-200 card-shadow group",
                  "hover:card-shadow-md hover:-translate-y-0.5",
                  `animate-fade-in-up stagger-${Math.min(i + 1, 5)}`,
                  style.bg, style.border, style.hover
                )}
              >
                {/* Icon */}
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-3 transition-transform duration-200 group-hover:scale-110", style.icon)}>
                  {d.icon}
                </div>

                {/* Name */}
                <h3 className={cn("font-bold text-gray-900 mb-0.5 text-sm")}>{d.name}</h3>
                <p className={cn("text-[10px] font-semibold uppercase tracking-wider mb-4", style.text)}>
                  Department
                </p>

                {/* Login Button */}
                <button
                  onClick={() => startLogin(d.id)}
                  disabled={loadingId === d.id}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95",
                    "bg-white border-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50",
                    style.border,
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {loadingId === d.id ? (
                    <><Loader2 size={14} className="animate-spin" /> Logging in…</>
                  ) : (
                    <>Login <ArrowRight size={14} /></>
                  )}
                </button>
              </div>
            )
          })}
        </div>

      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="text-center py-4 text-xs text-gray-400 border-t border-gray-100 bg-white">
        © 2025 NagrikSevaSetu — Government Civic Complaint Management System
      </footer>

      {/* ── Login Modal ──────────────────────────────────────────── */}
      {loginModal.open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-modal-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal Panel */}
          <div className="relative w-full max-w-md bg-white rounded-2xl card-shadow-lg z-10 animate-fade-in-up overflow-hidden">

            {/* Header */}
            <div className="bg-brand-gradient px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">
                    {loginModal.target === 'admin' ? 'Administration' : `${loginModal.target} Department`}
                  </p>
                  <h3 id="login-modal-title" className="text-white text-lg font-bold">
                    {loginModal.target === 'admin'
                      ? '🏛️ Main Officer Login'
                      : `${CATEGORY_META[loginModal.target]?.icon || '🏢'} Officer Login`
                    }
                  </h3>
                </div>
                <button
                  onClick={closeModal}
                  className="text-white/60 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                  aria-label="Close login modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              {/* Error */}
              {error && (
                <Alert variant="error" className="mb-4" onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleLogin} noValidate className="space-y-4">
                {/* Email */}
                <div>
                  <label
                    htmlFor="dept-email"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="dept-email"
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    placeholder="officer@gov.in"
                    autoComplete="username"
                    required
                    disabled={isLoading}
                    className={cn(
                      "w-full h-10 border rounded-xl px-3.5 py-2 bg-white text-sm transition-all",
                      "placeholder:text-gray-400 focus:outline-none focus:ring-2",
                      error && error.toLowerCase().includes('email')
                        ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                        : "border-gray-200 hover:border-gray-300 focus:border-primary focus:ring-primary/10",
                      "disabled:opacity-60 disabled:cursor-not-allowed"
                    )}
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="dept-password"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="dept-password"
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError('') }}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                      disabled={isLoading}
                      className={cn(
                        "w-full h-10 border rounded-xl px-3.5 pr-10 py-2 bg-white text-sm transition-all",
                        "placeholder:text-gray-400 focus:outline-none focus:ring-2",
                        "border-gray-200 hover:border-gray-300 focus:border-primary focus:ring-primary/10",
                        "disabled:opacity-60 disabled:cursor-not-allowed"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Hidden submit for Enter key */}
                <button type="submit" className="hidden" aria-hidden />
              </form>
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogin}
                disabled={!email || !password || isLoading}
                className={cn(
                  "flex items-center gap-2 bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-xl",
                  "hover:bg-primary-container transition-all shadow-sm hover:shadow-md active:scale-95",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                )}
              >
                {isLoading ? (
                  <><Loader2 size={15} className="animate-spin" /> Logging in…</>
                ) : (
                  <>Sign In <ArrowRight size={15} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

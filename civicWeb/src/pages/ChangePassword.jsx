/**
 * ChangePassword.jsx — Forced password change for newly created accounts.
 *
 * Design:
 *  - Full-page branded layout
 *  - Strength indicator
 *  - Password visibility toggle
 *  - Proper error/success states
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { toast } from '../utils/toast.js'
import { Building, Eye, EyeOff, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '../components/ui.jsx'

// ── Password strength ───────────────────────────────────────────
function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 8)                       score++
  if (/[A-Z]/.test(pw))                     score++
  if (/[0-9]/.test(pw))                     score++
  if (/[^A-Za-z0-9]/.test(pw))             score++

  const levels = [
    { label: '',         color: 'bg-gray-200' },
    { label: 'Weak',     color: 'bg-red-400'  },
    { label: 'Fair',     color: 'bg-amber-400' },
    { label: 'Good',     color: 'bg-yellow-400'},
    { label: 'Strong',   color: 'bg-emerald-500' },
  ]
  return { score, ...levels[score] }
}

export default function ChangePassword() {
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass,        setShowPass]        = useState(false)
  const [showConfirm,     setShowConfirm]     = useState(false)
  const [loading,         setLoading]         = useState(false)
  const [fieldError,      setFieldError]      = useState('')
  const navigate = useNavigate()

  const strength = getPasswordStrength(password)

  const validate = () => {
    if (password.length < 6) {
      setFieldError('Password must be at least 6 characters.')
      return false
    }
    if (password !== confirmPassword) {
      setFieldError('Passwords do not match.')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFieldError('')
    if (!validate()) return

    try {
      setLoading(true)
      await api.post('/users/me/change-password', { newPassword: password })
      toast.success('Password updated successfully!')
      navigate('/')
    } catch (error) {
      const msg = error.message || 'Failed to update password. Please try again.'
      toast.error(msg)
      setFieldError(msg)
    } finally {
      setLoading(false)
    }
  }

  const requirements = [
    { met: password.length >= 6, label: 'At least 6 characters' },
    { met: /[A-Z]/.test(password), label: 'One uppercase letter' },
    { met: /[0-9]/.test(password), label: 'One number' },
  ]

  return (
    <div className="min-h-screen bg-[#f4f6fa] flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Building size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-gray-900">NagrikSevaSetu</span>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in-up">

          {/* Card */}
          <div className="bg-white rounded-2xl card-shadow-lg overflow-hidden">

            {/* Card Header */}
            <div className="bg-brand-gradient px-6 py-6">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                <Lock size={24} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Set New Password</h1>
              <p className="text-blue-200 text-sm mt-1 leading-relaxed">
                Your account requires a password update before you can continue.
              </p>
            </div>

            {/* Card Body */}
            <div className="px-6 py-6 space-y-5">

              {/* Error */}
              {fieldError && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 animate-fade-in">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  {fieldError}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4">

                {/* New Password */}
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setFieldError('') }}
                      placeholder="Create a strong password"
                      autoComplete="new-password"
                      required
                      disabled={loading}
                      className="w-full h-10 border border-gray-200 rounded-xl px-3.5 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-gray-300 transition-all disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map(i => (
                          <div
                            key={i}
                            className={cn(
                              "flex-1 h-1.5 rounded-full transition-colors duration-300",
                              strength.score >= i ? strength.color : 'bg-gray-100'
                            )}
                          />
                        ))}
                      </div>
                      {strength.label && (
                        <p className={cn(
                          "text-xs font-medium",
                          strength.score <= 1 ? 'text-red-500' :
                          strength.score === 2 ? 'text-amber-500' :
                          strength.score === 3 ? 'text-yellow-600' : 'text-emerald-600'
                        )}>
                          {strength.label} password
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => { setConfirmPassword(e.target.value); setFieldError('') }}
                      placeholder="Repeat your password"
                      autoComplete="new-password"
                      required
                      disabled={loading}
                      className={cn(
                        "w-full h-10 border rounded-xl px-3.5 pr-10 text-sm bg-white transition-all disabled:opacity-60",
                        "focus:outline-none focus:ring-2",
                        confirmPassword && password !== confirmPassword
                          ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                          : confirmPassword && password === confirmPassword
                          ? "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-100"
                          : "border-gray-200 hover:border-gray-300 focus:border-primary focus:ring-primary/20"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    {confirmPassword && password === confirmPassword && (
                      <CheckCircle size={15} className="absolute right-9 top-1/2 -translate-y-1/2 text-emerald-500" />
                    )}
                  </div>
                </div>

                {/* Requirements */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                  <p className="text-caption text-gray-400 mb-2">Password Requirements</p>
                  <ul className="space-y-1.5">
                    {requirements.map(req => (
                      <li key={req.label} className="flex items-center gap-2 text-xs">
                        <CheckCircle
                          size={13}
                          className={req.met ? 'text-emerald-500' : 'text-gray-200'}
                        />
                        <span className={req.met ? 'text-gray-700 font-medium' : 'text-gray-400'}>
                          {req.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !password || !confirmPassword}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 h-11 rounded-xl font-semibold text-sm transition-all",
                    "bg-primary text-white hover:bg-primary-container shadow-sm hover:shadow-md active:scale-95",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                  )}
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" /> Updating Password…</>
                  ) : (
                    <><Lock size={15} /> Update Password</>
                  )}
                </button>
              </form>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            Having trouble? Contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  )
}

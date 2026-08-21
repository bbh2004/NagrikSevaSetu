import { BrowserRouter, Routes, Route, Navigate, Outlet, useParams, Link } from 'react-router-dom'
import { Component } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import AppLayout from './layouts/AppLayout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Departments from './pages/Departments.jsx'
import DepartmentDashboard from './pages/DepartmentDashboard.jsx'
import ComplaintDetail from './pages/ComplaintDetail.jsx'
import Analytics from './pages/Analytics.jsx'
import History from './pages/History.jsx'
import ChangePassword from './pages/ChangePassword.jsx'
import NotFound from './pages/NotFound.jsx'
import { Building, Home, ShieldOff, RefreshCw } from 'lucide-react'

// ── Error Boundary ──────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f4f6fa] flex flex-col">
          <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <Building size={14} className="text-white" />
              </div>
              <span className="text-sm font-bold text-gray-900">NagrikSevaSetu</span>
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center mx-auto mb-6">
                <ShieldOff size={32} className="text-red-300" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Something Went Wrong</h1>
              <p className="text-gray-400 text-sm mb-2">
                A component crashed unexpectedly. Our team has been notified.
              </p>
              {this.state.error && (
                <p className="text-xs text-red-400 font-mono bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-6 text-left overflow-auto max-h-24">
                  {this.state.error.message}
                </p>
              )}
              <button
                onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }}
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-container transition-all shadow-sm"
              >
                <RefreshCw size={14} /> Reload Application
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ── Unauthorized Page ───────────────────────────────────────────
function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#f4f6fa] flex flex-col">
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Building size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-gray-900">NagrikSevaSetu</span>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center mx-auto mb-6">
            <ShieldOff size={40} className="text-red-300" />
          </div>
          <p className="text-7xl font-black text-gray-100 leading-none mb-2">401</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
            You don't have permission to access this page.
            Please contact your administrator if you believe this is a mistake.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-container transition-all shadow-sm hover:shadow-md"
          >
            <Home size={15} /> Return to Portal
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Protected Layout ────────────────────────────────────────────
function ProtectedLayout({ allowedRoles }) {
  const { user, isAuthenticated, logout } = useAuth()
  const { deptId } = useParams()

  if (!isAuthenticated) return <Navigate to="/login" replace />

  // Citizen guard
  if (user.role === 'citizen') {
    logout()
    return <Navigate to="/unauthorized" replace />
  }

  // Role whitelist
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  // Department isolation guard
  if (deptId && user.role === 'department_staff' && user.deptCategory !== deptId) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}

// ── Dynamic redirect based on role ─────────────────────────────
function DynamicRedirect() {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user.role === 'admin' || user.role === 'main_officer') {
    return <Navigate to="/admin/dashboard" replace />
  }
  if (user.role === 'department_staff' && user.deptCategory) {
    return <Navigate to={`/department/${user.deptCategory}/dashboard`} replace />
  }
  return <Navigate to="/login" replace />
}


// ══════════════════════════════════════════════════════════════
// App
// ══════════════════════════════════════════════════════════════
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login"           element={<Departments />}   />
            <Route path="/change-password" element={<ChangePassword />}/>
            <Route path="/unauthorized"    element={<UnauthorizedPage />} />

            {/* Protected routes (inside AppLayout) */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<DynamicRedirect />} />

              {/* Admin & Main Officer */}
              <Route element={<ProtectedLayout allowedRoles={['admin', 'main_officer']} />}>
                <Route path="/admin/dashboard" element={<Dashboard />} />
                <Route path="/admin/complaints" element={<Analytics />} />
                <Route path="/analytics"        element={<Analytics />} />
              </Route>

              {/* Department Staff */}
              <Route element={<ProtectedLayout allowedRoles={['admin', 'main_officer', 'department_staff']} />}>
                <Route path="/department/:deptId/dashboard"  element={<DepartmentDashboard />} />
                <Route path="/department/:deptId/complaints" element={<Analytics />} />
              </Route>

              {/* Shared routes */}
              <Route element={<ProtectedLayout allowedRoles={['admin', 'main_officer', 'department_staff']} />}>
                <Route path="/complaints/:complaintId" element={<ComplaintDetail />} />
                <Route path="/history"                 element={<History />} />
              </Route>
            </Route>

            {/* Catch-all 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}

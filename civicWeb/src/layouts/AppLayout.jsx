/**
 * AppLayout.jsx — Main application shell with sidebar + topbar.
 *
 * Design:
 *  - Fixed top header with branding + user info + logout
 *  - Fixed left sidebar on desktop (240px) with role-aware nav items
 *  - Collapsible mobile bottom nav
 *  - Consistent with admin portal visual language
 */
import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, BarChart3, ClipboardList, LogOut,
  Lock, Building, ChevronRight, Shield, Users, Menu, X
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { cn, Avatar } from '../components/ui.jsx'

// ── Nav item styles ────────────────────────────────────────────
function NavItem({ to, icon: Icon, label, locked, end }) {
  if (locked) {
    return (
      <div
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 cursor-not-allowed select-none"
        title="Not available for your role"
      >
        <Icon size={18} className="flex-shrink-0" />
        <span className="text-sm font-medium">{label}</span>
        <Lock size={13} className="ml-auto opacity-50" />
      </div>
    )
  }

  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group",
          isActive
            ? "bg-indigo-50 text-indigo-700 font-semibold"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium"
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={18}
            className={cn(
              "flex-shrink-0 transition-colors",
              isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
            )}
          />
          <span className="text-sm">{label}</span>
          {isActive && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />
          )}
        </>
      )}
    </NavLink>
  )
}

// ── Mobile Nav Item ────────────────────────────────────────────
function MobileNavItem({ to, icon: Icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all flex-1 min-w-0",
          isActive
            ? "text-indigo-600 bg-indigo-50"
            : "text-gray-400 hover:text-gray-600"
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={20} className={isActive ? "text-indigo-600" : ""} />
          <span className={cn("text-[10px] font-semibold uppercase tracking-wide truncate", isActive ? "text-indigo-600" : "")}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}

// ── Role display helpers ────────────────────────────────────────
function getRoleLabel(role) {
  if (role === 'admin')            return 'System Admin'
  if (role === 'main_officer')     return 'Main Officer'
  if (role === 'department_staff') return 'Dept. Staff'
  return role
}

function getRoleBadgeColor(role) {
  if (role === 'admin')            return 'bg-indigo-100 text-indigo-700'
  if (role === 'main_officer')     return 'bg-purple-100 text-purple-700'
  if (role === 'department_staff') return 'bg-blue-100 text-blue-700'
  return 'bg-gray-100 text-gray-600'
}

// ══════════════════════════════════════════════════════════════
// AppLayout
// ══════════════════════════════════════════════════════════════
export default function AppLayout() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user, isAuthenticated, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch {
      // AuthContext handles toast
    }
  }

  const isAdmin   = isAuthenticated && (user?.role === 'admin' || user?.role === 'main_officer')
  const isDeptStaff = isAuthenticated && user?.role === 'department_staff'
  const deptId    = user?.deptCategory

  // Build nav items based on role
  const navItems = []

  if (isAdmin) {
    navItems.push({ to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true })
    navItems.push({ to: '/analytics',       icon: BarChart3,       label: 'Analytics'            })
    navItems.push({ to: '/history',         icon: ClipboardList,   label: 'History'               })
  } else if (isDeptStaff && deptId) {
    navItems.push({ to: `/department/${deptId}/dashboard`, icon: LayoutDashboard, label: 'My Department', end: true })
    navItems.push({ to: '/analytics',                      icon: BarChart3,       label: 'Analytics'             })
    navItems.push({ to: '/history',                        icon: ClipboardList,   label: 'History'                })
  }

  // ── Sidebar content ─────────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <Building size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-none">NagrikSevaSetu</p>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5 uppercase tracking-wider">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.length > 0 ? (
          navItems.map(item => (
            <NavItem key={item.to} {...item} />
          ))
        ) : (
          <>
            <NavItem to="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" locked />
            <NavItem to="/analytics"       icon={BarChart3}       label="Analytics"  locked />
            <NavItem to="/history"         icon={ClipboardList}   label="History"    locked />
          </>
        )}
      </nav>

      {/* User section */}
      {isAuthenticated && user && (
        <div className="border-t border-gray-100 p-3 space-y-2">
          {/* User info */}
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar name={user.name} role={user.role} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
              <p className={cn("text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 inline-block mt-0.5", getRoleBadgeColor(user.role))}>
                {getRoleLabel(user.role)}
                {user.deptCategory && ` · ${user.deptCategory}`}
              </p>
            </div>
          </div>
          {/* Change Password */}
          <NavLink
            to="/change-password?voluntary=true"
            className={({ isActive }) => cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium group",
              isActive 
                ? "bg-primary/10 text-primary font-semibold"
                : "text-gray-600 hover:bg-gray-100/70"
            )}
            onClick={() => setMobileOpen(false)}
          >
            <Lock size={16} className="flex-shrink-0" />
            Change Password
          </NavLink>
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors text-sm font-medium group"
          >
            <LogOut size={16} className="flex-shrink-0" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f4f6fa] flex">

      {/* ── Desktop Sidebar ─────────────────────────────────────── */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-60 bg-white border-r border-gray-100 card-shadow flex-col z-40">
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar Overlay ───────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="relative w-72 bg-white h-full flex flex-col shadow-2xl animate-slide-in-left">
            {/* Close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
            >
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main content area ────────────────────────────────────── */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">

        {/* ── Top Header ────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center px-4 md:px-6 h-14 gap-3">

            {/* Mobile menu button */}
            <button
              className="md:hidden text-gray-500 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>

            {/* Mobile branding */}
            <div className="md:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <Building size={14} className="text-white" />
              </div>
              <span className="text-sm font-bold text-gray-900">NagrikSevaSetu</span>
            </div>

            {/* Breadcrumb-style page context */}
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
              <Shield size={14} className="text-indigo-400" />
              <span>Portal</span>
              <ChevronRight size={13} />
              <span className="text-gray-600 font-medium capitalize">
                {location.pathname.includes('/dashboard') ? 'Dashboard'
                  : location.pathname.includes('/analytics') ? 'Analytics'
                  : location.pathname.includes('/history') ? 'History'
                  : location.pathname.includes('/complaints/') ? 'Complaint Detail'
                  : 'Overview'}
              </span>
            </div>

            <div className="ml-auto flex items-center gap-3">
              {/* Dept badge */}
              {isDeptStaff && deptId && (
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full">
                  <Users size={11} />
                  {deptId}
                </span>
              )}
              {isAdmin && (
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-full">
                  <Shield size={11} />
                  {user?.role === 'admin' ? 'Admin' : 'Main Officer'}
                </span>
              )}

              {/* User name (sm+) */}
              {isAuthenticated && user && (
                <div className="hidden sm:flex items-center gap-2.5">
                  <Avatar name={user.name} role={user.role} size="sm" />
                  <div className="text-right hidden lg:block">
                    <p className="text-sm font-semibold text-gray-900 leading-none">{user.name}</p>
                  </div>
                </div>
              )}

              {/* Logout button */}
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg transition-all"
                  title="Sign out"
                >
                  <LogOut size={14} />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* ── Page Content ─────────────────────────────────────── */}
        <main className="flex-1 p-4 md:p-6 max-w-[1400px] w-full mx-auto pb-20 md:pb-6">
          <Outlet />
        </main>

        {/* ── Mobile Bottom Nav ──────────────────────────────────── */}
        {isAuthenticated && (
          <nav className="md:hidden fixed bottom-0 left-0 w-full z-30 bg-white/95 backdrop-blur border-t border-gray-100 flex items-center px-2 py-1.5 gap-1">
            {navItems.map(item => (
              <MobileNavItem key={item.to} to={item.to} icon={item.icon} label={item.label} end={item.end} />
            ))}
          </nav>
        )}
      </div>
    </div>
  )
}

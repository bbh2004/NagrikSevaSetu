/**
 * AppLayout.jsx — Application shell with sidebar navigation.
 *
 * Fixes applied:
 *   1. Sidebar: "Departments" nav link now highlights correctly when an admin
 *      is viewing /department/:deptId (previously no link was active).
 *   2. Role: main_officer is now recognised for the Dashboard link (was missing).
 *   3. User info: Shows deptCategory below name for department_staff.
 *   4. Logout: navigates to /departments after logout (correct public fallback).
 */
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Building2, BarChart3, LogOut, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * Returns the Tailwind className string for a sidebar nav link.
 * @param {boolean} isActive - from NavLink's render prop
 * @param {boolean} [forceActive] - programmatically force active state
 */
function navClass(isActive, forceActive = false) {
  const active = isActive || forceActive
  return `flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-accent/50 ${
    active ? 'bg-accent font-semibold text-primary' : 'text-muted-foreground'
  }`
}

export default function AppLayout() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user, logout } = useAuth()

  // An admin/main_officer on /department/:deptId is still "in" the departments section
  const isOnDeptPage = location.pathname.startsWith('/department/')

  const handleLogout = async () => {
    await logout()
    navigate('/departments')
  }

  return (
    <div className="min-h-screen grid grid-cols-[220px_1fr]">
      {/* ── Sidebar ─────────────────────────────────── */}
      <aside className="border-r bg-card p-3 flex flex-col shadow-sm z-10 relative">
        {/* Logo / Brand */}
        <div className="text-xl font-bold mb-6 mt-2 px-2 text-primary flex items-center gap-2">
          <Building2 size={24} />
          <span>NSS Portal</span>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1 flex-1">
          {/* Dashboard — only admin and main_officer */}
          {user && (user.role === 'admin' || user.role === 'main_officer') ? (
            <NavLink to="/" className={({ isActive }) => navClass(isActive)}>
              <LayoutDashboard size={18} /> Dashboard
            </NavLink>
          ) : user?.role === 'department_staff' && user?.deptCategory ? (
            <NavLink
              to={`/department/${user.deptCategory}`}
              className={({ isActive }) => navClass(isActive)}
            >
              <LayoutDashboard size={18} /> My Department
            </NavLink>
          ) : (
            <div className="flex items-center justify-between px-3 py-2 rounded-md text-muted-foreground/40 cursor-not-allowed select-none">
              <div className="flex items-center gap-3"><LayoutDashboard size={18} /> Dashboard</div>
              <Lock size={13} />
            </div>
          )}

          {/* Departments — always visible; highlighted also when on a dept sub-page */}
          <NavLink
            to="/departments"
            className={({ isActive }) => navClass(isActive, isOnDeptPage && user?.role !== 'department_staff')}
          >
            <Building2 size={18} /> Departments
          </NavLink>

          {/* Analytics — authenticated users only */}
          {user ? (
            <NavLink to="/analytics" className={({ isActive }) => navClass(isActive)}>
              <BarChart3 size={18} /> Analytics
            </NavLink>
          ) : (
            <div className="flex items-center justify-between px-3 py-2 rounded-md text-muted-foreground/40 cursor-not-allowed select-none">
              <div className="flex items-center gap-3"><BarChart3 size={18} /> Analytics</div>
              <Lock size={13} />
            </div>
          )}
        </nav>

        {/* User Info + Logout */}
        {user ? (
          <div className="pt-4 border-t mt-auto">
            <div className="mb-3 px-2 text-xs text-muted-foreground flex flex-col gap-0.5">
              <span className="font-semibold text-foreground text-sm truncate" title={user.name}>
                {user.name}
              </span>
              <span className="capitalize text-muted-foreground">
                {user.role.replace('_', ' ')}
                {user.deptCategory && ` — ${user.deptCategory}`}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-border/50 bg-background hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors text-sm"
            >
              <LogOut size={15} /> Logout
            </button>
          </div>
        ) : (
          <div className="mt-auto px-2 py-4 text-xs text-center text-muted-foreground border-t">
            Login required for full access
          </div>
        )}
      </aside>

      {/* ── Main Content Area ────────────────────────── */}
      <main className="p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Building2, BarChart3, LogOut, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  // For unauthenticated users, clicking a locked link shouldn't navigate
  const handleLockedClick = (e) => {
    e.preventDefault()
  }

  return (
    <div className="min-h-screen grid grid-cols-[200px_1fr]">
      <aside className="border-r bg-card p-3 flex flex-col shadow-sm z-10 relative">
        <div className="text-xl font-bold mb-6 mt-2 px-2 text-primary flex items-center gap-2">
          <Building2 size={24} />
          CMS Portal
        </div>
        <nav className="space-y-2 flex-1">
          {user ? (
            // Authenticated Dashboard Link
            (user.role === 'admin' || user.role === 'main_officer') ? (
              <NavLink to="/" className={({isActive})=>`flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-accent/50 ${isActive? 'bg-accent font-semibold text-primary': 'text-muted-foreground'}`}>
                <LayoutDashboard size={18} /> Dashboard
              </NavLink>
            ) : user.role === 'department_staff' && user.deptCategory ? (
              <NavLink to={`/department/${user.deptCategory}`} className={({isActive})=>`flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-accent/50 ${isActive? 'bg-accent font-semibold text-primary': 'text-muted-foreground'}`}>
                <LayoutDashboard size={18} /> Dept Dashboard
              </NavLink>
            ) : null
          ) : (
            // Locked Dashboard Link
            <div onClick={handleLockedClick} className="flex items-center justify-between px-3 py-2 rounded-md text-muted-foreground/50 cursor-not-allowed select-none">
              <div className="flex items-center gap-3"><LayoutDashboard size={18} /> Dashboard</div>
              <Lock size={14} />
            </div>
          )}

          <NavLink to="/departments" className={({isActive})=>`flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-accent/50 ${isActive || (!user && location.pathname === '/departments') ? 'bg-accent font-semibold text-primary': 'text-muted-foreground'}`}>
            <Building2 size={18} /> Departments
          </NavLink>

          {user ? (
             <NavLink to="/analytics" className={({isActive})=>`flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-accent/50 ${isActive? 'bg-accent font-semibold text-primary': 'text-muted-foreground'}`}>
               <BarChart3 size={18} /> Analytics
             </NavLink>
          ) : (
             // Locked Analytics Link
             <div onClick={handleLockedClick} className="flex items-center justify-between px-3 py-2 rounded-md text-muted-foreground/50 cursor-not-allowed select-none">
               <div className="flex items-center gap-3"><BarChart3 size={18} /> Analytics</div>
               <Lock size={14} />
             </div>
          )}
        </nav>
        {user ? (
          <div className="pt-4 border-t mt-auto">
            <div className="mb-3 px-2 text-xs text-muted-foreground flex flex-col gap-1">
              <span className="font-semibold text-foreground truncate" title={user.name}>{user.name}</span>
              <span className="capitalize">{user.role.replace('_', ' ')}</span>
            </div>
            <button
              onClick={() => { logout(); navigate('/departments') }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-border/50 bg-background hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        ) : (
          <div className="mt-auto px-2 py-4 text-xs text-center text-muted-foreground border-t">
            Login required for full access
          </div>
        )}
      </aside>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}




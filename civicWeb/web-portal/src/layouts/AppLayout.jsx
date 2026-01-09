import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Building2, BarChart3, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function AppLayout() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen grid grid-cols-[200px_1fr]">
      <aside className="border-r bg-card p-3 flex flex-col">
        <div className="text-lg font-bold mb-4">Municipal CMS</div>
        <nav className="space-y-2 flex-1">
          <NavLink to="/" className={({isActive})=>`flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent ${isActive? 'bg-accent': ''}`}>
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>
          <NavLink to="/departments" className={({isActive})=>`flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent ${isActive? 'bg-accent': ''}`}>
            <Building2 size={18} /> Department
          </NavLink>
          <NavLink to="/analytics" className={({isActive})=>`flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent ${isActive? 'bg-accent': ''}`}>
            <BarChart3 size={18} /> Analytics
          </NavLink>
        </nav>
        {user && (
          <>
            <button
              onClick={() => { logout(); navigate('/departments') }}
              className="mt-3 flex items-center gap-2 px-2 py-2 rounded-md border hover:bg-accent"
            >
              <LogOut size={18} /> Logout
            </button>
            <div className="mt-3 text-xs text-muted-foreground">
              Signed in as: <span className="font-medium">{user.name}</span> ({user.role})
            </div>
          </>
        )}
      </aside>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}




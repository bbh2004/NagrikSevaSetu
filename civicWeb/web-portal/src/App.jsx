import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import AppLayout from './layouts/AppLayout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Departments from './pages/Departments.jsx'
import DepartmentDashboard from './pages/DepartmentDashboard.jsx'
import ComplaintDetail from './pages/ComplaintDetail.jsx'
import Analytics from './pages/Analytics.jsx'

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/departments" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/departments" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/departments" element={<Departments />} />
            <Route
              path="/department/:deptId"
              element={
                <ProtectedRoute allowedRoles={["admin", "main_officer", "department_staff"]}>
                  <DepartmentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/complaints/:complaintId"
              element={
                <ProtectedRoute allowedRoles={["admin", "main_officer", "department_staff"]}>
                  <ComplaintDetail />
                </ProtectedRoute>
              }
            />
            <Route path="/analytics" element={<Analytics />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

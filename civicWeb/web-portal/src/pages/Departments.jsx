import { useEffect, useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button, Modal, Input, Label } from '../components/ui.jsx'
import { getDepartments } from '../services/firebasePlaceholders.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'

export default function Departments() {
  const departments = getDepartments()
  const { user, loginOfficer, loginDepartmentStaff } = useAuth()
  const [loadingId, setLoadingId] = useState(null)
  const [loginModal, setLoginModal] = useState({ open: false, target: null })
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const sortedDepartments = useMemo(() => {
    const list = [...departments]
    // ensure Other is last
    list.sort((a,b) => a.name.localeCompare(b.name))
    const idx = list.findIndex(d => d.id === 'Other')
    if (idx >= 0) {
      const other = list.splice(idx, 1)[0]
      list.push(other)
    }
    return list
  }, [departments])
  // Redirect to active department if logged in
  useEffect(() => {
    if (user?.role === 'department_staff' && user?.deptCategory) {
      navigate(`/department/${user.deptCategory}`, { replace: true })
    }
  }, [user, navigate])

  const startLogin = (deptId) => {
    setLoginModal({ open: true, target: deptId })
    setUsername('')
    setPassword('')
  }

  const handleLogin = async (deptId, credentials) => {
    setLoadingId(deptId)
    try {
      if (deptId === 'admin') {
        await loginOfficer(credentials || { username: 'admin', password: 'admin' })
        navigate('/departments')
      } else {
        await loginDepartmentStaff(deptId, credentials || { username: 'staff', password: 'staff' })
        navigate(`/department/${deptId}`)
      }
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Departments</h2>
        {!user && (
          <Button onClick={() => startLogin('admin')} disabled={loadingId==='admin'}>
            {loadingId==='admin' ? 'Logging in...' : 'Login as Main Officer'}
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sortedDepartments.map(d => (
          <Card
            key={d.id}
            className={`${user?.role === 'admin' ? 'cursor-pointer hover:bg-accent/50' : ''}`}
            onClick={() => {
              if (user?.role === 'admin') {
                navigate(`/department/${d.id}`)
              }
            }}
          >
            <CardHeader>
              <CardTitle>{d.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {(!user || user.role === 'department_staff') && (
                <Button onClick={(e) => { e.stopPropagation(); startLogin(d.id) }} disabled={loadingId===d.id}>Login</Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal
        open={loginModal.open}
        onClose={() => setLoginModal({ open: false, target: null })}
        title="Member Login"
        actions={
          <>
            <Button onClick={() => { const target = loginModal.target; setLoginModal({ open: false, target: null }); handleLogin(target, { username, password }); }} disabled={!username || !password || loadingId===loginModal.target}>
              {loadingId===loginModal.target ? 'Logging in...' : 'Login'}
            </Button>
            <Button variant="outline" onClick={() => setLoginModal({ open: false, target: null })}>Cancel</Button>
          </>
        }
      >
        <div>
          <Label htmlFor="username">Username</Label>
          <Input id="username" type="text" value={username} onChange={e=>setUsername(e.target.value)} placeholder="yourusername" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
        </div>
      </Modal>
    </div>
  )
}




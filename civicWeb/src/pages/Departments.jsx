import { useEffect, useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button, Modal, Input, Label } from '../components/ui.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'

const DEPARTMENTS = [
  { id: 'Electrical', name: 'Electrical' },
  { id: 'Road', name: 'Road' },
  { id: 'Sanitation', name: 'Sanitation' },
  { id: 'Water', name: 'Water' },
  { id: 'Other', name: 'Other' },
]

export default function Departments() {
  const { user, login } = useAuth()
  const [loadingId, setLoadingId] = useState(null)
  const [loginModal, setLoginModal] = useState({ open: false, target: null })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const sortedDepartments = useMemo(() => {
    const list = [...DEPARTMENTS]
    // ensure Other is last
    list.sort((a,b) => a.name.localeCompare(b.name))
    const idx = list.findIndex(d => d.id === 'Other')
    if (idx >= 0) {
      const other = list.splice(idx, 1)[0]
      list.push(other)
    }
    return list
  }, [])

  // Redirect to active department if logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'department_staff' && user.deptCategory) {
        navigate(`/department/${user.deptCategory}`, { replace: true })
      } else if (user.role === 'admin' || user.role === 'main_officer') {
        navigate('/', { replace: true })
      }
      setLoginModal({ open: false, target: null })
      setLoadingId(null)
    }
  }, [user, navigate])

  const startLogin = (deptId) => {
    setLoginModal({ open: true, target: deptId })
    setEmail(deptId === 'admin' ? 'admin@civic.gov.in' : `${deptId.toLowerCase()}@civic.gov.in`)
    setPassword('')
    setError('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoadingId(loginModal.target)
    setError('')
    try {
      await login(email, password)
      // Do NOT navigate here. login() only starts the Firebase auth process.
      // We must wait for the AuthContext to fetch the backend role and set `user`.
      // Once `user` is populated, the useEffect above will redirect safely.
    } catch (err) {
      setError('Invalid email or password.')
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
        title={loginModal.target === 'admin' ? "Admin Login" : `${loginModal.target} Department Login`}
        actions={
          <>
            <Button onClick={handleLogin} disabled={!email || !password || loadingId===loginModal.target}>
              {loadingId===loginModal.target ? 'Logging in...' : 'Login'}
            </Button>
            <Button variant="outline" onClick={() => setLoginModal({ open: false, target: null })}>Cancel</Button>
          </>
        }
      >
        <form onSubmit={handleLogin} className="space-y-4">
          {error && <div className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</div>}
          <div>
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {/* Hidden submit button to allow Enter key to submit */}
          <button type="submit" className="hidden" />
        </form>
      </Modal>
    </div>
  )
}

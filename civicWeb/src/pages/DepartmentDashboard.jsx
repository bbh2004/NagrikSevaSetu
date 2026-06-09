import { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../services/api'
import { Card, CardHeader, CardTitle, CardContent, Table, THead, TBody, TR, TH, TD, Badge, Button } from '../components/ui.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { RefreshCw } from 'lucide-react'

export default function DepartmentDashboard() {
  const { deptId } = useParams()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const targetDept = useMemo(() => {
    return (user?.role === 'department_staff' && user?.deptCategory) ? user.deptCategory : deptId
  }, [user, deptId])

  const fetchComplaints = useCallback(async () => {
    if (!targetDept) return
    try {
      setLoading(true)
      const data = await api.get(`/complaints?category=${targetDept}`)
      setComplaints(data || [])
    } catch (error) {
      console.error("Failed to fetch complaints:", error)
    } finally {
      setLoading(false)
    }
  }, [targetDept])

  useEffect(() => {
    fetchComplaints()
    const interval = setInterval(fetchComplaints, 30000)
    return () => clearInterval(interval)
  }, [fetchComplaints])

  const title = `${targetDept} Department`

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Button variant="outline" onClick={fetchComplaints} className="gap-2">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Action Required (Pending / In Progress)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Date Submitted</TH>
                <TH>Description</TH>
                <TH>Urgency</TH>
                <TH>Status</TH>
                <TH>Upvotes</TH>
                <TH>Action</TH>
              </TR>
            </THead>
            <TBody>
              {complaints.filter(c => c.status !== 'Resolved').length === 0 ? (
                <TR><TD colSpan={6} className="text-center py-4 text-muted-foreground">No active complaints.</TD></TR>
              ) : complaints.filter(c => c.status !== 'Resolved').map(c => (
                <TR key={c._id}>
                  <TD>{new Date(c.createdAt).toLocaleDateString()}</TD>
                  <TD className="max-w-[250px] truncate">{c.description}</TD>
                  <TD><Badge variant={c.urgency === 'High' ? 'danger' : c.urgency === 'Medium' ? 'warning' : 'default'}>{c.urgency}</Badge></TD>
                  <TD>{c.status}</TD>
                  <TD>{c.upvotes}</TD>
                  <TD>
                    <Link to={`/complaints/${c._id}`} className="text-primary font-medium hover:underline">Review &rarr;</Link>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground">Resolved Log</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Date Submitted</TH>
                <TH>Description</TH>
                <TH>Urgency</TH>
                <TH>Status</TH>
                <TH>Upvotes</TH>
                <TH>Action</TH>
              </TR>
            </THead>
            <TBody>
              {complaints.filter(c => c.status === 'Resolved').length === 0 ? (
                <TR><TD colSpan={6} className="text-center py-4 text-muted-foreground">No resolved complaints yet.</TD></TR>
              ) : complaints.filter(c => c.status === 'Resolved').map(c => (
                <TR key={c._id} className="opacity-75">
                  <TD>{new Date(c.createdAt).toLocaleDateString()}</TD>
                  <TD className="max-w-[250px] truncate">{c.description}</TD>
                  <TD><Badge variant="default">{c.urgency}</Badge></TD>
                  <TD><Badge variant="success">{c.status}</Badge></TD>
                  <TD>{c.upvotes}</TD>
                  <TD>
                    <Link to={`/complaints/${c._id}`} className="text-primary hover:underline">View</Link>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

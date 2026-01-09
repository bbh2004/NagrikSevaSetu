import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchComplaintsByDepartment, subscribeComplaintsByDepartment } from '../services/firebasePlaceholders.js'
import { Card, CardHeader, CardTitle, CardContent, Table, THead, TBody, TR, TH, TD, Badge } from '../components/ui.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function DepartmentDashboard() {
  const { deptId } = useParams()
  const [complaints, setComplaints] = useState([])
  const { user } = useAuth()

  useEffect(() => {
    let target = deptId
    if (user?.role === 'department_staff' && user?.deptCategory) target = user.deptCategory
    let unsub = null
    fetchComplaintsByDepartment(target).then(setComplaints)
    unsub = subscribeComplaintsByDepartment(target, setComplaints)
    return () => unsub && unsub()
  }, [deptId, user])

  const title = useMemo(() => (user?.deptCategory || deptId) + ' Department', [deptId, user])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{title}</h2>
      <Card>
        <CardHeader>
          <CardTitle>Pending</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Time/Date</TH>
                <TH>Complaint Name</TH>
                <TH>Urgency</TH>
                <TH>Status</TH>
                <TH>Upvotes</TH>
                <TH></TH>
              </TR>
            </THead>
            <TBody>
              {complaints.filter(c => c.status !== 'Resolved').map(c => (
                <TR key={c.id}>
                  <TD>{new Date(c.createdAt).toLocaleString()}</TD>
                  <TD>{c.name}</TD>
                  <TD><Badge variant={c.urgency === 'High' ? 'danger' : c.urgency === 'Medium' ? 'warning' : 'default'}>{c.urgency}</Badge></TD>
                  <TD>{c.status}</TD>
                  <TD>{c.upvotes}</TD>
                  <TD>
                    <Link to={`/complaints/${c.id}`} className="text-primary underline">View</Link>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resolved</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Time/Date</TH>
                <TH>Complaint Name</TH>
                <TH>Urgency</TH>
                <TH>Status</TH>
                <TH>Upvotes</TH>
                <TH></TH>
              </TR>
            </THead>
            <TBody>
              {complaints.filter(c => c.status === 'Resolved').map(c => (
                <TR key={c.id}>
                  <TD>{new Date(c.createdAt).toLocaleString()}</TD>
                  <TD>{c.name}</TD>
                  <TD><Badge variant={c.urgency === 'High' ? 'danger' : c.urgency === 'Medium' ? 'warning' : 'default'}>{c.urgency}</Badge></TD>
                  <TD>{c.status}</TD>
                  <TD>{c.upvotes}</TD>
                  <TD>
                    <Link to={`/complaints/${c.id}`} className="text-primary underline">View</Link>
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




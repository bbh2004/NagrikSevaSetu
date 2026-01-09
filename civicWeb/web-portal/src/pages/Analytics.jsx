import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Badge } from '../components/ui.jsx'
import { fetchAnalyticsData, fetchComplaintsByDepartment, subscribeComplaintsByDepartment, subscribeComplaints } from '../services/firebasePlaceholders.js'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts'
import { useAuth } from '../context/AuthContext.jsx'

export default function Analytics() {
  const [data, setData] = useState({ totals: { total: 0, open: 0, inProgress: 0, resolved: 0 }, byDay: [], byDept: [], byStatus: [] })
  const { user } = useAuth()

  useEffect(() => {
    let unsub = null
    if (user?.role === 'department_staff' && user?.deptCategory) {
      unsub = subscribeComplaintsByDepartment(user.deptCategory, async () => {
        const list = await fetchComplaintsByDepartment(user.deptCategory)
        const totals = list.reduce((acc, c) => {
          acc.total += 1
          if (c.status === 'Resolved') acc.resolved += 1
          else if (c.status === 'In Progress') acc.inProgress += 1
          else acc.open += 1
          return acc
        }, { total: 0, open: 0, inProgress: 0, resolved: 0 })
        const byStatus = [
          { name: 'Open', value: totals.open },
          { name: 'In Progress', value: totals.inProgress },
          { name: 'Resolved', value: totals.resolved },
        ]
        setData({ totals, byDay: [], byDept: [{ department: user.deptCategory, complaints: totals.resolved }], byStatus })
      })
    } else {
      unsub = subscribeComplaints(async () => {
        const d = await fetchAnalyticsData()
        setData(d)
      })
    }
    return () => unsub && unsub()
  }, [user])

  const COLORS = ['#ef4444', '#f59e0b', '#10b981']

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Complaints</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{data.totals.total}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Open</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold"><Badge>{data.totals.open}</Badge></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">In Progress</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold"><Badge variant="warning">{data.totals.inProgress}</Badge></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Resolved</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold"><Badge variant="success">{data.totals.resolved}</Badge></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Daily Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.byDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="complaints" name="Created" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Complaints by Department</CardTitle>
        </CardHeader>
        <CardContent className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.byDept}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" angle={-15} textAnchor="end" interval={0} height={60} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="complaints" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.byStatus} dataKey="value" nameKey="name" outerRadius={120} label>
                {data.byStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}




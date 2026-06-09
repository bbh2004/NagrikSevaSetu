import { useEffect, useState, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Badge } from '../components/ui.jsx'
import api from '../services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts'
import { useAuth } from '../context/AuthContext.jsx'

export default function Analytics() {
  const [data, setData] = useState({ totals: { total: 0, open: 0, inProgress: 0, resolved: 0 }, byDay: [], byDept: [], byStatus: [] })
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      
      // If dept_staff, only fetch their category. Else fetch all.
      const query = (user?.role === 'department_staff' && user?.deptCategory) 
        ? `?category=${user.deptCategory}` 
        : ''
      
      const allComplaints = await api.get(`/complaints${query}`)
      
      // Totals
      const totals = allComplaints.reduce((acc, c) => {
        acc.total += 1
        if (c.status === 'Resolved') acc.resolved += 1
        else if (c.status === 'In Progress') acc.inProgress += 1
        else acc.open += 1
        return acc
      }, { total: 0, open: 0, inProgress: 0, resolved: 0 })

      // By Department (Resolved counts)
      const DEPARTMENTS = ['Electrical', 'Road', 'Sanitation', 'Water', 'Other']
      const byDeptMap = new Map(DEPARTMENTS.map(d => [d, { department: d, complaints: 0 }]))
      
      for (const c of allComplaints) {
        if (c.status === 'Resolved') {
          const key = c.category || 'Other'
          if (byDeptMap.has(key)) {
            byDeptMap.get(key).complaints += 1
          } else {
            byDeptMap.set(key, { department: key, complaints: 1 })
          }
        }
      }
      const byDept = Array.from(byDeptMap.values())

      // By Day for the last 14 days
      const days = 14
      const start = new Date()
      start.setHours(0,0,0,0)
      start.setDate(start.getDate() - (days - 1))
      
      const fmt = (d) => {
        const y = d.getFullYear()
        const m = `${d.getMonth()+1}`.padStart(2, '0')
        const dd = `${d.getDate()}`.padStart(2, '0')
        return `${y}-${m}-${dd}`
      }
      
      const byDayMap = new Map()
      for (let i = 0; i < days; i++) {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        byDayMap.set(fmt(d), { day: fmt(d), complaints: 0, resolved: 0 })
      }
      
      for (const c of allComplaints) {
        const d = new Date(c.createdAt)
        d.setHours(0,0,0,0)
        const key = fmt(d)
        const bucket = byDayMap.get(key)
        if (bucket) {
          bucket.complaints += 1
          if (c.status === 'Resolved') bucket.resolved += 1
        }
      }
      const byDay = Array.from(byDayMap.values())

      // Status distribution for Pie
      const byStatus = [
        { name: 'Pending', value: totals.open },
        { name: 'In Progress', value: totals.inProgress },
        { name: 'Resolved', value: totals.resolved },
      ]

      setData({ totals, byDay, byDept, byStatus })
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const COLORS = ['#ef4444', '#f59e0b', '#10b981']

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading Analytics...</div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total Complaints</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{data.totals.total}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold text-red-600">{data.totals.open}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold text-yellow-600">{data.totals.inProgress}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Resolved</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold text-green-600">{data.totals.resolved}</CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Trend (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.byDay} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="complaints" name="New Reports" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {(!user || user.role === 'admin') && (
          <Card>
            <CardHeader>
              <CardTitle>Resolved by Department</CardTitle>
            </CardHeader>
            <CardContent className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byDept} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} angle={-25} textAnchor="end" />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="complaints" name="Resolved Issues" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.byStatus} dataKey="value" nameKey="name" outerRadius={120} innerRadius={60} paddingAngle={2} label>
                {data.byStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

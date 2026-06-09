/**
 * Analytics.jsx — Data analytics page for officers.
 *
 * Fixes applied:
 *   1. Now fetches data exclusively from /api/complaints/stats (MongoDB aggregation).
 *      REMOVED: client-side download of all complaints + JS loops to count them.
 *   2. byDay chart now uses server-returned `count` and `resolved` fields.
 *   3. byCategory chart uses server-returned `_id` (category name) and `count`.
 *   4. byStatus pie chart uses server-returned `byStatus` array (pre-computed).
 *   5. 'Others' (plural) is now used consistently from civic constants.
 *   6. Department staff see scoped data — the API handles this server-side.
 */
import { useEffect, useState, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui.jsx'
import api from '../services/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { useAuth } from '../context/AuthContext.jsx'
import { toast } from '../utils/toast.js'

const CHART_COLORS = {
  complaints: '#3b82f6',
  resolved:   '#10b981',
  bar:        '#8b5cf6',
}
const STATUS_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#94a3b8']

// Recharts Tooltip custom style
const TOOLTIP_STYLE = {
  contentStyle: {
    borderRadius: '8px',
    border: 'none',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    fontSize: '13px',
  },
}

export default function Analytics() {
  const [data, setData]     = useState(null) // null means "not yet loaded"
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      // Single API call — the backend does all aggregation server-side.
      // For department_staff the backend automatically scopes results to their category.
      const statsData = await api.get('/complaints/stats')
      setData(statsData)
    } catch (error) {
      console.error('[Analytics] fetchAnalytics failed:', error)
      toast.error('Failed to load analytics data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center space-y-2">
          <div className="animate-spin text-3xl">📊</div>
          <div>Loading Analytics…</div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { totals, byDay, byCategory, byStatus } = data

  // Normalise byDay: the backend returns { _id: '2026-06-09', count: N, resolved: M }
  // Recharts needs flat objects with readable keys
  const dailyChartData = byDay.map(d => ({
    day:        d._id,
    'New Reports': d.count,
    'Resolved': d.resolved,
  }))

  // Normalise byCategory: backend returns { _id: 'Road', count: N, resolved: M }
  const categoryChartData = byCategory.map(d => ({
    department:  d._id || 'Unknown',
    'Complaints': d.count,
    'Resolved':  d.resolved,
  }))

  const kpiCards = [
    { label: 'Total Complaints', value: totals.total,       color: '' },
    { label: 'Pending',          value: totals.pending,     color: 'text-red-600' },
    { label: 'In Progress',      value: totals.inProgress,  color: 'text-yellow-600' },
    { label: 'Resolved',         value: totals.resolved,    color: 'text-green-600' },
  ]

  const isAdmin = !user || user.role === 'admin' || user.role === 'main_officer'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Analytics</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isAdmin ? 'City-wide complaint overview' : `${user?.deptCategory} department overview`}
        </p>
      </div>

      {/* ── KPI Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map(({ label, value, color }) => (
          <Card key={label}>
            <CardHeader><CardTitle className="text-sm text-muted-foreground">{label}</CardTitle></CardHeader>
            <CardContent className={`text-3xl font-bold ${color}`}>{value}</CardContent>
          </Card>
        ))}
      </div>

      {/* ── Daily Trend + Department Bar Chart ─────────── */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-2' : ''} gap-6`}>
        {/* Daily Trend Line Chart */}
        <Card>
          <CardHeader><CardTitle>Daily Trend (Last 14 Days)</CardTitle></CardHeader>
          <CardContent className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="day"
                  axisLine={false} tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={v => v.slice(5)} // Show only MM-DD
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="New Reports" stroke={CHART_COLORS.complaints} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="Resolved"   stroke={CHART_COLORS.resolved}   strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Breakdown Bar Chart (admin + main_officer only) */}
        {isAdmin && (
          <Card>
            <CardHeader><CardTitle>Complaints by Department</CardTitle></CardHeader>
            <CardContent className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 10, right: 30, left: 0, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="department"
                    axisLine={false} tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    angle={-20} textAnchor="end"
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip {...TOOLTIP_STYLE} cursor={{ fill: '#f1f5f9' }} />
                  <Legend iconType="circle" />
                  <Bar dataKey="Complaints" fill={CHART_COLORS.bar}       radius={[4,4,0,0]} />
                  <Bar dataKey="Resolved"   fill={CHART_COLORS.resolved}  radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Status Pie Chart ─────────────────────────── */}
      <Card>
        <CardHeader><CardTitle>Status Distribution</CardTitle></CardHeader>
        <CardContent className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={byStatus.filter(d => d.value > 0)}
                dataKey="value" nameKey="name"
                outerRadius={120} innerRadius={60} paddingAngle={2}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {byStatus.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

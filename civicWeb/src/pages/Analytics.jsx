/**
 * Analytics.jsx — Interactive Data Visualization Dashboard
 *
 * Architecture:
 *  - Single $facet aggregation on the backend for speed (no N+1 queries)
 *  - analyticsApi (30s timeout) to handle larger data sets
 *  - Filters: Time Range, Department, Urgency — all interactive, re-fetch on change
 *  - Charts: Line, Area, Bar, Stacked Bar, Donut, Radial, Heatmap (Weekday)
 *  - Insight Cards: KPI summary + resolution time + urgency alerts
 */
import { useEffect, useState, useCallback, useMemo } from 'react'
import { analyticsApi } from '../services/api'
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import { useAuth } from '../context/AuthContext.jsx'
import { toast } from '../utils/toast.js'
import {
  TrendingUp, TrendingDown, Clock, AlertTriangle,
  CheckCircle, BarChart2, RefreshCw, Filter,
} from 'lucide-react'

// ── Design Tokens ──────────────────────────────────────────────
const C = {
  blue:    '#3b82f6',
  indigo:  '#6366f1',
  purple:  '#8b5cf6',
  green:   '#10b981',
  emerald: '#059669',
  amber:   '#f59e0b',
  orange:  '#f97316',
  red:     '#ef4444',
  rose:    '#f43f5e',
  slate:   '#64748b',
  sky:     '#0ea5e9',
  teal:    '#14b8a6',
}

const DEPT_COLORS = {
  Water:      C.sky,
  Road:       C.amber,
  Electrical: C.purple,
  Sanitation: C.emerald,
  Others:     C.slate,
}
const DEPT_NAMES = ['Water', 'Road', 'Electrical', 'Sanitation', 'Others']

const STATUS_COLORS = [C.red, C.amber, C.green, C.slate]
const URGENCY_COLORS = { High: C.red, Medium: C.amber, Low: C.green }

const TOOLTIP_STYLE = {
  contentStyle: {
    borderRadius: '10px',
    border: 'none',
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
    fontSize: '12px',
    fontFamily: 'system-ui',
    padding: '10px 14px',
  },
  cursor: { fill: 'rgba(99,102,241,0.06)' },
}

// ── Skeleton Loader ────────────────────────────────────────────
const Skeleton = ({ h = 'h-64', cls = '' }) => (
  <div className={`${h} ${cls} rounded-xl bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse`} />
)

// ── KPI Card ───────────────────────────────────────────────────
function KPICard({ label, value, sub, color, icon: Icon, trend, loading }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 shadow-sm border border-gray-100 bg-white`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
          {loading
            ? <div className="mt-2 h-9 w-20 rounded-lg bg-gray-100 animate-pulse" />
            : <p className={`mt-1 text-4xl font-bold ${color}`}>{value ?? '—'}</p>
          }
          {sub && !loading && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl bg-opacity-10`} style={{ backgroundColor: `${color.replace('text-', '')}20` }}>
          <Icon size={20} className={color} />
        </div>
      </div>
      {trend !== undefined && !loading && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          {trend >= 0
            ? <TrendingUp size={13} className="text-emerald-500" />
            : <TrendingDown size={13} className="text-red-400" />}
          <span className={trend >= 0 ? 'text-emerald-600' : 'text-red-500'}>
            {Math.abs(trend)}% vs last period
          </span>
        </div>
      )}
    </div>
  )
}

// ── Section Card wrapper ───────────────────────────────────────
function ChartCard({ title, sub, children, loading, className = '' }) {
  return (
    <div className={`rounded-2xl bg-white shadow-sm border border-gray-100 p-5 ${className}`}>
      <div className="mb-4">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {loading ? <Skeleton /> : children}
    </div>
  )
}

// ── Custom Donut Label ─────────────────────────────────────────
const DonutLabel = ({ cx, cy, label, value }) => (
  <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
    <tspan x={cx} dy="-8" fontSize="28" fontWeight="700" fill="#1e293b">{value}</tspan>
    <tspan x={cx} dy="22" fontSize="11" fill="#94a3b8">{label}</tspan>
  </text>
)

// ── No Data placeholder ────────────────────────────────────────
const NoData = ({ msg = 'No data for the selected filters' }) => (
  <div className="h-64 flex flex-col items-center justify-center gap-3 text-gray-300">
    <BarChart2 size={40} />
    <p className="text-sm">{msg}</p>
  </div>
)

// ═══════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════
export default function Analytics() {
  const { user } = useAuth()
  const isAdmin = !user || user.role === 'admin' || user.role === 'main_officer'

  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  // Filter state
  const [days, setDays]         = useState('30')
  const [dept, setDept]         = useState('All')
  const [urgency, setUrgency]   = useState('All')

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({ days, dept, urgency })
      const res = await analyticsApi.get(`/complaints/stats?${params}`)
      setData(res)
    } catch (err) {
      console.error('[Analytics] fetch failed:', err)
      setError(err.message)
      toast.error('Failed to load analytics: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [days, dept, urgency])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  // ── Derived chart data ─────────────────────────────────────
  const dailyData = useMemo(() => {
    if (!data?.byDay?.length) return []
    return data.byDay.map(d => ({
      date: d._id.slice(5), // MM-DD
      fullDate: d._id,
      'New':      d.count,
      'Resolved': d.resolved,
      'Pending':  d.pending,
    }))
  }, [data])

  const deptData = useMemo(() => {
    if (!data?.byCategory?.length) return []
    return data.byCategory.map(d => ({
      name:       d._id,
      Total:      d.total,
      Resolved:   d.resolved,
      Pending:    d.pending,
      'High Risk': d.high,
      resRate:    d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0,
    }))
  }, [data])

  const urgencyData = useMemo(() => {
    if (!data?.byUrgency?.length) return []
    const order = ['High', 'Medium', 'Low']
    return order.map(u => {
      const found = data.byUrgency.find(d => d._id === u)
      return { name: u, value: found?.count ?? 0 }
    }).filter(d => d.value > 0)
  }, [data])

  const weekdayData = useMemo(() => data?.byWeekday || [], [data])

  const resRate = useMemo(() => {
    if (!data?.totals?.total) return 0
    return Math.round((data.totals.resolved / data.totals.total) * 100)
  }, [data])

  const avgHours = useMemo(() => {
    const h = data?.resolutionStats?.avgHours ?? 0
    if (h < 24) return `${Math.round(h)}h`
    return `${(h / 24).toFixed(1)}d`
  }, [data])

  // Radar data for dept comparison
  const radarData = useMemo(() => {
    return DEPT_NAMES.map(d => {
      const found = data?.byCategory?.find(c => c._id === d)
      return {
        subject: d,
        Total:   found?.total ?? 0,
        Resolved: found?.resolved ?? 0,
      }
    })
  }, [data])

  // ── Filter bar ──────────────────────────────────────────────
  const selectCls = `
    border border-gray-200 rounded-xl text-sm px-3 py-2 bg-white shadow-sm
    focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none
    text-gray-700 font-medium cursor-pointer hover:border-gray-300 transition-colors
  `

  // ── Error state ─────────────────────────────────────────────
  if (error && !loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
      <AlertTriangle size={40} className="text-amber-400" />
      <div>
        <p className="font-semibold text-gray-700">Could not load analytics</p>
        <p className="text-sm text-gray-400 mt-1">{error}</p>
      </div>
      <button
        onClick={fetchAnalytics}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
      >
        <RefreshCw size={14} /> Retry
      </button>
    </div>
  )

  const totals = data?.totals || {}

  return (
    <div className="space-y-6 pb-10" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── Header + Filters ────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {isAdmin ? 'City-wide interactive civic data dashboard' : `${user?.deptCategory} department analytics`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1 text-xs text-gray-400 mr-1">
            <Filter size={13} /> Filters:
          </div>

          <select value={days} onChange={e => setDays(e.target.value)} className={selectCls}>
            <option value="7">Last 7 Days</option>
            <option value="14">Last 14 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 3 Months</option>
            <option value="all">All Time</option>
          </select>

          {isAdmin && (
            <select value={dept} onChange={e => setDept(e.target.value)} className={selectCls}>
              <option value="All">All Departments</option>
              {DEPT_NAMES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}

          <select value={urgency} onChange={e => setUrgency(e.target.value)} className={selectCls}>
            <option value="All">All Urgency</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Complaints"  value={totals.total}
          icon={BarChart2}          color="text-indigo-600"
          sub={`${totals.highUrgency ?? 0} high urgency`}
          loading={loading}
        />
        <KPICard
          label="Pending"           value={totals.pending}
          icon={AlertTriangle}      color="text-red-500"
          sub={`${totals.pendingHighUrgency ?? 0} high urgency pending`}
          loading={loading}
        />
        <KPICard
          label="Resolved"          value={totals.resolved}
          icon={CheckCircle}        color="text-emerald-600"
          sub={`${resRate}% resolution rate`}
          loading={loading}
        />
        <KPICard
          label="Avg Resolution"    value={loading ? '—' : avgHours}
          icon={Clock}              color="text-amber-500"
          sub="time to resolve"
          loading={loading}
        />
      </div>

      {/* ── Resolution Rate + Urgency Donut (row) ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Resolution Rate Progress */}
        <ChartCard
          title="Resolution Overview"
          sub="Status breakdown across all complaints"
          loading={loading}
        >
          {data?.byStatus?.filter(s => s.value > 0).length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.byStatus.filter(s => s.value > 0)}
                  dataKey="value" nameKey="name"
                  cx="50%" cy="50%"
                  outerRadius={100} innerRadius={62}
                  paddingAngle={3}
                  label={false}
                >
                  {data.byStatus.map((_, i) => (
                    <Cell key={i} fill={STATUS_COLORS[i]} stroke="none" />
                  ))}
                </Pie>
                <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 28, fontWeight: 700, fill: '#1e293b' }}>
                  {resRate}%
                </text>
                <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 10, fill: '#94a3b8' }}>
                  resolved
                </text>
                <Tooltip {...TOOLTIP_STYLE} />
                <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 11, color: '#64748b' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>

        {/* Urgency Distribution Donut */}
        <ChartCard
          title="Urgency Distribution"
          sub="Risk level across complaints"
          loading={loading}
        >
          {urgencyData.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={urgencyData}
                  dataKey="value" nameKey="name"
                  cx="50%" cy="50%"
                  outerRadius={100} innerRadius={62}
                  paddingAngle={3}
                >
                  {urgencyData.map((d, i) => (
                    <Cell key={i} fill={URGENCY_COLORS[d.name] ?? C.slate} stroke="none" />
                  ))}
                </Pie>
                <text x="50%" y="44%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 26, fontWeight: 700, fill: '#1e293b' }}>
                  {urgencyData.find(d => d.name === 'High')?.value ?? 0}
                </text>
                <text x="50%" y="57%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 10, fill: '#94a3b8' }}>
                  high risk
                </text>
                <Tooltip {...TOOLTIP_STYLE} />
                <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 11, color: '#64748b' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>

        {/* Weekday Activity */}
        <ChartCard
          title="Activity by Day of Week"
          sub="When are most complaints submitted?"
          loading={loading}
        >
          {weekdayData.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weekdayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="count" name="Complaints" radius={[6, 6, 0, 0]}>
                  {weekdayData.map((d, i) => (
                    <Cell key={i} fill={d.count === Math.max(...weekdayData.map(x => x.count)) ? C.indigo : `${C.indigo}60`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>
      </div>

      {/* ── Daily Trend Area Chart ─────────────────────────── */}
      <ChartCard
        title="Daily Complaint Trend"
        sub="New reports vs resolved complaints over time"
        loading={loading}
        className="col-span-full"
      >
        {dailyData.length ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradNew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.indigo} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={C.indigo} stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.green} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={C.green} stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="gradPending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.red} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={C.red} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
              <Tooltip
                {...TOOLTIP_STYLE}
                labelFormatter={v => `Date: ${v}`}
              />
              <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 11, color: '#64748b' }}>{v}</span>} />
              <Area type="monotone" dataKey="New"      stroke={C.indigo} strokeWidth={2.5} fill="url(#gradNew)"      dot={false} activeDot={{ r: 5, fill: C.indigo }} />
              <Area type="monotone" dataKey="Resolved" stroke={C.green}  strokeWidth={2.5} fill="url(#gradResolved)" dot={false} activeDot={{ r: 5, fill: C.green }} />
              <Area type="monotone" dataKey="Pending"  stroke={C.red}    strokeWidth={1.5} fill="url(#gradPending)"  dot={false} activeDot={{ r: 4, fill: C.red }} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        ) : <NoData msg="Not enough data for the selected time range. Try 'All Time'." />}
      </ChartCard>

      {/* ── Dept Stacked Bar + Radar ─────────────────────── */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          <ChartCard
            title="Complaints by Department"
            sub="Volume, resolved, pending, and high-risk breakdown"
            loading={loading}
          >
            {deptData.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 11, color: '#64748b' }}>{v}</span>} />
                  <Bar dataKey="Resolved"   stackId="a" fill={C.green}  radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Pending"    stackId="a" fill={C.amber}  radius={[0, 0, 0, 0]} />
                  <Bar dataKey="High Risk"  stackId="a" fill={C.red}    radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <NoData />}
          </ChartCard>

          <ChartCard
            title="Department Performance Radar"
            sub="Total vs Resolved — closer to outer = higher volume"
            loading={loading}
          >
            {radarData.some(d => d.Total > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Radar name="Total"    dataKey="Total"    stroke={C.indigo} fill={C.indigo} fillOpacity={0.15} strokeWidth={2} />
                  <Radar name="Resolved" dataKey="Resolved" stroke={C.green}  fill={C.green}  fillOpacity={0.1}  strokeWidth={2} />
                  <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 11, color: '#64748b' }}>{v}</span>} />
                  <Tooltip {...TOOLTIP_STYLE} />
                </RadarChart>
              </ResponsiveContainer>
            ) : <NoData />}
          </ChartCard>
        </div>
      )}

      {/* ── Resolution Rate per Dept + High Urgency Alert ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Resolution Rate Per Dept */}
        {isAdmin && (
          <ChartCard
            title="Resolution Rate by Department"
            sub="% of complaints resolved per department"
            loading={loading}
          >
            {deptData.length ? (
              <div className="space-y-3 mt-2">
                {deptData.map(d => (
                  <div key={d.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: DEPT_COLORS[d.name] ?? C.slate }} />
                        {d.name}
                      </span>
                      <span className="text-gray-500 font-semibold">{d.resRate}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-700"
                        style={{ width: `${d.resRate}%`, backgroundColor: d.resRate >= 70 ? C.green : d.resRate >= 40 ? C.amber : C.red }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : <NoData />}
          </ChartCard>
        )}

        {/* High Urgency Alert Table */}
        <ChartCard
          title="⚡ High Urgency — Pending Breakdown"
          sub="Departments needing immediate action"
          loading={loading}
        >
          {data?.highUrgencyByDept?.length ? (
            <div className="space-y-2 mt-1">
              {data.highUrgencyByDept.map(d => (
                <div key={d.category} className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100">
                  <span className="text-sm font-semibold text-red-700">{d.category}</span>
                  <span className="text-xs font-bold bg-red-100 text-red-600 px-2.5 py-1 rounded-full">
                    {d.count} pending
                  </span>
                </div>
              ))}
              <p className="text-xs text-gray-400 mt-3 text-center">
                Total {data.totals?.pendingHighUrgency ?? 0} high-urgency complaints require immediate attention
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-36 gap-3 text-emerald-500">
              <CheckCircle size={36} />
              <p className="text-sm font-medium">No high-urgency pending complaints! 🎉</p>
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── Resolution Time Insight ─────────────────────────── */}
      {!loading && data?.resolutionStats && (
        <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 p-5">
          <h3 className="font-semibold text-indigo-800 mb-3">⏱ Resolution Time Statistics</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Average', val: avgHours, color: 'text-indigo-700' },
              {
                label: 'Fastest',
                val: data.resolutionStats.minHours < 24
                  ? `${Math.round(data.resolutionStats.minHours)}h`
                  : `${(data.resolutionStats.minHours / 24).toFixed(1)}d`,
                color: 'text-emerald-700',
              },
              {
                label: 'Slowest',
                val: data.resolutionStats.maxHours < 24
                  ? `${Math.round(data.resolutionStats.maxHours)}h`
                  : `${(data.resolutionStats.maxHours / 24).toFixed(1)}d`,
                color: 'text-amber-700',
              },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-white">
                <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
                <p className={`text-3xl font-bold mt-1 ${color}`}>{val || '—'}</p>
                <p className="text-xs text-gray-400 mt-0.5">to resolve</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

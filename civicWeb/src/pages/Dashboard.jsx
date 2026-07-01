/**
 * Dashboard.jsx — Main Officer / Admin overview dashboard.
 *
 * UI overhaul:
 *  - KPI cards with icons, colour accents, and resolution rate
 *  - Action Required redesigned as a vertical card list (no table, no horizontal scroll)
 *    Each complaint shows as a compact row with dept icon, urgency pill, status pill, time, and View button
 *  - Map and Action Required are now equal-height side-by-side, both scroll internally
 *  - High urgency alert banner improved with dept breakdown chips
 *  - Overall spacing/typography tightened to match Analytics / History aesthetic
 */
import { useEffect, useState, useRef, useCallback } from 'react'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'
import api from '../services/api'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import {
  RefreshCw, AlertTriangle, CheckCircle, Clock,
  BarChart2, Zap, MapPin, ArrowRight, TrendingUp,
} from 'lucide-react'
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM } from '../constants/civic.js'
import { shortDateTime, relativeTime } from '../utils/formatDate.js'
import { toast } from '../utils/toast.js'

// ── Design tokens ─────────────────────────────────────────────
const DEPT_ICON = {
  Water:      '💧',
  Road:       '🛣️',
  Electrical: '⚡',
  Sanitation: '🗑️',
  Others:     '📋',
}
const URGENCY_STYLE = {
  High:   'bg-red-100 text-red-700 border-red-200',
  Medium: 'bg-amber-100 text-amber-700 border-amber-200',
  Low:    'bg-emerald-100 text-emerald-700 border-emerald-200',
}
const STATUS_STYLE = {
  Pending:      'bg-red-50 text-red-600',
  'In Progress':'bg-amber-50 text-amber-700',
  Resolved:     'bg-emerald-50 text-emerald-700',
  Rejected:     'bg-gray-100 text-gray-500',
}
const URGENCY_DOT = { High: 'bg-red-500', Medium: 'bg-amber-400', Low: 'bg-emerald-400' }

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' }
const MARKER_ICONS = {
  Pending:     'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
  'In Progress': 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
  Resolved:    'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
}

// ── Skeleton shimmer ─────────────────────────────────────────
const Shimmer = ({ h = 'h-5', w = 'w-full', cls = '' }) => (
  <div className={`${h} ${w} ${cls} rounded-lg bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse`} />
)

// ── KPI Card ──────────────────────────────────────────────────
function KPICard({ label, value, icon: Icon, accent, sub, loading }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm p-5`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
          {loading
            ? <Shimmer h="h-10" w="w-20" cls="mt-2" />
            : <p className={`text-4xl font-bold mt-1 ${accent}`}>{value ?? 0}</p>
          }
          {sub && !loading && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl`} style={{ backgroundColor: `${accent.includes('red') ? '#fef2f2' : accent.includes('yellow') || accent.includes('amber') ? '#fffbeb' : accent.includes('green') || accent.includes('emerald') ? '#f0fdf4' : '#eef2ff'}` }}>
          <Icon size={20} className={accent} />
        </div>
      </div>
      {/* Subtle accent strip at bottom */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${accent.includes('red') ? 'bg-red-400' : accent.includes('yellow') || accent.includes('amber') ? 'bg-amber-400' : accent.includes('green') || accent.includes('emerald') ? 'bg-emerald-400' : 'bg-indigo-400'}`} />
    </div>
  )
}

// ── Action Row (one complaint) ────────────────────────────────
function ActionRow({ c, onView, idx }) {
  const isHigh = c.urgency === 'High'
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-gray-50 cursor-pointer group
        ${idx > 0 ? 'border-t border-gray-100' : ''}
        ${isHigh ? 'bg-red-50/60 hover:bg-red-50' : ''}`}
      onClick={() => onView(c._id)}
    >
      {/* Dept icon */}
      <div className="text-xl w-8 shrink-0 text-center select-none" title={c.category}>
        {DEPT_ICON[c.category] ?? '📋'}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-gray-800">{c.category}</span>
          {/* Urgency pill */}
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${URGENCY_STYLE[c.urgency] ?? ''}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${URGENCY_DOT[c.urgency] ?? 'bg-gray-400'}`} />
            {c.urgency}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5 truncate" title={c.description}>
          {c.description
            ? c.description.slice(0, 70) + (c.description.length > 70 ? '…' : '')
            : c.voiceNoteUrl ? '🎙 Voice note attached' : 'No description'}
        </p>
      </div>

      {/* Status + time */}
      <div className="shrink-0 text-right flex flex-col items-end gap-1">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[c.status] ?? 'bg-gray-100 text-gray-500'}`}>
          {c.status}
        </span>
        <span className="text-xs text-gray-400 whitespace-nowrap" title={shortDateTime(c.createdAt)}>
          {relativeTime(c.createdAt)}
        </span>
      </div>

      {/* Arrow */}
      <ArrowRight size={14} className="text-gray-300 group-hover:text-indigo-400 shrink-0 transition-colors" />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Dashboard
// ═══════════════════════════════════════════════════════════════
export default function Dashboard() {
  const [stats, setStats]         = useState({
    total: 0, pending: 0, inProgress: 0, resolved: 0,
    highUrgency: 0, pendingHighUrgency: 0, highUrgencyByDept: [],
  })
  const [recent, setRecent]           = useState([])
  const [mapComplaints, setMapComplaints] = useState([])
  const [loading, setLoading]         = useState(true)
  const [mapLoading, setMapLoading]   = useState(false)
  const [selectedMarker, setSelectedMarker] = useState(null)

  const mapRef   = useRef(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  })

  // ── Fetch dashboard stats + recent complaints ──────────────────
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const [statsRes, complaintsRes] = await Promise.all([
        api.get('/complaints/stats'),
        api.get('/complaints?limit=50&sortBy=createdAt'),
      ])

      setStats({
        ...(statsRes?.totals || { total: 0, pending: 0, inProgress: 0, resolved: 0, highUrgency: 0, pendingHighUrgency: 0 }),
        highUrgencyByDept: statsRes?.highUrgencyByDept || [],
      })

      const list = Array.isArray(complaintsRes) ? complaintsRes : (complaintsRes?.data || [])
      const active       = list.filter(c => c.status !== 'Resolved' && c.status !== 'Rejected')
      const highPriority = active.filter(c => c.urgency === 'High')
      const others       = active.filter(c => c.urgency !== 'High')
      setRecent([...highPriority, ...others].slice(0, 10))
    } catch (error) {
      console.error('[Dashboard] fetchDashboardData failed:', error)
      toast.error('Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchMapData = useCallback(async () => {
    if (!mapRef.current) return
    try {
      setMapLoading(true)
      const bounds = mapRef.current.getBounds()
      if (!bounds) return
      const sw = bounds.getSouthWest()
      const ne = bounds.getNorthEast()
      const data = await api.get(
        `/complaints/map?swLat=${sw.lat()}&swLng=${sw.lng()}&neLat=${ne.lat()}&neLng=${ne.lng()}`
      )
      setMapComplaints(data || [])
    } catch (error) {
      console.error('[Dashboard] fetchMapData failed:', error)
    } finally {
      setMapLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 60_000)
    return () => clearInterval(interval)
  }, [fetchDashboardData])

  const onMapLoad      = useCallback(map => { mapRef.current = map; fetchMapData() }, [fetchMapData])
  const onMapUnmount   = useCallback(() => { mapRef.current = null }, [])
  const onBoundsChanged = useCallback(() => fetchMapData(), [fetchMapData])

  const resRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0

  const kpiCards = [
    { label: 'Total Complaints', value: stats.total,       accent: 'text-indigo-600', icon: BarChart2, sub: `${resRate}% resolved` },
    { label: 'Pending',          value: stats.pending,     accent: 'text-red-500',    icon: AlertTriangle, sub: `${stats.pendingHighUrgency} high urgency` },
    { label: 'In Progress',      value: stats.inProgress,  accent: 'text-amber-500',  icon: Clock, sub: 'being actioned' },
    { label: 'Resolved',         value: stats.resolved,    accent: 'text-emerald-600',icon: CheckCircle, sub: 'all time' },
  ]

  return (
    <div className="space-y-5 pb-10" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Welcome back, <span className="font-medium text-indigo-600">{user?.name}</span>.
            {' '}Here's the current city-wide situation.
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors shrink-0"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(card => (
          <KPICard key={card.label} {...card} loading={loading} />
        ))}
      </div>

      {/* ── High Urgency Alert Banner ────────────────────────── */}
      {stats.pendingHighUrgency > 0 && !loading && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <div className="p-2 bg-red-100 rounded-xl shrink-0">
            <Zap size={16} className="text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-800">
              {stats.pendingHighUrgency} pending High Urgency complaint{stats.pendingHighUrgency > 1 ? 's' : ''} require immediate attention
            </p>
            {stats.highUrgencyByDept?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {stats.highUrgencyByDept.map(d => (
                  <span key={d.category} className="text-xs bg-red-100 border border-red-200 text-red-700 px-2 py-0.5 rounded-full font-medium">
                    {DEPT_ICON[d.category]} {d.category}: {d.count}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => navigate('/history?urgency=High&status=Pending')}
            className="shrink-0 text-xs font-semibold text-red-600 hover:text-red-800 transition-colors flex items-center gap-1 whitespace-nowrap"
          >
            View all <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* ── Action Required + Live Map ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Action Required ─────────────────────────────── */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col" style={{ minHeight: '480px', maxHeight: '520px' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="font-semibold text-gray-900">⚡ Action Required</h3>
              <p className="text-xs text-gray-400 mt-0.5">Top active complaints, high urgency first</p>
            </div>
            <button
              onClick={() => navigate('/history')}
              className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight size={12} />
            </button>
          </div>

          {/* Body — scrollable */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {loading ? (
              <div className="space-y-2 px-3 py-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <Shimmer h="h-8" w="w-8" cls="rounded-xl shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Shimmer h="h-4" w="w-32" />
                      <Shimmer h="h-3" w="w-48" />
                    </div>
                    <Shimmer h="h-6" w="w-16" cls="rounded-full shrink-0" />
                  </div>
                ))}
              </div>
            ) : recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-12 text-gray-300">
                <CheckCircle size={40} />
                <p className="text-sm font-medium text-gray-400">All clear! No active complaints 🎉</p>
              </div>
            ) : (
              recent.map((c, idx) => (
                <ActionRow
                  key={c._id}
                  c={c}
                  idx={idx}
                  onView={id => navigate(`/complaints/${id}`)}
                />
              ))
            )}
          </div>

          {/* Footer summary */}
          {!loading && recent.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Showing {recent.length} active complaint{recent.length !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                {Object.entries(URGENCY_DOT).map(([level, dot]) => (
                  <span key={level} className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    {level}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Live Incident Map ────────────────────────────── */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col" style={{ minHeight: '480px', maxHeight: '520px' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <MapPin size={16} className="text-indigo-500" />
                Live Incident Map
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Complaints in current viewport</p>
            </div>
            {mapLoading && (
              <span className="text-xs text-indigo-400 animate-pulse flex items-center gap-1">
                <RefreshCw size={11} className="animate-spin" /> Updating…
              </span>
            )}
          </div>

          {/* Map legend */}
          <div className="flex items-center gap-4 px-5 py-2 border-b border-gray-50 text-xs text-gray-500 shrink-0">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />Pending</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />In Progress</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Resolved</span>
            <span className="ml-auto text-gray-400">{mapComplaints.length} pins</span>
          </div>

          {/* Map area — fills rest of card */}
          <div className="flex-1 overflow-hidden rounded-b-2xl">
            {loadError ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 bg-red-50 text-red-600 text-sm font-medium p-6 text-center">
                <AlertTriangle size={28} />
                <span>Map failed to load. Check <code className="bg-red-100 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code></span>
              </div>
            ) : !import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 bg-amber-50 text-amber-700 text-sm px-6 text-center">
                <span className="text-3xl">🗺️</span>
                <span className="font-medium">Google Maps API key missing</span>
                <code className="text-xs bg-amber-100 px-2 py-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code>
              </div>
            ) : !isLoaded ? (
              <div className="h-full flex items-center justify-center bg-gray-50 text-gray-400 text-sm">
                Loading Map…
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={MAP_CONTAINER_STYLE}
                center={MAP_DEFAULT_CENTER}
                zoom={MAP_DEFAULT_ZOOM}
                onLoad={onMapLoad}
                onUnmount={onMapUnmount}
                onBoundsChanged={onBoundsChanged}
                options={{ disableDefaultUI: true, zoomControl: true, clickableIcons: false }}
              >
                {mapComplaints
                  .filter(c => c.location?.coordinates)
                  .map(c => (
                    <Marker
                      key={c._id}
                      position={{ lat: c.location.coordinates[1], lng: c.location.coordinates[0] }}
                      icon={MARKER_ICONS[c.status] || MARKER_ICONS.Pending}
                      onClick={() => setSelectedMarker(c)}
                    />
                  ))}

                {selectedMarker && (
                  <InfoWindow
                    position={{
                      lat: selectedMarker.location.coordinates[1],
                      lng: selectedMarker.location.coordinates[0],
                    }}
                    onCloseClick={() => setSelectedMarker(null)}
                  >
                    <div className="space-y-1 text-sm min-w-[170px]">
                      <div className="font-bold text-gray-800">
                        {DEPT_ICON[selectedMarker.category]} {selectedMarker.category}
                      </div>
                      <div className="text-xs text-gray-400">{relativeTime(selectedMarker.createdAt)}</div>
                      <div className="text-xs">
                        Status: <strong className={selectedMarker.status === 'Pending' ? 'text-red-600' : selectedMarker.status === 'Resolved' ? 'text-emerald-600' : 'text-amber-600'}>
                          {selectedMarker.status}
                        </strong>
                      </div>
                      <div className="text-xs">
                        Urgency: <strong className={selectedMarker.urgency === 'High' ? 'text-red-600' : selectedMarker.urgency === 'Medium' ? 'text-amber-600' : 'text-emerald-600'}>
                          {selectedMarker.urgency}
                        </strong>
                      </div>
                      {selectedMarker.upvotes > 0 && (
                        <div className="text-xs flex items-center gap-1">
                          <TrendingUp size={10} className="text-indigo-400" />
                          {selectedMarker.upvotes} upvote{selectedMarker.upvotes !== 1 ? 's' : ''}
                        </div>
                      )}
                      <div className="pt-2">
                        <Link
                          to={`/complaints/${selectedMarker._id}`}
                          className="text-indigo-600 font-semibold hover:text-indigo-800 text-xs flex items-center gap-1"
                        >
                          View details <ArrowRight size={11} />
                        </Link>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}

/**
 * Dashboard.jsx — Main Officer / Admin overview dashboard.
 *
 * Fixes applied:
 *   1. Stats: Now reads statsRes.totals (not statsRes directly) — fixes blank KPI cards.
 *   2. Map: Uses new /api/complaints/map endpoint with viewport bounding box queries
 *           instead of loading the first 20 complaints from /complaints.
 *   3. Map: Default center changed from Bangalore to Ranchi (Jharkhand).
 *   4. Map: On bounds_changed, re-fetches only the complaints in the visible viewport.
 *   5. Dates: Use shortDateTime() from formatDate utilities for precise timestamps.
 *   6. Urgency/status: Centralised via urgencyVariant/statusVariant from civic constants.
 */
import { useEffect, useState, useRef, useCallback } from 'react'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'
import api from '../services/api'
import {
  Card, CardHeader, CardTitle, CardContent,
  Table, THead, TBody, TR, TH, TD, Badge, Button,
} from '../components/ui.jsx'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { RefreshCw } from 'lucide-react'
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM, urgencyVariant } from '../constants/civic.js'
import { shortDateTime, relativeTime } from '../utils/formatDate.js'
import { toast } from '../utils/toast.js'

const MAP_CONTAINER_STYLE = { width: '100%', height: '380px' }

// Google Maps icon URLs by status — colour-coded for quick visual triage
const MARKER_ICONS = {
  Pending:     'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
  'In Progress': 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
  Resolved:    'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
}

export default function Dashboard() {
  const [stats, setStats]             = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0, highUrgency: 0 })
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
        api.get('/complaints?limit=50&sortBy=createdAt'), // top-50 for the recent table
      ])

      // FIX: read .totals, not the root of the response
      setStats(statsRes?.totals || { total: 0, pending: 0, inProgress: 0, resolved: 0, highUrgency: 0 })

      // /complaints returns { data: [...], pagination: {...} } via updated api.js interceptor
      const list = Array.isArray(complaintsRes) ? complaintsRes : (complaintsRes?.data || [])
      // Prioritise High urgency in the "action required" table
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

  // ── Fetch map markers for the current viewport ─────────────────
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
    // Poll every 60 seconds. A future upgrade would replace this with socket.io events.
    const interval = setInterval(fetchDashboardData, 60_000)
    return () => clearInterval(interval)
  }, [fetchDashboardData])

  const onMapLoad = useCallback((map) => {
    mapRef.current = map
    // Fetch initial map data once the map is mounted
    fetchMapData()
  }, [fetchMapData])

  const onMapUnmount = useCallback(() => {
    mapRef.current = null
  }, [])

  // Re-fetch map pins whenever the officer pans or zooms
  const onBoundsChanged = useCallback(() => {
    fetchMapData()
  }, [fetchMapData])

  const statsCards = [
    { label: 'Total Complaints', value: stats.total,       color: '' },
    { label: 'Pending',          value: stats.pending,     color: 'text-red-600' },
    { label: 'In Progress',      value: stats.inProgress,  color: 'text-yellow-600' },
    { label: 'Resolved',         value: stats.resolved,    color: 'text-green-600' },
  ]

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Main Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back, {user?.name}. Here's the current city-wide situation.
          </p>
        </div>
        <Button variant="outline" onClick={fetchDashboardData} className="gap-2" disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      {/* ── KPI Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map(({ label, value, color }) => (
          <Card key={label}>
            <CardHeader><CardTitle className="text-sm text-muted-foreground">{label}</CardTitle></CardHeader>
            <CardContent className={`text-3xl font-bold ${color}`}>
              {loading ? '…' : value}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── High Urgency Alert Banner ───────────────────── */}
      {stats.highUrgency > 0 && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <span className="text-red-500 text-xl">⚡</span>
          <div>
            <span className="font-semibold text-red-700">
              {stats.highUrgency} HIGH urgency complaint{stats.highUrgency > 1 ? 's' : ''}
            </span>
            <span className="text-red-600 text-sm ml-2">require immediate attention.</span>
          </div>
        </div>
      )}

      {/* ── Recent Issues Table + Live Map ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Issues */}
        <Card>
          <CardHeader>
            <CardTitle>Action Required (Top Issues)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>Category</TH>
                  <TH>Urgency</TH>
                  <TH>Reported</TH>
                  <TH>Status</TH>
                  <TH></TH>
                </TR>
              </THead>
              <TBody>
                {loading ? (
                  <TR><TD colSpan={5} className="text-center text-muted-foreground py-6">Loading…</TD></TR>
                ) : recent.length === 0 ? (
                  <TR><TD colSpan={5} className="text-center text-muted-foreground py-6">✅ No active complaints</TD></TR>
                ) : recent.map(c => (
                  <TR key={c._id}>
                    <TD className="font-medium">{c.category}</TD>
                    <TD>
                      <Badge variant={urgencyVariant(c.urgency)}>{c.urgency}</Badge>
                    </TD>
                    <TD className="text-xs text-muted-foreground" title={shortDateTime(c.createdAt)}>
                      {relativeTime(c.createdAt)}
                    </TD>
                    <TD>{c.status}</TD>
                    <TD>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/complaints/${c._id}`)}>
                        View
                      </Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        {/* Live Incident Map */}
        <Card className="h-[480px]">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Live Incident Map</CardTitle>
              {mapLoading && <span className="text-xs text-muted-foreground animate-pulse">Updating…</span>}
            </div>
          </CardHeader>
          <CardContent>
            {loadError ? (
              <div className="h-[380px] flex items-center justify-center bg-red-50 rounded text-red-600 font-medium text-sm">
                Map failed to load. Verify VITE_GOOGLE_MAPS_API_KEY in your .env file.
              </div>
            ) : !import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
              <div className="h-[380px] flex flex-col items-center justify-center bg-yellow-50 border border-yellow-200 rounded text-yellow-700 font-medium px-4 text-center gap-2">
                <span className="text-2xl">🗺️</span>
                <span>Google Maps API key is missing.</span>
                <code className="text-xs bg-yellow-100 px-2 py-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code>
              </div>
            ) : !isLoaded ? (
              <div className="h-[380px] flex items-center justify-center bg-gray-50 rounded text-muted-foreground">
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
                    <div className="space-y-1 text-sm min-w-[160px]">
                      <div className="font-bold">{selectedMarker.category} Issue</div>
                      <div className="text-xs text-gray-500">{relativeTime(selectedMarker.createdAt)}</div>
                      <div>Status: <strong>{selectedMarker.status}</strong></div>
                      <div>Urgency: <strong>{selectedMarker.urgency}</strong></div>
                      <div>Upvotes: {selectedMarker.upvotes ?? 0}</div>
                      <div className="pt-2">
                        <Link
                          to={`/complaints/${selectedMarker._id}`}
                          className="text-blue-600 font-medium hover:underline text-xs"
                        >
                          View Full Details →
                        </Link>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

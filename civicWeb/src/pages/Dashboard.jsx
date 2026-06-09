import { useEffect, useState, useRef, useCallback } from 'react'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'
import api from '../services/api'
import { Card, CardHeader, CardTitle, CardContent, Table, THead, TBody, TR, TH, TD, Badge, Button } from '../components/ui.jsx'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { RefreshCw } from 'lucide-react'

const mapContainerStyle = { width: '100%', height: '380px' }
const center = { lat: 13.0314363, lng: 77.5646142 }

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 })
  const [recent, setRecent] = useState([])
  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMarker, setSelectedMarker] = useState(null)
  
  const mapRef = useRef(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [statsRes, complaintsRes] = await Promise.all([
        api.get('/complaints/stats'),
        api.get('/complaints') // Gets all complaints, sorted desc by default
      ])
      
      setStats(statsRes || { total: 0, pending: 0, inProgress: 0, resolved: 0 })
      const list = complaintsRes || []
      setAll(list)
      
      // Top 5 recent complaints, prioritizing High urgency
      const nonResolved = list.filter(c => c.status !== 'Resolved')
      const highPriority = nonResolved.filter(c => c.urgency === 'High')
      const others = nonResolved.filter(c => c.urgency !== 'High')
      setRecent([...highPriority, ...others].slice(0, 5))
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const onLoad = useCallback(function callback(map) {
    mapRef.current = map
  }, [])

  const onUnmount = useCallback(function callback(map) {
    mapRef.current = null
  }, [])

  const getMarkerIcon = (status) => {
    // Return a URL to a colored pin based on status
    const color = status === 'Resolved' ? 'green' : status === 'In Progress' ? 'blue' : 'red'
    return `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Main Dashboard</h2>
        <Button variant="outline" onClick={fetchData} className="gap-2">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Total Complaints</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{stats.total}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Pending</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold text-red-600">{stats.pending}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">In Progress</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold text-yellow-600">{stats.inProgress}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Resolved</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold text-green-600">{stats.resolved}</CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Recent Issues (Action Required)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>Category</TH>
                  <TH>Urgency</TH>
                  <TH>Status</TH>
                  <TH></TH>
                </TR>
              </THead>
              <TBody>
                {recent.length === 0 ? (
                  <TR><TD colSpan={4} className="text-center text-muted-foreground py-4">No active complaints</TD></TR>
                ) : (
                  recent.map(c => (
                    <TR key={c._id}>
                      <TD className="font-medium">{c.category}</TD>
                      <TD><Badge variant={c.urgency === 'High' ? 'danger' : c.urgency === 'Medium' ? 'warning' : 'default'}>{c.urgency}</Badge></TD>
                      <TD>{c.status}</TD>
                      <TD>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/complaints/${c._id}`)}>View</Button>
                      </TD>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="h-[480px]">
          <CardHeader>
            <CardTitle>Live Incident Map</CardTitle>
          </CardHeader>
          <CardContent>
            {loadError ? (
              <div className="h-[380px] flex items-center justify-center bg-gray-100 rounded text-red-500 font-medium">
                Map failed to load. Check API key.
              </div>
            ) : !isLoaded ? (
              <div className="h-[380px] flex items-center justify-center bg-gray-100 rounded text-muted-foreground">
                Loading Map...
              </div>
            ) : !import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
               <div className="h-[380px] flex items-center justify-center bg-yellow-50 border border-yellow-200 rounded text-yellow-700 font-medium px-4 text-center">
                Google Maps API Key is missing.<br/>Please add VITE_GOOGLE_MAPS_API_KEY to .env
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={14}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{ disableDefaultUI: true, zoomControl: true }}
              >
                {all.filter(c => c.status !== 'Resolved' && c.location?.coordinates).map(c => (
                  <Marker
                    key={c._id}
                    position={{ lat: c.location.coordinates[1], lng: c.location.coordinates[0] }}
                    icon={getMarkerIcon(c.status)}
                    onClick={() => setSelectedMarker(c)}
                  />
                ))}

                {selectedMarker && (
                  <InfoWindow
                    position={{ lat: selectedMarker.location.coordinates[1], lng: selectedMarker.location.coordinates[0] }}
                    onCloseClick={() => setSelectedMarker(null)}
                  >
                    <div className="space-y-1 text-sm min-w-[150px]">
                      <div className="font-bold">{selectedMarker.category} Issue</div>
                      <div>Status: {selectedMarker.status}</div>
                      <div>Urgency: {selectedMarker.urgency}</div>
                      <div className="pt-2">
                        <Link to={`/complaints/${selectedMarker._id}`} className="text-primary font-medium hover:underline">
                          View Details &rarr;
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

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { fetchStats, fetchRecentComplaints, fetchAllComplaints, subscribeComplaints } from '../services/firebasePlaceholders.js'
import { Card, CardHeader, CardTitle, CardContent, Table, THead, TBody, TR, TH, TD, Badge } from '../components/ui.jsx'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useRef } from 'react'

// Create colored marker icons based on status
const createMarkerIcon = (status) => {
  const color = status === 'Open' ? 'red' : status === 'In Progress' ? 'blue' : 'green'
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })
}

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, open: 0, resolved: 0 })
  const [recent, setRecent] = useState([])
  const [all, setAll] = useState([])
  const mapRef = useRef(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchStats().then(setStats)
    // initial load
    fetchAllComplaints().then(allComplaints => {
      setAll(allComplaints)
      const nonResolved = allComplaints.filter(c => c.status !== 'Resolved')
      const highPriority = nonResolved.filter(c => c.urgency === 'High').sort((a,b) => b.createdAt - a.createdAt)
      const others = nonResolved.filter(c => c.urgency !== 'High').sort((a,b) => b.createdAt - a.createdAt)
      const recentList = [...highPriority, ...others].slice(0, 5)
      setRecent(recentList)
    })
    // realtime subscription
    const unsubscribe = subscribeComplaints(list => {
      setAll(list)
      const nonResolved = list.filter(c => c.status !== 'Resolved')
      const highPriority = nonResolved.filter(c => c.urgency === 'High').sort((a,b) => b.createdAt - a.createdAt)
      const others = nonResolved.filter(c => c.urgency !== 'High').sort((a,b) => b.createdAt - a.createdAt)
      const recentList = [...highPriority, ...others].slice(0, 5)
      setRecent(recentList)
      setStats({
        total: list.length,
        open: list.filter(c => c.status !== 'Resolved').length,
        resolved: list.filter(c => c.status === 'Resolved').length,
      })
    })
    return () => unsubscribe && unsubscribe()
  }, [])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Complaints</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{stats.total}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Open</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{stats.open}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resolved</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{stats.resolved}</CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Recent Complaints (High Priority First)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Department</TH>
                  <TH>Urgency</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <TBody>
                {recent.map(c => (
                  <TR key={c.id}>
                    <TD className="font-medium">{c.name}</TD>
                    <TD>{c.deptId}</TD>
                    <TD><Badge variant={c.urgency === 'High' ? 'danger' : c.urgency === 'Medium' ? 'warning' : 'default'}>{c.urgency}</Badge></TD>
                    <TD>{c.status}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="h-[480px]">
          <CardHeader>
            <CardTitle>Complaints Map</CardTitle>
          </CardHeader>
          <CardContent>
            <MapContainer center={[13.0314363, 77.5646142]} zoom={17} style={{ height: 380, width: '100%' }} whenCreated={(map) => { mapRef.current = map }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {all.filter(c => c.status !== 'Resolved').map(c => (
                <Marker key={c.id} position={[c.location.lat, c.location.lng]} icon={createMarkerIcon(c.status)} eventHandlers={{ click: () => { if (mapRef.current) { mapRef.current.flyTo([c.location.lat, c.location.lng], 15, { duration: 0.8 }) } } }}>
                  <Popup>
                    <div className="space-y-1 text-sm">
                      <div className="font-semibold">{c.name}</div>
                      <div>Department: {c.deptId}</div>
                      <div>Status: {c.status}</div>
                      <div>Urgency: {c.urgency}</div>
                      <button
                        className="text-primary underline"
                        onClick={() => {
                          // Access control: require login; admin or matching department only
                          if (!user) return
                          if (user.role === 'admin' || (user.role === 'department_staff' && user.deptCategory === c.deptId)) {
                            navigate(`/complaints/${c.id}`)
                          }
                        }}
                      >
                        View
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}




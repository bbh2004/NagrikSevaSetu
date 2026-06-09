import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '../components/ui.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { ArrowLeft, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'

export default function ComplaintDetail() {
  const { complaintId } = useParams()
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  const fetchComplaint = async () => {
    try {
      setLoading(true)
      const data = await api.get(`/complaints/${complaintId}`)
      setComplaint(data)
    } catch (error) {
      console.error("Failed to load complaint details", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComplaint()
  }, [complaintId])

  const handleUpdateStatus = async (newStatus) => {
    try {
      setUpdating(true)
      await api.patch(`/complaints/${complaintId}/status`, { status: newStatus })
      await fetchComplaint() // Refresh data
    } catch (error) {
      alert(error.message || "Failed to update status")
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading complaint details...</div>
  if (!complaint) return <div className="p-8 text-center text-red-500 font-bold">Complaint not found.</div>

  const canEdit = user && (user.role === 'admin' || user.role === 'department_staff')

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <Button variant="outline" onClick={() => navigate(-1)} className="gap-2 mb-4">
        <ArrowLeft size={16} /> Back
      </Button>
      
      <Card>
        <CardHeader className="bg-slate-50 border-b">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{complaint.category} Issue reported on {new Date(complaint.createdAt).toLocaleDateString()}</CardTitle>
              <div className="text-sm text-muted-foreground mt-1">ID: {complaint._id}</div>
            </div>
            <Badge variant={complaint.status === 'Resolved' ? 'success' : complaint.status === 'Rejected' ? 'danger' : complaint.status === 'In Progress' ? 'warning' : 'default'} className="text-sm px-3 py-1">
              {complaint.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Citizen Description</h4>
                <div className="bg-slate-50 p-4 rounded-md border text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {complaint.description}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded border">
                  <div className="text-xs text-muted-foreground uppercase">Urgency Score</div>
                  <div className="mt-1 font-semibold flex items-center gap-2">
                    <Badge variant={complaint.urgency === 'High' ? 'danger' : complaint.urgency === 'Medium' ? 'warning' : 'default'}>
                      {complaint.urgency}
                    </Badge>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded border">
                  <div className="text-xs text-muted-foreground uppercase">Community Upvotes</div>
                  <div className="mt-1 font-bold text-lg">{complaint.upvotes}</div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded border">
                <div className="text-xs text-muted-foreground uppercase mb-1">Location Coordinates</div>
                <div className="font-mono text-sm">
                  Lat: {complaint.location?.coordinates[1]} <br/>
                  Lng: {complaint.location?.coordinates[0]}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Evidence Photo</h4>
              {complaint.imageUrl ? (
                <div className="rounded-lg overflow-hidden border shadow-sm h-[300px] bg-slate-100 flex items-center justify-center">
                  <img
                    src={complaint.imageUrl}
                    alt="Evidence"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-dashed h-[300px] flex flex-col items-center justify-center text-muted-foreground bg-slate-50">
                  <AlertCircle size={32} className="mb-2 opacity-20" />
                  No photo provided
                </div>
              )}
            </div>
          </div>

          {/* Action Panel for Officers */}
          {canEdit && (
            <div className="mt-8 pt-6 border-t">
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Official Actions</h4>
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="outline" 
                  className="gap-2 border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                  disabled={updating || complaint.status === 'In Progress' || complaint.status === 'Resolved'}
                  onClick={() => handleUpdateStatus('In Progress')}
                >
                  <Clock size={16} /> Mark In Progress
                </Button>
                <Button 
                  className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                  disabled={updating || complaint.status === 'Resolved'}
                  onClick={() => handleUpdateStatus('Resolved')}
                >
                  <CheckCircle size={16} /> Mark as Resolved
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2 border-red-500 text-red-700 hover:bg-red-50 ml-auto"
                  disabled={updating || complaint.status === 'Rejected'}
                  onClick={() => handleUpdateStatus('Rejected')}
                >
                  <XCircle size={16} /> Reject (Invalid)
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

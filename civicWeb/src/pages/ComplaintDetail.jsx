/**
 * ComplaintDetail.jsx — Full detail view + action panel for a single complaint.
 *
 * Fixes applied:
 *   1. Citizen Details: Renders complaint.userId.name/email/phone with full optional
 *      chaining safety — prevents crash when userId is null (deleted account).
 *   2. Image Lightbox: Evidence photo is now click-to-expand (opens in new tab).
 *   3. Toast: alert() replaced with toast.success/error notifications.
 *   4. Date: shortDateTime() used instead of toLocaleDateString().
 *   5. Urgency/Status: centralised variants from civic constants.
 *   6. canEdit: 'main_officer' added to the authorized roles for status updates.
 *   7. Status buttons: show correct disabled states preventing illegal transitions.
 */
import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import {
  Card, CardHeader, CardTitle, CardContent, Button, Badge,
} from '../components/ui.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import {
  ArrowLeft, CheckCircle, Clock, XCircle, AlertCircle,
  MapPin, User, Mail, Phone, ExternalLink, ThumbsUp,
} from 'lucide-react'
import { urgencyVariant, statusVariant } from '../constants/civic.js'
import { shortDateTime, relativeTime } from '../utils/formatDate.js'
import { toast } from '../utils/toast.js'

export default function ComplaintDetail() {
  const { complaintId } = useParams()
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [updating, setUpdating]   = useState(false)
  const navigate  = useNavigate()
  const { user }  = useAuth()

  const fetchComplaint = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.get(`/complaints/${complaintId}`)
      setComplaint(data)
    } catch (error) {
      console.error('[ComplaintDetail] fetchComplaint failed:', error)
      toast.error('Could not load complaint details.')
    } finally {
      setLoading(false)
    }
  }, [complaintId])

  useEffect(() => {
    fetchComplaint()
  }, [fetchComplaint])

  const handleUpdateStatus = async (newStatus) => {
    const toastId = toast.loading(`Updating status to "${newStatus}"…`)
    try {
      setUpdating(true)
      await api.patch(`/complaints/${complaintId}/status`, { status: newStatus })
      toast.dismiss(toastId)
      toast.success(`Status updated to "${newStatus}"`)
      await fetchComplaint() // Re-fetch to show fresh data
    } catch (error) {
      toast.dismiss(toastId)
      toast.error(error.message || 'Failed to update status. Please try again.')
      console.error('[ComplaintDetail] handleUpdateStatus failed:', error)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center space-y-2">
          <div className="animate-spin text-3xl">🔍</div>
          <div>Loading complaint details…</div>
        </div>
      </div>
    )
  }

  if (!complaint) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <AlertCircle size={48} className="text-red-400 mx-auto" />
          <p className="text-red-600 font-semibold">Complaint not found.</p>
          <Button variant="outline" onClick={() => navigate(-1)}>← Go Back</Button>
        </div>
      </div>
    )
  }

  // Roles that may take action on a complaint
  const canEdit = user && (
    user.role === 'admin' ||
    user.role === 'main_officer' ||
    user.role === 'department_staff'
  )

  // Reporter details — safe even if userId was deleted (null)
  const reporter = {
    name:  complaint.userId?.name  || 'Unknown Citizen',
    email: complaint.userId?.email || '—',
    phone: complaint.userId?.phone || '—',
  }

  // Coordinate display (GeoJSON is [lng, lat])
  const coords = complaint.location?.coordinates
  const lat    = coords?.[1]
  const lng    = coords?.[0]
  const gmapsUrl = lat && lng
    ? `https://maps.google.com/maps?q=${lat},${lng}&z=16`
    : null

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* ── Back Button ─────────────────────────────────── */}
      <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
        <ArrowLeft size={16} /> Back
      </Button>

      {/* ── Main Complaint Card ─────────────────────────── */}
      <Card>
        {/* Header */}
        <CardHeader className="bg-slate-50 border-b">
          <div className="flex justify-between items-start flex-wrap gap-3">
            <div>
              <CardTitle className="text-xl">
                {complaint.category} Issue
                <span className="text-muted-foreground font-normal text-base ml-2">
                  — reported {relativeTime(complaint.createdAt)}
                </span>
              </CardTitle>
              <div className="text-xs text-muted-foreground mt-1 font-mono">
                ID: {complaint._id}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {shortDateTime(complaint.createdAt)}
              </div>
            </div>
            <Badge variant={statusVariant(complaint.status)} className="text-sm px-3 py-1">
              {complaint.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-8">
          {/* ── Two-column grid: Details + Evidence ──── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Left column: Description, metrics, location */}
            <div className="space-y-5">
              {/* Description */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Citizen Description
                </h4>
                <div className="bg-slate-50 p-4 rounded-md border text-slate-800 leading-relaxed whitespace-pre-wrap text-sm">
                  {complaint.description}
                </div>
              </div>

              {/* Urgency + Upvotes */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded border">
                  <div className="text-xs text-muted-foreground uppercase mb-1">AI Urgency</div>
                  <Badge variant={urgencyVariant(complaint.urgency)} className="text-sm px-2 py-0.5">
                    {complaint.urgency}
                  </Badge>
                </div>
                <div className="bg-slate-50 p-3 rounded border">
                  <div className="text-xs text-muted-foreground uppercase mb-1 flex items-center gap-1">
                    <ThumbsUp size={11} /> Community Upvotes
                  </div>
                  <div className="font-bold text-xl">{complaint.upvotes ?? 0}</div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-slate-50 p-3 rounded border">
                <div className="text-xs text-muted-foreground uppercase mb-2 flex items-center gap-1">
                  <MapPin size={11} /> Location Coordinates
                </div>
                {lat && lng ? (
                  <div className="space-y-1">
                    <div className="font-mono text-sm">
                      Lat: {lat.toFixed(6)} &nbsp; Lng: {lng.toFixed(6)}
                    </div>
                    {gmapsUrl && (
                      <a
                        href={gmapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Open in Google Maps <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No location data</span>
                )}
              </div>
            </div>

            {/* Right column: Evidence photo + Reporter info */}
            <div className="space-y-5">
              {/* Evidence Photo */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Evidence Photo
                </h4>
                {complaint.imageUrl ? (
                  <a
                    href={complaint.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg overflow-hidden border shadow-sm h-[220px] bg-slate-100 group relative"
                    title="Click to open full-size image"
                  >
                    <img
                      src={complaint.imageUrl}
                      alt="Evidence"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-end justify-end p-2">
                      <ExternalLink size={16} className="text-white opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  </a>
                ) : (
                  <div className="rounded-lg border border-dashed h-[220px] flex flex-col items-center justify-center text-muted-foreground bg-slate-50">
                    <AlertCircle size={28} className="mb-2 opacity-30" />
                    <span className="text-sm">No photo provided</span>
                  </div>
                )}
              </div>

              {/* Reporter Info — Fix: renders userId safely with optional chaining */}
              <div className="bg-slate-50 p-4 rounded border space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Reporter Details
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User size={14} className="text-muted-foreground flex-shrink-0" />
                    <span className="font-medium">{reporter.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={14} className="text-muted-foreground flex-shrink-0" />
                    {reporter.email !== '—' ? (
                      <a href={`mailto:${reporter.email}`} className="text-blue-600 hover:underline">
                        {reporter.email}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={14} className="text-muted-foreground flex-shrink-0" />
                    {reporter.phone !== '—' ? (
                      <a href={`tel:${reporter.phone}`} className="text-blue-600 hover:underline">
                        {reporter.phone}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Officer Action Panel ─────────────────────── */}
          {canEdit && (
            <div className="pt-6 border-t">
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-4 text-muted-foreground">
                Official Actions
              </h4>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  className="gap-2 border-yellow-400 text-yellow-700 hover:bg-yellow-50"
                  disabled={
                    updating ||
                    complaint.status === 'In Progress' ||
                    complaint.status === 'Resolved' ||
                    complaint.status === 'Rejected'
                  }
                  onClick={() => handleUpdateStatus('In Progress')}
                >
                  <Clock size={16} />
                  Mark In Progress
                </Button>

                <Button
                  className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                  disabled={updating || complaint.status === 'Resolved'}
                  onClick={() => handleUpdateStatus('Resolved')}
                >
                  <CheckCircle size={16} />
                  Mark as Resolved
                </Button>

                <Button
                  variant="outline"
                  className="gap-2 border-red-400 text-red-700 hover:bg-red-50 ml-auto"
                  disabled={
                    updating ||
                    complaint.status === 'Rejected' ||
                    complaint.status === 'Resolved'
                  }
                  onClick={() => handleUpdateStatus('Rejected')}
                >
                  <XCircle size={16} />
                  Reject (Invalid)
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

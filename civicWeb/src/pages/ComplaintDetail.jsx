/**
 * ComplaintDetail.jsx — Full detail view + action panel for a single complaint.
 */
import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import {
  Card, CardHeader, CardTitle, CardContent, Button, Badge, cn
} from '../components/ui.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import {
  ArrowLeft, CheckCircle, Clock, XCircle, AlertCircle,
  MapPin, User, Mail, Phone, ExternalLink, ThumbsUp, Activity
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
    const previousStatus = complaint.status
    // Optimistic Update
    setComplaint(prev => ({ ...prev, status: newStatus }))
    setUpdating(true)
    const toastId = toast.loading(`Updating status to "${newStatus}"…`)
    
    try {
      await api.patch(`/complaints/${complaintId}/status`, { status: newStatus })
      toast.dismiss(toastId)
      toast.success(`Status updated to "${newStatus}"`)
      // Not strictly necessary to fetch again, but keeps data 100% synced
      await fetchComplaint()
    } catch (error) {
      // Revert on failure
      setComplaint(prev => ({ ...prev, status: previousStatus }))
      toast.dismiss(toastId)
      toast.error(error.message || 'Failed to update status. Please try again.')
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
          <AlertCircle size={48} className="text-error mx-auto" />
          <p className="text-error font-semibold">Complaint not found.</p>
          <Button variant="outline" onClick={() => navigate(-1)}>← Go Back</Button>
        </div>
      </div>
    )
  }

  const canEdit = user && (
    user.role === 'admin' ||
    user.role === 'main_officer' ||
    user.role === 'department_staff'
  )

  const reporter = {
    name:  complaint.userId?.name  || 'Unknown Citizen',
    email: complaint.userId?.email || '—',
    phone: complaint.userId?.phone || '—',
  }

  const coords = complaint.location?.coordinates
  const lat    = coords?.[1]
  const lng    = coords?.[0]
  const gmapsUrl = lat && lng
    ? `https://maps.google.com/maps?q=${lat},${lng}&z=16`
    : null

  // Timeline Step Logic
  // Timeline Step Logic
  const hasStatusInHistory = (statuses) => {
    return complaint.statusHistory?.some(h => statuses.includes(h.status)) || false;
  };

  const timelineSteps = [
    { label: 'Created', active: true, icon: <CheckCircle size={16} /> },
    { label: 'AI Analyzed', active: complaint.urgencyClassification === 'done', icon: <Activity size={16} /> },
    { label: 'Acknowledged', active: hasStatusInHistory(['In Progress', 'Resolved', 'Rejected']), icon: <Clock size={16} /> },
    { label: 'Resolved', active: hasStatusInHistory(['Resolved', 'Rejected']), icon: <CheckCircle size={16} /> }
  ];

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <Button variant="outline" onClick={() => navigate(-1)} className="gap-2 bg-surface text-on-surface hover:bg-surface-container border-outline-variant">
        <ArrowLeft size={16} /> Back
      </Button>

      <Card>
        <CardHeader className="bg-surface-container-lowest border-b border-outline-variant">
          <div className="flex justify-between items-start flex-wrap gap-3">
            <div>
              <CardTitle className="text-headline-sm font-headline-sm text-primary">
                {complaint.category} Issue
                <span className="text-on-surface-variant font-body-sm text-body-sm ml-2">
                  — reported {relativeTime(complaint.createdAt)}
                </span>
              </CardTitle>
              <div className="text-xs text-on-surface-variant mt-1 font-mono">
                ID: {complaint._id}
              </div>
              <div className="text-xs text-on-surface-variant mt-0.5">
                {shortDateTime(complaint.createdAt)}
              </div>
            </div>
            <Badge variant={statusVariant(complaint.status)} className="text-sm px-3 py-1 uppercase tracking-wider">
              {complaint.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-8">
          
          {/* ── End-to-End Audit Timeline ───────────────── */}
          <div className="w-full bg-surface-container-low border border-outline-variant rounded p-4">
            <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-4">Audit Timeline</h4>
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-outline-variant -z-10 -translate-y-1/2"></div>
              {timelineSteps.map((step, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 bg-surface-container-low px-2 z-10">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors", step.active ? "bg-primary text-on-primary" : "bg-surface-container-high text-outline")}>
                    {step.icon}
                  </div>
                  <span className={cn("text-xs font-label-sm", step.active ? "text-primary font-bold" : "text-outline")}>{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Audit Log Trail ───────────────── */}
          {complaint.statusHistory && complaint.statusHistory.length > 0 && (
            <div className="w-full bg-surface-container-low border border-outline-variant rounded p-4">
              <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Audit Log Trail</h4>
              <div className="space-y-3">
                {complaint.statusHistory.map((h, idx) => (
                  <div key={idx} className="flex justify-between items-start text-sm border-b border-outline-variant pb-2 last:border-b-0 last:pb-0">
                    <div>
                      <span className="font-semibold text-primary mr-2">[{h.status}]</span>
                      <span className="text-on-surface text-xs">{h.note}</span>
                    </div>
                    <div className="text-right text-xs text-on-surface-variant">
                      <div>By: {h.changedBy?.name || 'Reporter'} ({h.changedBy?.role || 'Citizen'})</div>
                      <div className="mt-0.5">{shortDateTime(h.changedAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                  Citizen Description
                </h4>
                <div className="bg-surface p-4 rounded border border-outline-variant text-on-surface leading-relaxed whitespace-pre-wrap text-sm">
                  {complaint.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface p-3 rounded border border-outline-variant">
                  <div className="text-xs text-on-surface-variant uppercase mb-1">AI Urgency</div>
                  <Badge variant={urgencyVariant(complaint.urgency)} className="text-sm px-2 py-0.5">
                    {complaint.urgency}
                  </Badge>
                </div>
                <div className="bg-surface p-3 rounded border border-outline-variant">
                  <div className="text-xs text-on-surface-variant uppercase mb-1 flex items-center gap-1">
                    <ThumbsUp size={11} /> Community Upvotes
                  </div>
                  <div className="font-bold text-xl text-primary">{complaint.upvotes ?? 0}</div>
                </div>
              </div>

              <div className="bg-surface p-3 rounded border border-outline-variant">
                <div className="text-xs text-on-surface-variant uppercase mb-2 flex items-center gap-1">
                  <MapPin size={11} /> Location Coordinates
                </div>
                {lat && lng ? (
                  <div className="space-y-1">
                    <div className="font-mono text-sm text-on-surface">
                      Lat: {lat.toFixed(6)} &nbsp; Lng: {lng.toFixed(6)}
                    </div>
                    {gmapsUrl && (
                      <a
                        href={gmapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        Open in Google Maps <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-on-surface-variant">No location data</span>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                  Evidence Photo
                </h4>
                {complaint.imageUrl ? (
                  <a
                    href={complaint.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded overflow-hidden border border-outline-variant shadow-sm h-[220px] bg-surface-container group relative"
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
                  <div className="rounded border border-dashed border-outline h-[220px] flex flex-col items-center justify-center text-outline bg-surface">
                    <AlertCircle size={28} className="mb-2 opacity-30" />
                    <span className="text-sm font-body-sm text-body-sm">No photo provided</span>
                  </div>
                )}
              </div>

              <div className="bg-surface p-4 rounded border border-outline-variant space-y-3">
                <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Reporter Details
                </h4>
                <div className="space-y-2 text-on-surface">
                  <div className="flex items-center gap-2 text-sm">
                    <User size={14} className="text-on-surface-variant flex-shrink-0" />
                    <span className="font-medium">{reporter.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={14} className="text-on-surface-variant flex-shrink-0" />
                    {reporter.email !== '—' ? (
                      <a href={`mailto:${reporter.email}`} className="text-primary hover:underline">
                        {reporter.email}
                      </a>
                    ) : (
                      <span className="text-on-surface-variant">—</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={14} className="text-on-surface-variant flex-shrink-0" />
                    {reporter.phone !== '—' ? (
                      <a href={`tel:${reporter.phone}`} className="text-primary hover:underline">
                        {reporter.phone}
                      </a>
                    ) : (
                      <span className="text-on-surface-variant">—</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {canEdit && (
            <div className="pt-6 border-t border-outline-variant mt-8">
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-4 text-on-surface-variant">
                Official Actions
              </h4>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  className="gap-2"
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
                  className="gap-2"
                  disabled={updating || complaint.status === 'Resolved'}
                  onClick={() => handleUpdateStatus('Resolved')}
                >
                  <CheckCircle size={16} />
                  Mark as Resolved
                </Button>

                <Button
                  variant="outline"
                  className="gap-2 border-error text-error hover:bg-error-container ml-auto"
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

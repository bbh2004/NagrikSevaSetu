/**
 * ComplaintDetail.jsx — Full detail view + action panel for a single complaint.
 *
 * UI improvements:
 *  - Proper loading skeleton instead of emoji spinner
 *  - Polished audit timeline with step indicators
 *  - Status action buttons with confirmation hints
 *  - Consistent card/badge design from admin portal
 *  - Proper error handling with retry option
 */
import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import {
  Card, CardHeader, CardTitle, CardContent, Button, Badge, Alert, cn
} from '../components/ui.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import {
  ArrowLeft, CheckCircle, Clock, XCircle, AlertCircle,
  MapPin, User, Mail, Phone, ExternalLink, ThumbsUp, Activity,
  RefreshCw, Flame
} from 'lucide-react'
import { CATEGORIES } from '../constants/civic.js'
import { shortDateTime, relativeTime } from '../utils/formatDate.js'
import { toast } from '../utils/toast.js'

// ── Skeleton loader ─────────────────────────────────────────────
function DetailSkeleton() {
  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="skeleton h-9 w-24 rounded-xl" />
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <div className="skeleton h-6 w-64 rounded-lg" />
              <div className="skeleton h-4 w-48 rounded" />
              <div className="skeleton h-3 w-32 rounded" />
            </div>
            <div className="skeleton h-7 w-24 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="skeleton h-16 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="skeleton h-32 w-full rounded-xl" />
              <div className="skeleton h-20 w-full rounded-xl" />
            </div>
            <div className="space-y-4">
              <div className="skeleton h-44 w-full rounded-xl" />
              <div className="skeleton h-24 w-full rounded-xl" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Status badge ────────────────────────────────────────────────
function StatusBadge({ status }) {
  const variant =
    status === 'Resolved'    ? 'success'  :
    status === 'Rejected'    ? 'default'  :
    status === 'In Progress' ? 'warning'  : 'danger'
  return <Badge variant={variant}>{status}</Badge>
}

// ── Timeline Step ───────────────────────────────────────────────
function TimelineStep({ label, active, icon }) {
  return (
    <div className="flex flex-col items-center gap-2 relative z-10">
      <div
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all",
          active
            ? "bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-200"
            : "bg-white border-gray-200 text-gray-300"
        )}
      >
        {icon}
      </div>
      <span
        className={cn(
          "text-[11px] font-semibold whitespace-nowrap",
          active ? "text-indigo-700" : "text-gray-400"
        )}
      >
        {label}
      </span>
    </div>
  )
}

// ── Action Button ───────────────────────────────────────────────
function ActionButton({ label, icon: Icon, onClick, disabled, loading, variant = "outline" }) {
  return (
    <Button
      variant={variant}
      className="gap-2"
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading
        ? <RefreshCw size={15} className="animate-spin" />
        : Icon && <Icon size={15} />
      }
      {label}
    </Button>
  )
}

// ══════════════════════════════════════════════════════════════════
// ComplaintDetail
// ══════════════════════════════════════════════════════════════════
export default function ComplaintDetail() {
  const { complaintId } = useParams()
  const [complaint, setComplaint] = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [updating,  setUpdating]  = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const navigate  = useNavigate()
  const { user }  = useAuth()

  const fetchComplaint = useCallback(async () => {
    try {
      setLoading(true)
      setFetchError(null)
      const data = await api.get(`/complaints/${complaintId}`)
      setComplaint(data)
    } catch (error) {
      console.error('[ComplaintDetail] fetchComplaint failed:', error)
      const msg = error.message || 'Could not load complaint details.'
      setFetchError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [complaintId])

  useEffect(() => {
    fetchComplaint()
  }, [fetchComplaint])

  const handleUpdateStatus = async (newStatus) => {
    const previousStatus = complaint.status
    setComplaint(prev => ({ ...prev, status: newStatus }))
    setUpdating(true)
    const toastId = toast.loading(`Updating status to "${newStatus}"…`)

    try {
      await api.patch(`/complaints/${complaintId}/status`, { status: newStatus })
      toast.dismiss(toastId)
      toast.success(`Status updated to "${newStatus}"`)
      await fetchComplaint()
    } catch (error) {
      setComplaint(prev => ({ ...prev, status: previousStatus }))
      toast.dismiss(toastId)
      toast.error(error.message || 'Failed to update status. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  // ── Loading state ─────────────────────────────────────────────
  if (loading) return <DetailSkeleton />

  // ── Error state ───────────────────────────────────────────────
  if (fetchError) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <Button variant="outline" onClick={() => navigate(-1)} size="sm">
          <ArrowLeft size={15} /> Back
        </Button>
        <Alert
          variant="error"
          title="Could not load complaint"
          action={
            <button onClick={fetchComplaint} className="text-xs font-semibold underline">
              Retry
            </button>
          }
        >
          {fetchError}
        </Alert>
      </div>
    )
  }

  // ── Not found ─────────────────────────────────────────────────
  if (!complaint) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <Button variant="outline" onClick={() => navigate(-1)} size="sm">
          <ArrowLeft size={15} /> Back
        </Button>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <AlertCircle size={48} className="text-gray-200 mx-auto" />
            <p className="text-gray-500 font-semibold">Complaint not found</p>
            <p className="text-sm text-gray-400">The complaint may have been removed or the ID is invalid.</p>
            <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
          </div>
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
    email: complaint.userId?.email || null,
    phone: complaint.userId?.phone || null,
  }

  const coords   = complaint.location?.coordinates
  const lat      = coords?.[1]
  const lng      = coords?.[0]
  const gmapsUrl = lat && lng
    ? `https://maps.google.com/maps?q=${lat},${lng}&z=16`
    : null

  const hasStatusInHistory = (statuses) =>
    complaint.statusHistory?.some(h => statuses.includes(h.status)) || false

  const timelineSteps = [
    { label: 'Created',      active: true,                                                                      icon: <CheckCircle size={16} /> },
    { label: 'AI Analyzed',  active: complaint.urgencyClassification === 'done',                               icon: <Activity size={16} />     },
    { label: 'Acknowledged', active: hasStatusInHistory(['In Progress', 'Resolved', 'Rejected']),              icon: <Clock size={16} />        },
    { label: 'Resolved',     active: hasStatusInHistory(['Resolved', 'Rejected']),                             icon: <CheckCircle size={16} />  },
  ]

  const isResolved = complaint.status === 'Resolved' || complaint.status === 'Rejected'

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-8">

      {/* Back button */}
      <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft size={15} /> Back
      </Button>

      <Card className="animate-fade-in">
        {/* ── Header ────────────────────────────────────────────── */}
        <CardHeader>
          <div className="flex justify-between items-start flex-wrap gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle>{complaint.category} Issue</CardTitle>
                <StatusBadge status={complaint.status} />
                {complaint.urgency === 'High' && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                    <Flame size={10} /> High Urgency
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                <span className="text-xs text-gray-400">
                  Reported {relativeTime(complaint.createdAt)} · {shortDateTime(complaint.createdAt)}
                </span>
                <span className="text-xs text-gray-300 font-mono hidden sm:inline">
                  ID: {complaint._id}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-6">

          {/* ── Audit Timeline ─────────────────────────────────── */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
            <p className="text-caption text-gray-400 mb-4">Audit Timeline</p>
            <div className="relative flex items-start justify-between">
              {/* Connector line */}
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 z-0" />
              {timelineSteps.map((step, idx) => (
                <TimelineStep key={idx} {...step} />
              ))}
            </div>
          </div>

          {/* ── Audit Log Trail ─────────────────────────────────── */}
          {complaint.statusHistory && complaint.statusHistory.length > 0 && (
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
              <p className="text-caption text-gray-400 mb-3">Change History</p>
              <div className="space-y-2.5">
                {complaint.statusHistory.map((h, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-start gap-4 pb-2.5 border-b border-gray-100 last:border-b-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <span className={cn(
                        "inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full mr-2",
                        h.status === 'Resolved'    ? 'bg-emerald-100 text-emerald-700' :
                        h.status === 'Rejected'    ? 'bg-gray-100 text-gray-600'      :
                        h.status === 'In Progress' ? 'bg-amber-100 text-amber-700'    :
                        'bg-red-100 text-red-700'
                      )}>
                        {h.status}
                      </span>
                      <span className="text-sm text-gray-600">{h.note}</span>
                    </div>
                    <div className="text-right text-xs text-gray-400 flex-shrink-0">
                      <div className="font-medium">{h.changedBy?.name || 'Reporter'}</div>
                      <div className="text-gray-300 mt-0.5">{shortDateTime(h.changedAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Content Grid ────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Left column */}
            <div className="space-y-4">

              {/* Description */}
              <div>
                <p className="text-caption text-gray-400 mb-2">Citizen Description</p>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap min-h-[80px]">
                  {complaint.description ? (
                    complaint.description
                  ) : complaint.voiceNoteTranscript ? (
                    <>
                      <div className="flex items-center gap-2 mb-2 text-indigo-600">
                        <Activity size={13} />
                        <span className="text-caption">AI Voice Transcript</span>
                      </div>
                      <span className="italic text-gray-600">"{complaint.voiceNoteTranscript}"</span>
                    </>
                  ) : (
                    <span className="text-gray-400 italic">No description provided.</span>
                  )}

                  {complaint.voiceNoteUrl && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <p className="text-caption text-gray-400 mb-2">Original Audio</p>
                      <audio controls src={complaint.voiceNoteUrl} className="w-full h-8" />
                    </div>
                  )}
                </div>
              </div>

              {/* Urgency + Upvotes */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                  <p className="text-caption text-gray-400 mb-1.5">AI Urgency</p>
                  <Badge
                    variant={
                      complaint.urgency === 'High'   ? 'danger'  :
                      complaint.urgency === 'Medium' ? 'warning' : 'success'
                    }
                    className="text-sm"
                  >
                    {complaint.urgency}
                  </Badge>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                  <div className="flex items-center gap-1 text-caption text-gray-400 mb-1.5">
                    <ThumbsUp size={10} />
                    Upvotes
                  </div>
                  <p className="text-2xl font-bold text-indigo-600">{complaint.upvotes ?? 0}</p>
                </div>
              </div>

              {/* Location */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-caption text-gray-400 mb-2">
                  <MapPin size={10} />
                  Location Coordinates
                </div>
                {lat && lng ? (
                  <div className="space-y-1.5">
                    <p className="font-mono text-sm text-gray-700">
                      {lat.toFixed(6)}, {lng.toFixed(6)}
                    </p>
                    {gmapsUrl && (
                      <a
                        href={gmapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                      >
                        Open in Google Maps <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No location data available</p>
                )}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">

              {/* Evidence Photo */}
              <div>
                <p className="text-caption text-gray-400 mb-2">Evidence Photo</p>
                {complaint.imageUrl ? (
                  <a
                    href={complaint.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl overflow-hidden border border-gray-100 h-[200px] bg-gray-50 group relative"
                    title="Click to open full-size image"
                  >
                    <img
                      src={complaint.imageUrl}
                      alt="Evidence"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e => { e.target.style.display = 'none' }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition flex items-end justify-end p-2 rounded-xl">
                      <ExternalLink size={16} className="text-white opacity-0 group-hover:opacity-100 transition drop-shadow" />
                    </div>
                  </a>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-gray-200 h-[200px] flex flex-col items-center justify-center text-gray-300 bg-gray-50">
                    <AlertCircle size={28} className="mb-2 opacity-40" />
                    <span className="text-sm text-gray-400">No photo provided</span>
                  </div>
                )}
              </div>

              {/* Reporter Details */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <p className="text-caption text-gray-400 mb-3">Reporter Details</p>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-sm">
                    <User size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="font-semibold text-gray-800">{reporter.name}</span>
                  </div>
                  {reporter.email ? (
                    <div className="flex items-center gap-2.5 text-sm">
                      <Mail size={14} className="text-gray-400 flex-shrink-0" />
                      <a href={`mailto:${reporter.email}`} className="text-indigo-600 hover:underline truncate">
                        {reporter.email}
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 text-sm">
                      <Mail size={14} className="text-gray-300 flex-shrink-0" />
                      <span className="text-gray-300">—</span>
                    </div>
                  )}
                  {reporter.phone ? (
                    <div className="flex items-center gap-2.5 text-sm">
                      <Phone size={14} className="text-gray-400 flex-shrink-0" />
                      <a href={`tel:${reporter.phone}`} className="text-indigo-600 hover:underline">
                        {reporter.phone}
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 text-sm">
                      <Phone size={14} className="text-gray-300 flex-shrink-0" />
                      <span className="text-gray-300">—</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Official Actions ────────────────────────────────── */}
          {canEdit && (
            <div className="pt-5 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-caption text-gray-400">Official Actions</p>
                {isResolved && (
                  <span className="text-xs text-gray-400 italic">
                    This complaint is already {complaint.status.toLowerCase()}.
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <ActionButton
                  label="Mark In Progress"
                  icon={Clock}
                  disabled={complaint.status === 'In Progress' || isResolved}
                  loading={updating}
                  onClick={() => handleUpdateStatus('In Progress')}
                  variant="outline"
                />
                <ActionButton
                  label="Mark Resolved"
                  icon={CheckCircle}
                  disabled={isResolved}
                  loading={updating}
                  onClick={() => handleUpdateStatus('Resolved')}
                  variant="success"
                />
                <ActionButton
                  label="Reject (Invalid)"
                  icon={XCircle}
                  disabled={isResolved}
                  loading={updating}
                  onClick={() => handleUpdateStatus('Rejected')}
                  variant="danger-outline"
                />
              </div>
              {updating && (
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
                  <RefreshCw size={11} className="animate-spin" />
                  Updating status…
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

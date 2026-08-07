/**
 * DepartmentDashboard.jsx — Complaint management view for department officers.
 *
 * UI matches Admin portal aesthetic:
 *  - KPI summary bar (active count, resolved count, high-urgency count)
 *  - Action Required table with colored urgency/status badges
 *  - Resolved Log with proper empty states
 *  - Consistent pagination controls
 *  - Proper loading skeletons and error states
 */
import { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../services/api'
import {
  Card, CardHeader, CardTitle, CardContent,
  Table, THead, TBody, TR, TH, TD, Badge, Button,
  StatCard, Alert, EmptyState, PageHeader, Spinner,
} from '../components/ui.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import {
  RefreshCw, ChevronLeft, ChevronRight, AlertTriangle,
  CheckCircle, Flame, Clock, ClipboardList, ArrowRight,
} from 'lucide-react'
import { CATEGORY_META } from '../constants/civic.js'
import { shortDateTime, relativeTime } from '../utils/formatDate.js'
import { toast } from '../utils/toast.js'

const PAGE_SIZE = 20
const URGENCY_ORDER = { High: 0, Medium: 1, Low: 2 }

// ── Urgency badge helper ────────────────────────────────────────
function UrgencyBadge({ urgency }) {
  const variant =
    urgency === 'High'   ? 'danger'  :
    urgency === 'Medium' ? 'warning' : 'success'
  return <Badge variant={variant}>{urgency}</Badge>
}

// ── Status badge helper ─────────────────────────────────────────
function StatusBadge({ status }) {
  const variant =
    status === 'Resolved'    ? 'success'  :
    status === 'Rejected'    ? 'default'  :
    status === 'In Progress' ? 'warning'  : 'danger'
  return <Badge variant={variant}>{status}</Badge>
}

// ── Skeleton row ────────────────────────────────────────────────
const SkeletonRow = ({ cols = 6 }) => (
  <TR>
    {Array.from({ length: cols }).map((_, i) => (
      <TD key={i}>
        <div className="skeleton h-4 rounded" style={{ width: `${50 + Math.random() * 40}%` }} />
      </TD>
    ))}
  </TR>
)

// ── Pagination Controls ─────────────────────────────────────────
function PaginationControls({ page, setPage, totalPages, loading }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
      <span className="text-xs text-gray-400 font-medium">
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page <= 1 || loading}
        >
          <ChevronLeft size={13} /> Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages || loading}
        >
          Next <ChevronRight size={13} />
        </Button>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// DepartmentDashboard
// ══════════════════════════════════════════════════════════════════
export default function DepartmentDashboard() {
  const { deptId } = useParams()
  const { user }   = useAuth()

  const [activeComplaints,   setActiveComplaints]   = useState([])
  const [resolvedComplaints, setResolvedComplaints] = useState([])
  const [activePagination,   setActivePagination]   = useState({ total: 0, totalPages: 1 })
  const [resolvedPagination, setResolvedPagination] = useState({ total: 0, totalPages: 1 })
  const [activePage,         setActivePage]         = useState(1)
  const [resolvedPage,       setResolvedPage]       = useState(1)
  const [loading,            setLoading]            = useState(true)
  const [error,              setError]              = useState(null)

  /**
   * For department_staff, always use their own deptCategory.
   * For admin/main_officer, use the deptId URL param.
   */
  const targetDept = useMemo(() => {
    if (user?.role === 'department_staff' && user?.deptCategory) return user.deptCategory
    return deptId
  }, [user, deptId])

  const fetchComplaints = useCallback(async () => {
    if (!targetDept) return
    try {
      setLoading(true)
      setError(null)
      const [activeRes, resolvedRes] = await Promise.all([
        api.get(`/complaints?category=${encodeURIComponent(targetDept)}&status=Pending,In Progress&page=${activePage}&limit=${PAGE_SIZE}&sortBy=createdAt`),
        api.get(`/complaints?category=${encodeURIComponent(targetDept)}&status=Resolved&page=${resolvedPage}&limit=${PAGE_SIZE}`),
      ])

      const allActive    = Array.isArray(activeRes)   ? activeRes   : (activeRes?.data   || [])
      const resolvedData = Array.isArray(resolvedRes) ? resolvedRes : (resolvedRes?.data || [])

      const activeData = allActive
        .filter(c => c.status === 'Pending' || c.status === 'In Progress')
        .sort((a, b) => {
          const urgencyDiff = (URGENCY_ORDER[a.urgency] ?? 2) - (URGENCY_ORDER[b.urgency] ?? 2)
          if (urgencyDiff !== 0) return urgencyDiff
          return new Date(b.createdAt) - new Date(a.createdAt)
        })

      setActiveComplaints(activeData)
      setResolvedComplaints(resolvedData)

      if (activeRes?.pagination)   setActivePagination(activeRes.pagination)
      if (resolvedRes?.pagination) setResolvedPagination(resolvedRes.pagination)
    } catch (err) {
      console.error('[DepartmentDashboard] fetchComplaints failed:', err)
      const msg = err.message || 'Failed to load complaints.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [targetDept, activePage, resolvedPage])

  useEffect(() => {
    fetchComplaints()
    const interval = setInterval(fetchComplaints, 60_000)
    return () => clearInterval(interval)
  }, [fetchComplaints])

  const deptMeta = CATEGORY_META[targetDept] || {}
  const title    = targetDept ? `${targetDept} Department` : 'Department Dashboard'
  const highUrgencyCount = activeComplaints.filter(c => c.urgency === 'High').length

  return (
    <div className="space-y-5 pb-8">

      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            {deptMeta.icon && (
              <span className="text-2xl" aria-hidden="true">{deptMeta.icon}</span>
            )}
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          </div>
          <p className="text-sm text-gray-400">
            Manage and resolve complaints for this department
            {!loading && ` · ${activePagination.total} active, ${resolvedPagination.total} resolved`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchComplaints}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Loading…' : 'Refresh'}
        </Button>
      </div>

      {/* ── Error state ─────────────────────────────────────────── */}
      {error && !loading && (
        <Alert
          variant="error"
          title="Failed to load complaints"
          action={
            <button
              onClick={fetchComplaints}
              className="text-xs font-semibold underline whitespace-nowrap"
            >
              Retry
            </button>
          }
        >
          {error}
        </Alert>
      )}

      {/* ── High urgency alert ───────────────────────────────────── */}
      {!loading && highUrgencyCount > 0 && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 flex items-center gap-3 animate-fade-in">
          <div className="p-2 bg-red-100 rounded-xl flex-shrink-0">
            <Flame size={16} className="text-red-600" />
          </div>
          <p className="text-sm font-semibold text-red-800 flex-1">
            {highUrgencyCount} High Urgency complaint{highUrgencyCount > 1 ? 's' : ''} require immediate attention
          </p>
        </div>
      )}

      {/* ── KPI Summary ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard
          label="Active Complaints"
          value={loading ? null : activePagination.total || activeComplaints.length}
          icon={Clock}
          accent="text-amber-500"
          sub="Pending + In Progress"
          loading={loading}
        />
        <StatCard
          label="High Urgency"
          value={loading ? null : highUrgencyCount}
          icon={AlertTriangle}
          accent="text-red-500"
          sub="Require immediate action"
          loading={loading}
        />
        <StatCard
          label="Resolved"
          value={loading ? null : resolvedPagination.total || resolvedComplaints.length}
          icon={CheckCircle}
          accent="text-emerald-600"
          sub="Total resolved"
          loading={loading}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* ── Active Complaints Table ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Flame size={16} className="text-amber-500" />
                Action Required
              </CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">Pending &amp; In Progress — sorted by urgency</p>
            </div>
            {!loading && (
              <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
                {activePagination.total || activeComplaints.length} active
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH className="pl-5">Date</TH>
                <TH>Description</TH>
                <TH>Urgency</TH>
                <TH>Status</TH>
                <TH>Upvotes</TH>
                <TH className="pr-5">Action</TH>
              </TR>
            </THead>
            <TBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              ) : activeComplaints.length === 0 ? (
                <TR>
                  <TD colSpan={6}>
                    <EmptyState
                      icon={CheckCircle}
                      title="No active complaints"
                      message="All clear! No pending or in-progress complaints for this department."
                    />
                  </TD>
                </TR>
              ) : activeComplaints.map(c => (
                <TR key={c._id} clickable>
                  <TD className="pl-5 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-800">{shortDateTime(c.createdAt)}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{relativeTime(c.createdAt)}</div>
                  </TD>
                  <TD className="max-w-[220px]">
                    <p className="text-sm text-gray-700 truncate" title={c.description || '(no description)'}>
                      {c.description || (c.voiceNoteUrl
                        ? <span className="italic text-indigo-400 text-xs">🎙 Voice note</span>
                        : <span className="text-gray-300 italic text-xs">No description</span>
                      )}
                    </p>
                  </TD>
                  <TD><UrgencyBadge urgency={c.urgency} /></TD>
                  <TD><StatusBadge status={c.status} /></TD>
                  <TD>
                    <span className="text-sm font-semibold text-gray-700">
                      {c.upvotes ?? 0}
                    </span>
                    {c.upvotes >= 5 && <span className="ml-1 text-orange-500 text-xs">🔥</span>}
                  </TD>
                  <TD className="pr-5">
                    <Link
                      to={`/complaints/${c._id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Review <ArrowRight size={11} />
                    </Link>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <div className="px-5">
            <PaginationControls
              page={activePage}
              setPage={setActivePage}
              totalPages={activePagination.totalPages}
              loading={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Resolved Log ────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-gray-500">
                <ClipboardList size={16} className="text-gray-400" />
                Resolved Log
              </CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">Completed complaints archive</p>
            </div>
            {!loading && resolvedPagination.total > 0 && (
              <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
                {resolvedPagination.total} resolved
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH className="pl-5">Date Resolved</TH>
                <TH>Description</TH>
                <TH>Urgency</TH>
                <TH>Upvotes</TH>
                <TH className="pr-5">Action</TH>
              </TR>
            </THead>
            <TBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
              ) : resolvedComplaints.length === 0 ? (
                <TR>
                  <TD colSpan={5}>
                    <EmptyState
                      icon={ClipboardList}
                      title="No resolved complaints yet"
                      message="Resolved complaints will appear here."
                    />
                  </TD>
                </TR>
              ) : resolvedComplaints.map(c => (
                <TR key={c._id} className="opacity-80">
                  <TD className="pl-5 whitespace-nowrap">
                    <div className="text-sm text-gray-700">{shortDateTime(c.createdAt)}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{relativeTime(c.createdAt)}</div>
                  </TD>
                  <TD className="max-w-[220px]">
                    <p className="text-sm text-gray-600 truncate" title={c.description || '(no description)'}>
                      {c.description || (c.voiceNoteUrl
                        ? <span className="italic text-indigo-400 text-xs">🎙 Voice note</span>
                        : <span className="text-gray-300 italic text-xs">—</span>
                      )}
                    </p>
                  </TD>
                  <TD><UrgencyBadge urgency={c.urgency} /></TD>
                  <TD>
                    <span className="text-sm text-gray-600">{c.upvotes ?? 0}</span>
                  </TD>
                  <TD className="pr-5">
                    <Link
                      to={`/complaints/${c._id}`}
                      className="text-xs font-medium text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                    >
                      View <ArrowRight size={11} />
                    </Link>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <div className="px-5">
            <PaginationControls
              page={resolvedPage}
              setPage={setResolvedPage}
              totalPages={resolvedPagination.totalPages}
              loading={loading}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

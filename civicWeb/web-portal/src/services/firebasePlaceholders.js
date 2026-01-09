

// Firebase service layer (Firestore + Auth). Replaces previous placeholders.
import { db } from './firebase.js'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fsLimit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where
} from 'firebase/firestore'

// Departments aligned to schema categories
const DEPARTMENTS = [
  { id: 'Electrical', name: 'Electrical' },
  { id: 'Road', name: 'Road' },
  { id: 'Sanitation', name: 'Sanitation' },
  { id: 'Water', name: 'Water' },
  { id: 'Other', name: 'Other' },
]

// Static credentials mapping - loaded from environment variables
const CREDENTIALS = {
  [import.meta.env.VITE_ELEC_USERNAME]: { password: import.meta.env.VITE_ELEC_PASSWORD, role: 'department_staff', category: 'Electrical' },
  [import.meta.env.VITE_ROAD_USERNAME]: { password: import.meta.env.VITE_ROAD_PASSWORD, role: 'department_staff', category: 'Road' },
  [import.meta.env.VITE_SANITATION_USERNAME]: { password: import.meta.env.VITE_SANITATION_PASSWORD, role: 'department_staff', category: 'Sanitation' },
  [import.meta.env.VITE_WATER_USERNAME]: { password: import.meta.env.VITE_WATER_PASSWORD, role: 'department_staff', category: 'Water' },
  [import.meta.env.VITE_ADMIN_USERNAME]: { password: import.meta.env.VITE_ADMIN_PASSWORD, role: 'admin', category: 'Other' },
}

// Firestore helpers to map complaint documents to UI-friendly shape
function mapComplaintDoc(id, data) {
  const location = data.location || {}
  return {
    id,
    name: data.title || data.name || data.description?.slice(0, 28) || 'Complaint',
    description: data.description ?? '',
    deptId: data.category || data.deptId || 'Other',
    status: data.status || 'Open',
    urgency: data.urgency || 'Medium',
    upvotes: data.upvotes || 0,
    photoUrl: data.imageUrl || data.photoUrl || '',
    createdAt: typeof data.createdAt === 'string' ? Date.parse(data.createdAt) : (data.createdAt?.toMillis?.() ?? Date.now()),
    location: { lat: location.lat ?? 0, lng: location.lng ?? 0 },
  }
}

export async function fetchStats() {
  const snap = await getDocs(collection(db, 'complaints'))
  let total = 0, open = 0, resolved = 0
  snap.forEach(docSnap => {
    total += 1
    const s = docSnap.data().status
    if (s === 'Resolved') resolved += 1
    else open += 1
  })
  return { total, open, resolved }
}

export async function fetchRecentComplaints(limitCount = 5) {
  const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'), fsLimit(limitCount))
  const snap = await getDocs(q)
  return snap.docs.map(d => mapComplaintDoc(d.id, d.data()))
}

export async function fetchAllComplaints() {
  const snap = await getDocs(query(collection(db, 'complaints'), orderBy('createdAt', 'desc')))
  return snap.docs.map(d => mapComplaintDoc(d.id, d.data()))
}

// Subscribe to complaints in real time
export function subscribeComplaints(callback) {
  const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'))
  const unsub = onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => mapComplaintDoc(d.id, d.data()))
    callback(list)
  })
  return unsub
}

export async function fetchComplaintsByDepartment(deptCategory) {
  const q = query(collection(db, 'complaints'), where('category', '==', deptCategory))
  const snap = await getDocs(q)
  return snap.docs.map(d => mapComplaintDoc(d.id, d.data()))
}

export function subscribeComplaintsByDepartment(deptCategory, callback) {
  const q = query(collection(db, 'complaints'), where('category', '==', deptCategory), orderBy('createdAt', 'desc'))
  const unsub = onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => mapComplaintDoc(d.id, d.data()))
    callback(list)
  })
  return unsub
}

export async function fetchComplaintById(id) {
  const ref = doc(db, 'complaints', id)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return mapComplaintDoc(snap.id, snap.data())
}

export async function markComplaintResolved(id) {
  const ref = doc(db, 'complaints', id)
  await updateDoc(ref, { status: 'Resolved' })
  // copy to separate resolved collection for archival/view
  try {
    const snap = await getDoc(ref)
    if (snap.exists()) {
      await updateDoc(doc(db, 'resolved_complaints', id), snap.data())
    }
  } catch { /* ignore if rules block */ }
  return true
}

export async function signInAsOfficer({ username, password }) {
  if (!username || !password) throw new Error('Invalid credentials')
  const c = CREDENTIALS[username]
  if (!c || c.password !== password || c.role !== 'admin') throw new Error('Invalid credentials')
  return { uid: 'admin', name: 'Main Officer', role: 'admin', deptCategory: 'Other', username }
}

export async function signInAsDepartment(deptCategory, { username, password }) {
  if (!deptCategory) throw new Error('Department is required')
  if (!username || !password) throw new Error('Invalid credentials')
  const c = CREDENTIALS[username]
  if (!c || c.password !== password) throw new Error('Invalid credentials')
  if (c.role !== 'department_staff' || c.category !== deptCategory) throw new Error('Unauthorized for this department')
  const dept = DEPARTMENTS.find(d => d.id === deptCategory)
  return { uid: `staff-${deptCategory}`, name: `${dept?.name} Staff`, role: 'department_staff', deptCategory, username }
}

export async function signOut() { return true }

export function getDepartments() {
  return DEPARTMENTS
}

export async function fetchDepartments() {
  try {
    const snap = await getDocs(collection(db, 'departments'))
    if (snap.empty) return DEPARTMENTS
    return snap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }))
  } catch {
    return DEPARTMENTS
  }
}

export async function fetchOfficerProfile(uid) {
  try {
    const ref = doc(db, 'officers', uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) return null
    return { id: snap.id, ...(snap.data() || {}) }
  } catch {
    return null
  }
}

export async function fetchAnalyticsData() {
  // Aggregate analytics for dashboards
  const departments = getDepartments()

  // Fetch all complaints once for client-side aggregation
  const allComplaintsSnap = await getDocs(query(collection(db, 'complaints')))
  const allComplaints = allComplaintsSnap.docs.map(d => mapComplaintDoc(d.id, d.data()))

  // Totals
  const totals = allComplaints.reduce((acc, c) => {
    acc.total += 1
    if (c.status === 'Resolved') acc.resolved += 1
    else if (c.status === 'In Progress') acc.inProgress += 1
    else acc.open += 1
    return acc
  }, { total: 0, open: 0, inProgress: 0, resolved: 0 })

  // By Department (Resolved counts)
  const byDeptMap = new Map(departments.map(d => [d.id, { department: d.name, complaints: 0 }]))
  for (const c of allComplaints) {
    if (c.status === 'Resolved') {
      const key = c.deptId || 'Other'
      const prev = byDeptMap.get(key)
      if (prev) prev.complaints += 1
      else byDeptMap.set(key, { department: key, complaints: 1 })
    }
  }
  const byDept = Array.from(byDeptMap.values())

  // By Day for the last 14 days
  const days = 14
  const start = new Date()
  start.setHours(0,0,0,0)
  start.setDate(start.getDate() - (days - 1))
  const fmt = (d) => {
    const y = d.getFullYear()
    const m = `${d.getMonth()+1}`.padStart(2, '0')
    const dd = `${d.getDate()}`.padStart(2, '0')
    return `${y}-${m}-${dd}`
  }
  const byDayMap = new Map()
  for (let i = 0; i < days; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    byDayMap.set(fmt(d), { day: fmt(d), complaints: 0, resolved: 0 })
  }
  for (const c of allComplaints) {
    const d = new Date(c.createdAt)
    d.setHours(0,0,0,0)
    const key = fmt(d)
    const bucket = byDayMap.get(key)
    if (bucket) {
      bucket.complaints += 1
      if (c.status === 'Resolved') bucket.resolved += 1
    }
  }
  const byDay = Array.from(byDayMap.values())

  // Status distribution for Pie
  const byStatus = [
    { name: 'Open', value: totals.open },
    { name: 'In Progress', value: totals.inProgress },
    { name: 'Resolved', value: totals.resolved },
  ]

  return { totals, byDay, byDept, byStatus }
}




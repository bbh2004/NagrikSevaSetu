import { initializeApp } from 'firebase/app'
import { getFirestore, setDoc, doc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyBOwiqvrROo-YqVmL8IzlcQs84IlIXwTvc',
  authDomain: 'civicapp-prod.firebaseapp.com',
  projectId: 'civicapp-prod',
  storageBucket: 'civicapp-prod.firebasestorage.app',
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const departments = [
  { id: 'water', name: 'Water Supply' },
  { id: 'sanitation', name: 'Sanitation' },
  { id: 'roads', name: 'Roads' },
  { id: 'electricity', name: 'Electricity' },
]

async function seed() {
  // Departments
  for (const d of departments) {
    await setDoc(doc(db, 'departments', d.id), { name: d.name })
  }
  // Officers (documents keyed by uid/email for demo)
  const officers = [
    { id: 'officer-main', name: 'Main Officer', role: 'main_officer' },
    { id: 'officer-water-1', name: 'Water Officer', role: 'department_staff', deptId: 'water' },
    { id: 'officer-san-1', name: 'Sanitation Officer', role: 'department_staff', deptId: 'sanitation' },
    { id: 'officer-roads-1', name: 'Roads Officer', role: 'department_staff', deptId: 'roads' },
    { id: 'officer-elec-1', name: 'Electricity Officer', role: 'department_staff', deptId: 'electricity' },
  ]
  for (const o of officers) {
    await setDoc(doc(db, 'officers', o.id), o)
  }
  console.log('Seed complete')
}

seed().catch(err => { console.error(err); process.exit(1) })

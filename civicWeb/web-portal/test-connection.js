import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

// Parse .env manually to extract variables
const envPath = './.env';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const index = trimmed.indexOf('=');
      if (index !== -1) {
        const key = trimmed.substring(0, index).trim();
        const val = trimmed.substring(index + 1).trim();
        process.env[key] = val;
      }
    }
  });
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
};

console.log('Firebase Configuration Loaded:', firebaseConfig);

try {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  console.log('Attempting to fetch complaints from Firestore...');
  const snap = await getDocs(collection(db, 'complaints'));
  console.log(`\n🎉 Connection successful! Found ${snap.size} complaints in 'complaints' collection.`);
  snap.forEach(doc => {
    console.log(` - ID: ${doc.id}, Category: ${doc.data().category}, Status: ${doc.data().status}`);
  });
} catch (error) {
  console.error('\n❌ Firestore Fetch Failed!');
  console.error(error);
}

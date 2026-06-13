require('dotenv').config();
const connectDB = require('./src/config/db');
const initializeFirebaseAdmin = require('./src/config/firebase');
const admin = require('firebase-admin');
const User = require('./src/models/User');

const SEED_USERS = [
  {
    email: 'admin@civic.gov.in',
    password: 'password123',
    name: 'Main Administrative Officer',
    role: 'admin',
    deptCategory: null
  },
  {
    email: 'road@civic.gov.in',
    password: 'password123',
    name: 'Road Department Staff',
    role: 'department_staff',
    deptCategory: 'Road'
  },
  {
    email: 'electrical@civic.gov.in',
    password: 'password123',
    name: 'Electrical Department Staff',
    role: 'department_staff',
    deptCategory: 'Electrical'
  },
  {
    email: 'water@civic.gov.in',
    password: 'password123',
    name: 'Water Department Staff',
    role: 'department_staff',
    deptCategory: 'Water'
  },
  {
    email: 'sanitation@civic.gov.in',
    password: 'password123',
    name: 'Sanitation Department Staff',
    role: 'department_staff',
    deptCategory: 'Sanitation'
  }
];

async function seed() {
  console.log("🌱 Starting Official Accounts Seed...");
  await connectDB();
  initializeFirebaseAdmin();

  for (const u of SEED_USERS) {
    try {
      let firebaseUser;
      try {
        firebaseUser = await admin.auth().getUserByEmail(u.email);
        console.log(`✅ Firebase User already exists: ${u.email}`);
      } catch (err) {
        if (err.code === 'auth/user-not-found') {
          firebaseUser = await admin.auth().createUser({
            email: u.email,
            password: u.password,
            displayName: u.name,
          });
          console.log(`✅ Created Firebase User: ${u.email}`);
        } else {
          throw err;
        }
      }

      const existingMongoUser = await User.findOne({ firebaseUid: firebaseUser.uid });
      if (existingMongoUser) {
        existingMongoUser.role = u.role;
        existingMongoUser.department = u.deptCategory;
        await existingMongoUser.save();
        console.log(`✅ Updated MongoDB User: ${u.email}`);
      } else {
        await User.create({
          firebaseUid: firebaseUser.uid,
          name: u.name,
          email: u.email,
          role: u.role,
          department: u.deptCategory,
        });
        console.log(`✅ Created MongoDB User: ${u.email}`);
      }
    } catch (error) {
      console.error(`❌ Failed to seed user ${u.email}:`, error.message);
    }
  }

  console.log("🎉 Seeding complete. You can now log into the web portal with these emails and password: 'password123'.");
  process.exit(0);
}

seed();

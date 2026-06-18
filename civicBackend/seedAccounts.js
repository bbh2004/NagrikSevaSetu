require('dotenv').config();
const connectDB = require('./src/config/db');
const initializeFirebaseAdmin = require('./src/config/firebase');
const admin = require('firebase-admin');
const User = require('./src/models/User');
const crypto = require('crypto');

const SEED_USERS = [
  {
    email: 'admin@civic.gov.in',
    name: 'Main Administrative Officer',
    role: 'admin',
    deptCategory: null
  },
  {
    email: 'road@civic.gov.in',
    name: 'Road Department Staff',
    role: 'department_staff',
    deptCategory: 'Road'
  },
  {
    email: 'electrical@civic.gov.in',
    name: 'Electrical Department Staff',
    role: 'department_staff',
    deptCategory: 'Electrical'
  },
  {
    email: 'water@civic.gov.in',
    name: 'Water Department Staff',
    role: 'department_staff',
    deptCategory: 'Water'
  },
  {
    email: 'sanitation@civic.gov.in',
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
      const tempPassword = crypto.randomBytes(9).toString('base64url');
      try {
        firebaseUser = await admin.auth().getUserByEmail(u.email);
        // Force update existing user password for security
        await admin.auth().updateUser(firebaseUser.uid, { password: tempPassword });
        console.log(`✅ Firebase User already exists: ${u.email}. Forced password reset: ${tempPassword}`);
      } catch (err) {
        if (err.code === 'auth/user-not-found') {
          firebaseUser = await admin.auth().createUser({
            email: u.email,
            password: tempPassword,
            displayName: u.name,
          });
          console.log(`✅ Created Firebase User: ${u.email} with password: ${tempPassword}`);
        } else {
          throw err;
        }
      }

      const existingMongoUser = await User.findOne({ firebaseUid: firebaseUser.uid });
      if (existingMongoUser) {
        existingMongoUser.role = u.role;
        existingMongoUser.department = u.deptCategory;
        existingMongoUser.mustChangePassword = true; // Force password change flow
        await existingMongoUser.save();
        console.log(`✅ Updated MongoDB User: ${u.email}`);
      } else {
        await User.create({
          firebaseUid: firebaseUser.uid,
          name: u.name,
          email: u.email,
          role: u.role,
          department: u.deptCategory,
          mustChangePassword: true,
        });
        console.log(`✅ Created MongoDB User: ${u.email}`);
      }
    } catch (error) {
      console.error(`❌ Failed to seed user ${u.email}:`, error.message);
    }
  }

  console.log("🎉 Seeding complete. Please securely distribute the generated passwords.");
  process.exit(0);
}

seed();

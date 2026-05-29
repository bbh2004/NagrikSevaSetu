// src/config/db.js
// ─────────────────────────────────────────────────────────────
// MongoDB Connection Manager
//
// Why a separate file?
//   Express doesn't care about databases. Mongoose doesn't care
//   about HTTP. Keeping the DB connection here means main.js
//   stays clean. If you later switch to PostgreSQL, you ONLY
//   change this file.
//
// How it works:
//   mongoose.connect() returns a Promise. We await it in server.js
//   before listening for HTTP traffic. This ensures the server
//   never starts in a broken "DB not connected" state.
// ─────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // These options tell Mongoose to use the new URL parser
      // and the new Server Discovery and Monitoring engine.
      // Without these you get deprecation warnings.
      serverSelectionTimeoutMS: 5000, // Fail fast if Atlas is unreachable
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Exit the process with a failure code.
    // PM2 / Docker will then restart the server automatically.
    process.exit(1);
  }
};

module.exports = connectDB;

// src/server.js
// ─────────────────────────────────────────────────────────────
// Server Entry Point
//
// This file's ONLY job is to:
//   1. Load environment variables from .env
//   2. Connect to MongoDB
//   3. Initialize Firebase Admin
//   4. Initialize Cloudinary
//   5. Start listening on the configured port
//
// It imports the 'app' from app.js which has all the routes.
// This separation means app.js can be imported in tests without
// starting a real server.
// ─────────────────────────────────────────────────────────────

// Load .env variables FIRST, before anything else
require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const initializeFirebaseAdmin = require('./config/firebase');
const { initializeCloudinary } = require('./config/cloudinary');

const PORT = process.env.PORT || 5000;

// ─── Boot Sequence ────────────────────────────────────────────
const startServer = async () => {
  try {
    // Step 1: Connect to MongoDB Atlas
    await connectDB();

    // Step 2: Initialize Firebase Admin SDK
    initializeFirebaseAdmin();

    // Step 3: Initialize Cloudinary
    initializeCloudinary();

    // Step 4: Start the HTTP server
    const server = app.listen(PORT, () => {
      console.log(`\n🚀 civicBackend running in ${process.env.NODE_ENV} mode`);
      console.log(`🌐 Server: http://localhost:${PORT}`);
      console.log(`❤️  Health: http://localhost:${PORT}/health`);
      console.log(`📋 API:    http://localhost:${PORT}/api`);
      console.log('\nAvailable routes:');
      console.log('  POST   /api/users/sync');
      console.log('  GET    /api/users/me');
      console.log('  GET    /api/complaints');
      console.log('  POST   /api/complaints');
      console.log('  GET    /api/complaints/mine');
      console.log('  GET    /api/complaints/stats');
      console.log('  GET    /api/complaints/nearby');
      console.log('  GET    /api/complaints/map');
      console.log('  GET    /api/complaints/:id');
      console.log('  PATCH  /api/complaints/:id/status');
      console.log('  POST   /api/complaints/:id/upvote');
      console.log('  DELETE /api/complaints/:id');
      console.log('  GET    /api/notifications');
      console.log('  PATCH  /api/notifications/:id/read');
      console.log('  PATCH  /api/notifications/read-all');
      console.log('  GET    /api/upload/signature?type=image   (Phase 2.3: image)');
      console.log('  GET    /api/upload/signature?type=audio   (Phase 2.3: voice notes)');
      console.log('\nAI Urgency Engine: Groq llama-3.1-8b-instant');
      console.log('Voice Transcription: Groq whisper-large-v3-turbo');
      console.log('\nPress Ctrl+C to stop.\n');
    });

    // ── Graceful Shutdown ──────────────────────────────────────
    // When the OS sends SIGTERM (e.g., Render shuts down the container),
    // we stop accepting new connections and close existing ones gracefully.
    // This prevents data corruption on in-flight DB writes.
    const shutdown = (signal) => {
      console.log(`\n⚠️  Received ${signal}. Starting graceful shutdown...`);
      server.close(() => {
        console.log('✅ HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

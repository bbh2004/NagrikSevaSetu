// tests/health.test.js
// ─────────────────────────────────────────────────────────────
// Basic Health Check Test
//
// This is your first automated test! Run with: npm test
//
// What is supertest?
//   It lets you make HTTP requests to your Express app in tests
//   WITHOUT starting a real server on a port. It handles all of
//   that internally.
//
// Jest is the test runner. It finds files ending in .test.js
// and runs them automatically.
// ─────────────────────────────────────────────────────────────

// We need to load env vars before importing the app
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/civic_test';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.FIREBASE_CLIENT_EMAIL = 'test@test.com';
process.env.FIREBASE_PRIVATE_KEY = 'test-key';

const request = require('supertest');
const app = require('../src/app');

describe('Health Check', () => {
  it('GET /health should return 200 with success: true', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('running');
  });

  it('GET /unknown-route should return 404', async () => {
    const response = await request(app).get('/totally-unknown-route');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});

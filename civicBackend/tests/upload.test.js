// tests/upload.test.js
// ─────────────────────────────────────────────────────────────
// Integration Tests: Upload Signature Endpoint (Phase 2.3)
//
// What we test:
//   GET /api/upload/signature
//     - Requires auth (401 without token)
//     - Returns correct image signature by default
//     - Returns audio signature when type=audio
//     - Returns correct data shape for both types
//
// Firebase auth middleware is mocked so we don't need
// a real token for these tests.
// ─────────────────────────────────────────────────────────────

'use strict';

// ── Environment setup ─────────────────────────────────────────
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/civic_test';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.FIREBASE_CLIENT_EMAIL = 'test@test.com';
process.env.FIREBASE_PRIVATE_KEY = 'test-key';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = '123456789012345';
process.env.CLOUDINARY_API_SECRET = 'test-cloudinary-secret';
process.env.CLOUDINARY_UPLOAD_PRESET = 'civic_sih2025';

// ── Mock Firebase Admin SDK ───────────────────────────────────
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: { cert: jest.fn() },
  auth: () => ({
    verifyIdToken: jest.fn().mockResolvedValue({
      uid: 'test-firebase-uid',
      email: 'test@example.com',
    }),
  }),
  apps: [],
}));

// ── Mock MongoDB / Mongoose ───────────────────────────────────
jest.mock('mongoose', () => {
  const mockMongoose = jest.requireActual('mongoose');
  return {
    ...mockMongoose,
    connect: jest.fn().mockResolvedValue({}),
  };
});

// ── Mock User model (returned by auth middleware) ─────────────
jest.mock('../src/models/User', () => ({
  findOne: jest.fn().mockResolvedValue({
    _id: '507f1f77bcf86cd799439011',
    firebaseUid: 'test-firebase-uid',
    role: 'citizen',
    department: null,
    mustChangePassword: false,
    name: 'Test User',
    email: 'test@example.com',
  }),
}));

// ── Mock Cloudinary ───────────────────────────────────────────
jest.mock('../src/config/cloudinary', () => ({
  cloudinary: {
    utils: {
      api_sign_request: jest.fn().mockReturnValue('mock-cloudinary-signature-12345'),
    },
    config: jest.fn(),
  },
  initializeCloudinary: jest.fn(),
}));

// ─────────────────────────────────────────────────────────────
const request = require('supertest');
const app = require('../src/app');

describe('Upload Signature Endpoint — GET /api/upload/signature', () => {
  // ── Auth required ─────────────────────────────────────────
  it('returns 401 when no Authorization header is provided', async () => {
    const res = await request(app).get('/api/upload/signature');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // ── Default (image) upload signature ─────────────────────
  it('returns 200 with image signature by default (no type param)', async () => {
    const res = await request(app)
      .get('/api/upload/signature')
      .set('Authorization', 'Bearer fake-valid-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      signature: expect.any(String),
      timestamp: expect.any(Number),
      cloudName: 'test-cloud',
      apiKey: '123456789012345',
      uploadType: 'image',
      resourceType: 'image',
    });
    // Folder should be under civic_complaints
    expect(res.body.data.folder).toContain('civic_complaints');
  });

  // ── Explicit type=image ───────────────────────────────────
  it('returns 200 with image signature when type=image', async () => {
    const res = await request(app)
      .get('/api/upload/signature?type=image')
      .set('Authorization', 'Bearer fake-valid-token');

    expect(res.status).toBe(200);
    expect(res.body.data.uploadType).toBe('image');
    expect(res.body.data.resourceType).toBe('image');
    expect(res.body.data.folder).toContain('civic_complaints');
  });

  // ── Audio upload signature ────────────────────────────────
  it('returns 200 with audio signature when type=audio', async () => {
    const res = await request(app)
      .get('/api/upload/signature?type=audio')
      .set('Authorization', 'Bearer fake-valid-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      signature: expect.any(String),
      timestamp: expect.any(Number),
      cloudName: 'test-cloud',
      apiKey: '123456789012345',
      uploadType: 'audio',
      resourceType: 'video', // Cloudinary uses 'video' for audio
      maxFileSizeBytes: 10485760, // 10 MB
    });
    expect(res.body.data.folder).toContain('civic_voice_notes');
  });

  // ── Signature values are numeric and valid ────────────────
  it('includes a valid timestamp (within a few seconds of now)', async () => {
    const before = Math.floor(Date.now() / 1000) - 2;
    const res = await request(app)
      .get('/api/upload/signature')
      .set('Authorization', 'Bearer fake-valid-token');
    const after = Math.floor(Date.now() / 1000) + 2;

    expect(res.body.data.timestamp).toBeGreaterThanOrEqual(before);
    expect(res.body.data.timestamp).toBeLessThanOrEqual(after);
  });

  // ── Unknown type defaults to image ────────────────────────
  it('defaults to image type for an unrecognized type param', async () => {
    const res = await request(app)
      .get('/api/upload/signature?type=video')
      .set('Authorization', 'Bearer fake-valid-token');

    expect(res.status).toBe(200);
    expect(res.body.data.uploadType).toBe('image'); // Fallback to 'image'
  });
});

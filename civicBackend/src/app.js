// src/app.js
// ─────────────────────────────────────────────────────────────
// Express Application Setup
//
// Why separate app.js from server.js?
//   app.js = the Express application (middleware, routes, etc.)
//   server.js = what STARTS the server (DB connect, port listen)
//
//   This separation is crucial for testing. In tests, you import
//   app.js directly (without starting a real HTTP server) and
//   use 'supertest' to fire test requests at it. Clean.
// ─────────────────────────────────────────────────────────────

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import routes
const userRoutes = require('./routes/userRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Import error handlers
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// Trust reverse proxy for rate limiting (Fix B9)
app.set('trust proxy', 1);

// ─── SECURITY MIDDLEWARE ──────────────────────────────────────

// Helmet: Sets various secure HTTP headers automatically.
// Prevents common attacks like clickjacking, MIME-sniffing, XSS.
app.use(helmet());

// CORS: Cross-Origin Resource Sharing.
// Controls which domains can call our API.
// The Flutter app sends requests from the device's network.
// The React web portal sends requests from the browser.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [/^http:\/\/localhost:\d+$/];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.some((allowedOrigin) => {
        if (allowedOrigin === '*') return true;
        if (allowedOrigin instanceof RegExp) {
          return allowedOrigin.test(origin);
        }
        return allowedOrigin === origin;
      });

      if (isAllowed) return callback(null, true);
      callback(new Error(`CORS: Origin "${origin}" not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Rate Limiting: Prevents DDoS and brute-force attacks.
// Strict limiter for state-changing operations
const submitLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10 }); // 10/hour

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 3000 : 1000, // Very high in development
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});

app.use('/api', limiter); // Apply to /api routes
app.use('/api/complaints', (req, res, next) => {
  if (req.method === 'POST') return submitLimiter(req, res, next);
  next();
});

// ─── STANDARD MIDDLEWARE ──────────────────────────────────────

// Morgan: HTTP request logger. Logs every request in dev mode.
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('tiny'));
}

// Parse incoming JSON request bodies
app.use(express.json({ limit: '10kb' })); // Cap at 10kb to prevent large payload attacks

// Parse URL-encoded bodies (for HTML form submissions)
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── HEALTH CHECK (Public) ────────────────────────────────────
// A simple endpoint for deployment platforms (Render, Railway)
// to verify the server is running. No auth needed.
app.get('/', (req, res) => {
  res.status(200).send('NagrikSevaSetu API is live.');
});

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'NagrikSevaSetu Backend is running ✅',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── API ROUTES ───────────────────────────────────────────────
// All routes are prefixed with /api/ to namespace them cleanly
app.use('/api/users', userRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);

// ─── ERROR HANDLING (must be LAST) ───────────────────────────
// 404 handler for unmatched routes
app.use(notFound);

// Global error handler for all errors passed via next(error)
app.use(errorHandler);

module.exports = app;

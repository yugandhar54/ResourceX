/**
 * ResourceX Backend – Express Application
 * Sets up middleware, routes, and global error handling.
 */
'use strict';

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const path       = require('path');
const fs         = require('fs');

const authRoutes         = require('./routes/auth.routes');
const resourceRoutes     = require('./routes/resource.routes');
const reservationRoutes  = require('./routes/reservation.routes');
const transactionRoutes  = require('./routes/transaction.routes');
const notificationRoutes = require('./routes/notification.routes');
const requirementRoutes  = require('./routes/requirement.routes');
const wishlistRoutes     = require('./routes/wishlist.routes');
const adminRoutes        = require('./routes/admin.routes');
const reviewRoutes       = require('./routes/review.routes');

const app = express();

/* ── Security headers ── */
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false,
}));

/* ── CORS ── */
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman), file:// (null), or any local origin
    if (!origin || origin === 'null' || allowedOrigins.includes(origin) || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

/* ── Body parsing ── */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ── Logging (dev only) ── */
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

/* ── Rate limiting ── */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});
app.use('/api', apiLimiter);

/* ── Static uploads ── */
const uploadsDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch (_) {}
}
app.use('/uploads', express.static(uploadsDir));

/* ── Serve frontend static files ── */
const rootDir = path.join(__dirname, '../../');
app.use(express.static(rootDir));

/* ── API Routes ── */
app.use('/api/auth',          authRoutes);
app.use('/api/resources',     reviewRoutes); // Nested reviews: /api/resources/:id/reviews
app.use('/api/resources',     resourceRoutes);
app.use('/api/reservations',  reservationRoutes);
app.use('/api/transactions',  transactionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/requirements',  requirementRoutes);
app.use('/api/wishlist',      wishlistRoutes);
app.use('/api/admin',         adminRoutes);

/* ── Health check ── */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'ResourceX API' });
});

/* ── 404 handler for API routes ── */
app.use('/api', (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

/* ── Fallback to index.html for root or SPA paths ── */
app.get('*', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

/* ── Global error handler ── */
app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR] ${req.method} ${req.path} →`, err);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation failed',
      errors: Object.values(err.errors).map(e => ({ field: e.path, message: e.message })),
    });
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired, please log in again' });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ message: `${field} already exists` });
  }

  res.status(status).json({ message });
});

module.exports = app;

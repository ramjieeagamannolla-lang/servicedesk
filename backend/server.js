const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./src/config/db');
const { notFound, errorHandler } = require('./src/middleware/errorHandler');

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const departmentRoutes = require('./src/routes/departmentRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const ticketRoutes = require('./src/routes/ticketRoutes');
const assetRoutes = require('./src/routes/assetRoutes');
const knowledgeRoutes = require('./src/routes/knowledgeRoutes');
const slaRoutes = require('./src/routes/slaRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const auditRoutes = require('./src/routes/auditRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const searchRoutes = require('./src/routes/searchRoutes');

const app = express();

function validateEnvironment() {
  const required = ['MONGO_URI', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length) {
    console.error(`[config] Missing required environment variable(s): ${missing.join(', ')}`);
    console.error('[config] Set them in Render > Environment before starting the backend.');
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.length < 32) {
    console.warn('[config] JWT_SECRET should be at least 32 characters in production.');
  }
}

// --- Security & platform middleware -----------------------------------
// Render runs the service behind a proxy. This keeps rate limiting accurate
// and avoids express-rate-limit proxy validation errors in production.
app.set('trust proxy', 1);
app.use(helmet());

// CORS: support both local dev and the deployed frontend. CLIENT_URL may be
// a comma-separated list so you can allow local + prod at once.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true;

  const normalizedOrigin = origin.replace(/\/$/, '');
  if (allowedOrigins.includes(normalizedOrigin)) return true;

  try {
    const { protocol, hostname } = new URL(normalizedOrigin);
    return protocol === 'https:' && hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser tools (curl, Postman, server-to-server) with no origin header.
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Basic rate limiting on the API surface (generous, so the hackathon demo
// never gets accidentally throttled, but present as required).
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Tighter limiter specifically on login to slow down credential stuffing.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});
app.use('/api/auth/login', loginLimiter);

// --- Health check (required by Render) ---------------------------------
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ServiceDesk Pro API',
    health: '/api/health',
  });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ServiceDesk Pro API is running' });
});

// --- Routes --------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/sla', slaRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);

app.use(notFound);
app.use(errorHandler);

// --- Boot ------------------------------------------------------------------
const PORT = process.env.PORT || 5000;
let server;

async function start() {
  validateEnvironment();
  await connectDB();
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[server] ServiceDesk Pro API listening on 0.0.0.0:${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
}

process.on('unhandledRejection', (err) => {
  console.error('[server] Unhandled promise rejection:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('[server] SIGTERM received, shutting down');
  if (server) {
    server.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
});

if (require.main === module) {
  start().catch((err) => {
    console.error('[server] Startup failed:', err);
    process.exit(1);
  });
}

module.exports = app;
module.exports.start = start;

require('dotenv').config()

// ─── Validate required env vars before anything else ────────
const REQUIRED_ENV = ['PORT', 'MONGO_URI', 'JWT_SECRET', 'CLIENT_URL']
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`❌  Missing required environment variable: ${key}`)
    console.error(`    Copy .env.example → .env and fill in the value.`)
    process.exit(1)
  }
}

const express = require('express')

const dns = require('dns')
dns.setServers(['8.8.8.8', '8.8.4.4'])

const cors = require('cors')
const path = require('path')
const fs = require('fs')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const compression = require('compression')

const { appLogger } = require('./config/logger')
const requestLogger = require('./middleware/requestLogger')
const { onRateLimitExceeded } = require('./middleware/securityLogger')
const SecurityEvents = require('./utils/securityEvents')

// Routes
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const settingsRoutes = require('./routes/settingsRoutes')
const promoterRoutes = require('./routes/promoterRoutes')
const sponsorRoutes = require('./routes/sponsorRoutes')
const customerRoutes = require('./routes/customerRoutes')
const adminRoutes = require('./routes/adminRoutes')
const superadminRoutes = require('./routes/superadminRoutes')
const eventRoutes = require('./routes/eventRoutes')
const announcementRoutes = require('./routes/announcementsRoutes')
const policiesRoutes = require("./routes/policiesRoutes");
const merchandiseRoutes = require('./routes/merchandiseRoutes');
const concernRoutes = require('./routes/concernRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const orderRoutes = require('./routes/orderRoutes');
const payoutRoutes = require('./routes/payoutRoutes');
const digitalgiftsRoutes = require('./routes/digitalgiftsRoutes');
const auditLogRoutes = require('./routes/auditlogRoutes')
const uploadRoutes = require('./routes/uploadRoutes');
const errorHandler = require('./middleware/errorHandler')

const app = express()

// ✅ Trust proxy for accurate client IP detection behind reverse proxies
app.set('trust proxy', 1)

app.use(requestLogger)

// Ensure uploads folder exists (used by floorplan local uploads)
const uploadDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir)
}

// ─── Body parsers ─────────────────────────────────────────────
// One express.json() call — 10mb limit covers multipart metadata.
// Actual file bytes go through multer, not JSON, so this is safe.
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// ─── CORS ────────────────────────────────────────────────────
const allowedOrigins = process.env.CLIENT_URL.split(',').map(o => o.trim())
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`))
    }
  },
  credentials: true
}))

app.use(compression())

// ── Sanitize all incoming data against NoSQL injection ──
const mongoSanitize = require('express-mongo-sanitize')

app.use((req, res, next) => {
  if (req.headers.upgrade && req.headers.upgrade.toLowerCase() === 'websocket') {
    return next()
  }
  ['body', 'params', 'headers', 'query'].forEach((key) => {
    if (req[key]) {
      mongoSanitize.sanitize(req[key]);
    }
  });
  next()
})

// ─── Helmet / CSP ─────────────────────────────────────────────
// imgSrc includes:
//   - R2 public CDN domain (serves optimised webp — Step 11 & 12)
//   - Cloudflare R2 storage domain (fallback / dev)
// connectSrc includes R2 domain so fetch() calls to the CDN aren't blocked.
const R2_CDN = process.env.CDN_BASE_URL || ''          // e.g. https://pub-xxx.r2.dev
const R2_STORAGE = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`

const allowedImgSrc = process.env.NODE_ENV === 'production'
  ? ["'self'", "data:", "blob:", R2_CDN, R2_STORAGE]
  : ["'self'", "data:", "blob:", R2_CDN, R2_STORAGE,
     "http://localhost:4000", "http://127.0.0.1:4000", "http://192.168.18.6:4000"]

const allowedConnectSrc = process.env.NODE_ENV === 'production'
  ? ["'self'", R2_CDN, "https://api.iconify.design", "https://api.simplesvg.com", "https://api.unisvg.com"]
  : ["'self'", R2_CDN, R2_STORAGE,
     "http://localhost:4000", "ws://localhost:4000",
     "https://api.iconify.design", "https://api.simplesvg.com", "https://api.unisvg.com"]

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: allowedConnectSrc,
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      styleSrcElem: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      imgSrc: allowedImgSrc,
    }
  }
}))

// ─── Rate limiting ─────────────────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  handler: onRateLimitExceeded
}))

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  handler: onRateLimitExceeded
})

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Upload limit reached. Please wait before uploading again.' }
})

// Serve local floorplan uploads (legacy path — R2 images use CDN URL directly)
app.use('/uploads', express.static(uploadDir))

// ─── API routes ───────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/promoter', promoterRoutes)
app.use('/api/sponsor', sponsorRoutes)
app.use('/api/customer', customerRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/superadmin', superadminRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/announcements', announcementRoutes)
app.use('/api/policies', policiesRoutes)
app.use('/api/merchandise', merchandiseRoutes)
app.use('/api/concerns', concernRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/reservations', reservationRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/payouts', payoutRoutes)
app.use('/api/digital-gifts', digitalgiftsRoutes)
app.use('/api/audit-logs', auditLogRoutes)
app.use('/api/uploads', uploadLimiter, uploadRoutes)  // POST /image, DELETE /image, POST /floorplan

app.get('/api/test-error', (req, res, next) => {
  const err = new Error('Test error - delete this route after')
  err.status = 500
  next(err)
})

// 404 for unmatched API routes
app.use('/api/{*path}', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.originalUrl}` })
})

// Serve React SPA
const DIST = path.join(__dirname, '../frontend/dist')
console.log('DIST path:', DIST)
app.use(express.static(DIST))
app.get('{*path}', (req, res) => {
  res.sendFile(path.join(DIST, 'index.html'))
})

// Global error handler
app.use(errorHandler)

const http = require('http');
const socket = require('./socket');
const connectDB = require('./config/db');

const { expireOldReservations } = require('./controllers/reservationController')

connectDB().then(() => {
  const server = http.createServer(app)
  const io = socket.init(server)

  server.listen(process.env.PORT, () => {
    appLogger.info('ETP server started', { port: process.env.PORT, env: process.env.NODE_ENV })
    if (process.send) process.send('ready')

    // Start background job to expire old reservations (every 5 minutes)
    setInterval(() => {
        expireOldReservations()
    }, 5 * 60 * 1000)
  })

  const shutdown = (signal) => {
    console.log(`\n${signal} — shutting down worker ${process.pid}`)
    io.close()
    server.close(() => {
      console.log('All connections closed. Exiting.')
      process.exit(0)
    })
    setTimeout(() => process.exit(1), 7000)
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
})
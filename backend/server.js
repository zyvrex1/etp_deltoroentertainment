require('dotenv').config()

// ─── Validate required env vars before anything else ────────
// If any of these are missing the server crashes immediately
// with a clear message instead of a cryptic runtime error later.

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

// ✅ STEP 13: Trust proxy for accurate client IP detection behind reverse proxies
app.set('trust proxy', 1)

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir)
}

// middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.json({
  limit: '10kb'
}))
app.use(express.urlencoded({
  limit: '10kb',
  extended: true
}))

// Single cors block — reads from .env
const allowedOrigins =
  process.env.CLIENT_URL.split(',').map(o => o.trim())
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(
        `CORS: origin ${origin} not allowed`))
    }
  },
  credentials: true
}))

app.use(compression())

// ── Sanitize all incoming data against NoSQL injection ──
const mongoSanitize = require('express-mongo-sanitize')

app.use((req, res, next) => {
  // If it's a websocket handshake request, bypass mongo-sanitize to prevent crashes
  if (req.headers.upgrade && req.headers.upgrade.toLowerCase() === 'websocket') {
    return next()
  }

  // In Express 5, req.query is a getter-only property. 
  // express-mongo-sanitize middleware crashes when trying to reassign it.
  // We manually sanitize the properties instead.
  ['body', 'params', 'headers', 'query'].forEach((key) => {
    if (req[key]) {
      mongoSanitize.sanitize(req[key]);
    }
  });

  next()
})

// Single dev-only logger
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(req.method, req.path)
    next()
  })
}

// helmet sets secure HTTP headers (XSS, clickjacking, MIME sniff, etc.)
const allowedImgSrc = process.env.NODE_ENV === 'production'
  ? ["'self'", "data:", "blob:"]
  : ["'self'", "data:", "blob:", "http://localhost:4000", "http://127.0.0.1:4000", "http://192.168.18.6:4000"];

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "http://localhost:4000", "ws://localhost:4000", "https://api.iconify.design", "https://api.simplesvg.com", "https://api.unisvg.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      styleSrcElem: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      imgSrc: allowedImgSrc,
    }
  }
}))
// ─── STEP 13: Rate limiting ────────────────────────────────────
// Limits each IP to 100 requests per 15 minutes on all routes
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
}))

// General limiter for other auth endpoints (profile check, updates, logout)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60, // Relaxed from 20 to 60 for general routing; strict login/signup routes use the 5-limit instead
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
})



// serve uploaded images
app.use('/uploads', express.static(uploadDir))

// API routes
app.use('/api/auth', authLimiter, authRoutes)
// app.use('/api/auth', authRoutes)
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
app.use('/api/uploads', uploadRoutes)

app.get('/api/test-error', (req, res, next) => {
  const err = new Error('Test error - delete this route after')
  err.status = 500
  next(err)
})


// NEW - works in Express 5
app.use('/api/{*path}', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.originalUrl}` })
})


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

// connect to db
// connectDB().then(() => {
//     const server = http.createServer(app);
//     socket.init(server);

//     server.listen(process.env.PORT, () => {
//         console.log('Server running on port', process.env.PORT)
//     });
// });


connectDB().then(() => {
  const server = http.createServer(app)
  socket.init(server)

  server.listen(process.env.PORT, () => {
    console.log(`🚀  Server running on port ${process.env.PORT} [${process.env.NODE_ENV}]`)
  })
})
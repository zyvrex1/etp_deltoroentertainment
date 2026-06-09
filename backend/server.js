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
// Use Google DNS to resolve MongoDB Atlas SRV records if local DNS fails
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



// express app
const app = express()

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir)
}

// middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({
  limit: "10mb", extended: true
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

// Single dev-only logger
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(req.method, req.path)
    next()
  })
}

// helmet sets secure HTTP headers (XSS, clickjacking, MIME sniff, etc.)
app.use(helmet())

// ─── Rate limiting ────────────────────────────────────────────
// Limits each IP to 100 requests per 15 minutes on all routes
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
}))

// Stricter limiter for auth routes (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts, please try again in 15 minutes.' }
})



// serve uploaded images
app.use('/uploads', express.static(uploadDir))

// API routes
app.use('/api/auth', authLimiter,authRoutes)
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


// Global error handler
app.use((err, req, res, next) => {
    console.error(err)

    if (err.message === "Only image files are allowed (JPG, PNG, WEBP)") {
        return res.status(400).json({ error: err.message })
    }

    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "File size must be less than 5MB" })
    }

    res.status(500).json({ error: 'Something went wrong' })
})

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
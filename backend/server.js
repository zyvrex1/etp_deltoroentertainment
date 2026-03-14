require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const fs = require('fs')

// Routes
const authRoutes = require('./routes/authRoutes')
const promoterRoutes = require('./routes/promoterRoutes')
const sponsorRoutes = require('./routes/sponsorRoutes')
const customerRoutes = require('./routes/customerRoutes')
const adminRoutes = require('./routes/adminRoutes')
const superadminRoutes = require('./routes/superadminRoutes')
const eventRoutes = require('./routes/eventRoutes')
const announcementRoutes = require('./routes/announcementsRoutes')
const policiesRoutes = require("./routes/policiesRoutes");

// express app
const app = express()

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir)
}

// middleware
app.use(express.json())

// request logger
app.use((req, res, next) => {
    console.log(req.method, req.path)
    next()
})

// serve uploaded images
app.use('/uploads', express.static(uploadDir))

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/promoter', promoterRoutes)
app.use('/api/sponsor', sponsorRoutes)
app.use('/api/customer', customerRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/superadmin', superadminRoutes)
app.use('/api/events', eventRoutes)

app.use('/api/announcements', announcementRoutes)
app.use('/api/policies', policiesRoutes) 

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

// connect to db
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB')

        app.listen(process.env.PORT, () => {
            console.log('Server running on port', process.env.PORT)
        })
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error)
    })
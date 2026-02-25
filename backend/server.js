require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')

const eventRoutes = require('./routes/eventRoutes')
const authRoutes = require('./routes/authRoutes')
const promoterRoutes = require('./routes/promoterRoutes')
const sponsorRoutes = require('./routes/sponsorRoutes')
const customerRoutes = require('./routes/customerRoutes')
const adminRoutes = require('./routes/adminRoutes')
const superadminRoutes = require('./routes/superadminRoutes')

// express app
const app = express()

// middleware
app.use(express.json())

app.use((req, res, next) => {
    console.log(req.path, req.method)
    next()
})

// routes
app.use('/api/events', eventRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/promoters', promoterRoutes)
app.use('/api/sponsors', sponsorRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/superadmin', superadminRoutes)

// error handling
app.use((err, req, res, next) => {
    console.error(err.stack)
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
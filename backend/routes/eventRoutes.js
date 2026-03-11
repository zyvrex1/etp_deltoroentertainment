const express = require('express')

const router = express.Router()

// Controllers
const {
  getEvents,
  getEvent,
  createEvent,
  deleteEvent,
  updateEvent,
  upload
} = require('../controllers/eventController')

// Middleware
const requireAuth = require('../middleware/requireAuth')

// Protect all routes
router.use(requireAuth)


// GET all events
router.get('/', getEvents)


// GET single event
router.get('/:id', getEvent)


// CREATE event (with image upload)
router.post('/', upload.single('image'), createEvent)


// DELETE event
router.delete('/:id', deleteEvent)


// UPDATE event (optional image update)
router.patch('/:id', upload.single('image'), updateEvent)


module.exports = router
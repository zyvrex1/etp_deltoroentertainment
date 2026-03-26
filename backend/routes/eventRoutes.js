const express = require('express')
const router = express.Router()
const {
  getEvents,
  getEvent,
  createEvent,
  deleteEvent,
  updateEvent,
  updateSeatMap,
  upload,
} = require('../controllers/eventController')

const { addPriceLevels } = require('../controllers/ticketController') // <-- import
const requireAuth = require('../middleware/requireAuth')
const optionalAuth = require('../middleware/optionalAuth')

router.get('/', optionalAuth, getEvents)

router.use(requireAuth)

router.get('/:id', getEvent)

router.post('/', upload.single('image'), createEvent)

router.delete('/:id', deleteEvent)

router.patch('/:id', upload.single('image'), updateEvent)

router.patch('/:id/seatmap', updateSeatMap)

router.post('/:eventId/price-levels', addPriceLevels) // <-- new route

module.exports = router
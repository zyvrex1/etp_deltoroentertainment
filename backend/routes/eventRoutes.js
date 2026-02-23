const express = require('express')
const { getEvents, getEvent, createEvent, deleteEvent, updateEvent } = require('../controllers/eventController')
const requireAuth = require('../middleware/requireAuth')

const router = express.Router()

router.use(requireAuth)

// GET All
router.get('/', getEvents)

// GET Single
router.get('/:id', getEvent)

// POST New
router.post('/', createEvent)

// DELETE Single
router.delete('/:id', deleteEvent)

// UPDATE
router.patch('/:id', updateEvent)

module.exports = router
const express = require('express')
const router = express.Router()

// Controllers
const {
  getEvents,
  getEvent,
  createEvent,
  deleteEvent,
  updateEvent,
  saveVenueLayout,
  upload,
} = require('../controllers/eventController')

const { 
  addPriceLevels, 
  getPriceLevels, 
  updatePriceLevel, 
  deletePriceLevel 
} = require("../controllers/priceLevelController");

// Middleware
const requireAuth = require('../middleware/requireAuth')
const optionalAuth = require('../middleware/optionalAuth')

/* =========================
    PUBLIC ROUTES
   ========================= */
// Move these ABOVE requireAuth so guests can see events
router.get('/', optionalAuth, getEvents)
router.get('/:id', optionalAuth, getEvent)
router.get("/:eventId/price-levels", getPriceLevels);

/* =========================
    PROTECTED ROUTES
   ========================= */
router.use(requireAuth) // Everything below this requires a login

router.post('/', upload.single('image'), createEvent)
router.delete('/:id', deleteEvent)
router.patch('/:id', upload.single('image'), updateEvent) // Added upload here

router.put('/:id/layout', saveVenueLayout)

// Price Level Management
router.post("/:eventId/price-levels", addPriceLevels);
router.patch("/:eventId/price-levels/:priceLevelId", updatePriceLevel);
router.delete("/:eventId/price-levels/:priceLevelId", deletePriceLevel);

module.exports = router
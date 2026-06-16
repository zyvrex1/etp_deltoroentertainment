const express = require('express')
const router = express.Router()

const { validateReserveBooth, validateBuySeats } = require('../middleware/validateSchemas')

// Controllers
const {
  getEvents,
  getEvent,
  createEvent,
  deleteEvent,
  updateEvent,
  saveVenueLayout,
  assignPriceLevels,
  buySeats,
  reserveBooth,
  syncBoothStatus,
  upload,
} = require('../controllers/eventController')

const {
  addPriceLevels,
  getPriceLevels,
  updatePriceLevel,
  deletePriceLevel
} = require("../controllers/priceLevelController");
const requireAuth = require('../middleware/requireAuth')
const optionalAuth = require('../middleware/optionalAuth')
const paginate = require('../middleware/paginate')

router.get('/', optionalAuth, paginate, getEvents)
router.get('/:id', optionalAuth, getEvent)
router.get("/:eventId/price-levels", getPriceLevels);

router.use(requireAuth) // Everything below this requires a login

router.post('/', upload.single('image'), createEvent)
router.delete('/:id', deleteEvent)
router.patch('/:id', upload.single('image'), updateEvent)

// Venue Configuration Routes
router.put('/:id/layout', saveVenueLayout)
router.put('/:id/assign-prices', assignPriceLevels)
router.post('/:id/reserve-booth', validateReserveBooth, reserveBooth)
router.post('/:id/sync-booths', syncBoothStatus)
router.post('/:id/buy-seats', validateBuySeats, buySeats)

// Price Level Management
router.post("/:eventId/price-levels", addPriceLevels);
router.patch("/:eventId/price-levels/:priceLevelId", updatePriceLevel);
router.delete("/:eventId/price-levels/:priceLevelId", deletePriceLevel);

module.exports = router
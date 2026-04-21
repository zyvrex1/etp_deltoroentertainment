const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

router.use(requireAuth);

// Sponsor routes
router.get('/my-booths', requireRole('sponsor'), reservationController.getMyReservations);

// Admin routes
router.get('/admin', requireRole('admin'), reservationController.getAllReservations);

module.exports = router;

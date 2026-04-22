const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

router.use(requireAuth);

// Admin routes
router.get('/admin', requireRole('admin'), reservationController.getAllReservations);

// Sponsor routes
router.get('/my-booths', requireRole('sponsor'), reservationController.getMyReservations);
router.get('/:id', reservationController.getReservationById);

router.delete('/:id', requireRole('admin'), reservationController.deleteReservation);

module.exports = router;

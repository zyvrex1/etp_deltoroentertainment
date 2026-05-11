const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

router.use(requireAuth);

// Admin routes
router.get('/admin', requireRole('admin'), reservationController.getAllReservations);

// My Reservations (both Sponsors/Booths and Customers/Seats)
router.get('/my-booths', reservationController.getMyReservations);
router.get('/event/:eventId/booths', reservationController.getEventBoothReservations);
router.get('/:id', reservationController.getReservationById);
router.post('/:id/exhibitors', requireRole('sponsor'), reservationController.addExhibitors);
router.delete('/:id/exhibitors/:userId', requireRole('sponsor'), reservationController.removeExhibitor);

router.delete('/:id', requireRole('admin'), reservationController.deleteReservation);

module.exports = router;

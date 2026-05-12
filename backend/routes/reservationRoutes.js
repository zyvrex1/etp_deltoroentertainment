const express = require('express');
const router = express.Router();
const { getMyReservations, getAllReservations, getEventBoothReservations, getReservationById, addExhibitors, removeExhibitor, deleteReservation, updateStoreSettings } = require('../controllers/reservationController');
const { upload } = require('../controllers/userController');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

router.use(requireAuth);

// Admin routes
router.get('/admin', requireRole('admin'), getAllReservations);

// My Reservations (both Sponsors/Booths and Customers/Seats)
router.get('/my-booths', getMyReservations);
router.get('/event/:eventId/booths', getEventBoothReservations);
router.get('/:id', getReservationById);
router.post('/:id/exhibitors', requireRole('sponsor'), addExhibitors);
router.delete('/:id/exhibitors/:userId', requireRole('sponsor'), removeExhibitor);

router.delete('/:id', requireRole('admin'), deleteReservation);
router.put('/:id/store-settings', upload.single('avatar'), updateStoreSettings);

module.exports = router;

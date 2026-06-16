const express = require('express');
const router = express.Router();
const {
    getMyReservations,
    getAllReservations,
    getEventBoothReservations,
    getEventSalesForPromoter,
    getReservationById,
    addExhibitors,
    removeExhibitor,
    deleteReservation,
    updateStoreSettings,
    checkInReservation,
    updateReservationStatus
} = require('../controllers/reservationController');
const { upload } = require('../controllers/userController');
const requireAuth = require('../middleware/requireAuth');
const { verifyReservationOwner } = require('../middleware/verifyOwnership');   // already here ✓
const validateObjectId = require('../middleware/validateObjectId');
const requireRole = require('../middleware/requireRole');
const paginate = require('../middleware/paginate');
const {
  validateReservationStatus,
  validateAddExhibitors,
  validateStoreSettings
} = require('../middleware/validateSchemas');

router.use(requireAuth);

router.get('/admin', requireRole('admin', 'superadmin'), paginate, getAllReservations);
router.get('/my-booths', getMyReservations);
router.get('/event/:eventId/booths', getEventBoothReservations);
router.get('/event/:eventId/sales', getEventSalesForPromoter);

// ✓ checkin stays open — staff scan any reservation
router.post('/:id/checkin', validateObjectId, checkInReservation);

// ✓ verifyReservationOwner now actually applied
router.get('/:id', validateObjectId, verifyReservationOwner, getReservationById);

router.post('/:id/exhibitors', requireRole('sponsor'), validateObjectId, verifyReservationOwner, validateAddExhibitors, addExhibitors);

router.delete('/:id/exhibitors/:userId', requireRole('sponsor'), validateObjectId, verifyReservationOwner, removeExhibitor);

router.delete('/:id', requireRole('admin'), validateObjectId, deleteReservation);

router.put('/:id/status', requireRole('admin'), validateObjectId, validateReservationStatus, updateReservationStatus);

router.put('/:id/store-settings', validateObjectId, verifyReservationOwner, upload.single('avatar'), validateStoreSettings, updateStoreSettings);

module.exports = router;
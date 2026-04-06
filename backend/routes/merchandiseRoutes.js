const express = require('express');
const router = express.Router();
const {
  createMerchandise,
  getMerchandises,
  getMerchandise,
  updateMerchandise,
  deleteMerchandise,
} = require('../controllers/merchandiseController');

const requireAuth = require('../middleware/requireAuth');
const optionalAuth = require('../middleware/optionalAuth');
const requireRole = require('../middleware/requireRole');

// Public or optionally authenticated routes
router.get('/', optionalAuth, getMerchandises);
router.get('/:id', optionalAuth, getMerchandise);

// Protected routes (Login required)
router.use(requireAuth);

// Only Sponsor, Admin, or Superadmin can manage merchandise
router.post('/', requireRole('sponsor', 'admin', 'superadmin'), createMerchandise);
router.patch('/:id', requireRole('sponsor', 'admin', 'superadmin'), updateMerchandise);
router.delete('/:id', requireRole('sponsor', 'admin', 'superadmin'), deleteMerchandise);

module.exports = router;

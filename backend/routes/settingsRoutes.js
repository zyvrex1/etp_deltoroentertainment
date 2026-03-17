const express = require('express');
const router = express.Router();

const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const {
  getSettings,
  updateGeneral,
  updateFees
} = require('../controllers/settingsController');

// ✅ Admin-only routes
router.get('/', requireAuth, requireRole('admin', 'superadmin'), getSettings);
router.put('/general', requireAuth, requireRole('admin', 'superadmin'), updateGeneral);
router.put('/fees', requireAuth, requireRole('admin', 'superadmin'), updateFees);

module.exports = router;
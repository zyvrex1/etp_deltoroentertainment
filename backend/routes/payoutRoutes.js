const express = require('express');
const {
  createPayout,
  getPayouts,
  updatePayoutStatus
} = require('../controllers/payoutController');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const validateObjectId = require('../middleware/validateObjectId');
const { verifyPayoutOwner } = require('../middleware/verifyOwnership');
const {validateCreatePayout,validateUpdatePayoutStatus} = require('../middleware/validateSchemas');

const router = express.Router();
router.use(requireAuth);

router.post('/', requireRole('promoter', 'admin', 'superadmin'), validateCreatePayout, createPayout);
router.get('/', requireRole('promoter', 'admin', 'superadmin'), getPayouts);

router.patch('/:id/status', requireRole('admin', 'superadmin'), validateObjectId, verifyPayoutOwner, validateUpdatePayoutStatus, updatePayoutStatus);

module.exports = router;
const express = require('express');
const {
  createPayout,
  getPayouts,
  updatePayoutStatus
} = require('../controllers/payoutController');
const requireAuth = require('../middleware/requireAuth');
const validateObjectId = require('../middleware/validateObjectId');
const { verifyPayoutOwner } = require('../middleware/verifyOwnership');
const {validateCreatePayout,validateUpdatePayoutStatus} = require('../middleware/validateSchemas');

const router = express.Router();
router.use(requireAuth);

router.post('/', validateCreatePayout, createPayout);
router.get('/', getPayouts);

router.patch('/:id/status', validateObjectId, verifyPayoutOwner, validateUpdatePayoutStatus, updatePayoutStatus);

module.exports = router;
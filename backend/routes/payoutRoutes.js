const express = require('express');
const { createPayout, getPayouts, updatePayoutStatus } = require('../controllers/payoutController');
const requireAuth = require('../middleware/requireAuth');
const { validateCreatePayout, validateUpdatePayoutStatus } = require('../middleware/validateSchemas')

const router = express.Router();

// Require auth for all payout routes
router.use(requireAuth);


router.post('/', validateCreatePayout, createPayout);
router.get('/', getPayouts);
router.patch('/:id/status', validateUpdatePayoutStatus, updatePayoutStatus);
module.exports = router;

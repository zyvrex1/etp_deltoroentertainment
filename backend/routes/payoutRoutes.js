const express = require('express');
const { createPayout, getPayouts, updatePayoutStatus } = require('../controllers/payoutController');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// Require auth for all payout routes
router.use(requireAuth);

router.post('/', createPayout);
router.get('/', getPayouts);
router.patch('/:id/status', updatePayoutStatus);

module.exports = router;

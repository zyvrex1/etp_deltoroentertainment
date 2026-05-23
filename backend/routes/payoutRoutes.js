const express = require('express');
const { createPayout, getPayouts } = require('../controllers/payoutController');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// Require auth for all payout routes
router.use(requireAuth);

router.post('/', createPayout);
router.get('/', getPayouts);

module.exports = router;

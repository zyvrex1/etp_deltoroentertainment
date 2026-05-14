const express = require('express');
const { createOrder, getOrders, updateOrder } = require('../controllers/orderController');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

router.post('/', createOrder);
router.get('/', getOrders);
router.patch('/:id', updateOrder);

module.exports = router;

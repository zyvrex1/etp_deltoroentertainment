const express = require('express');
const { createOrder, getOrders, updateOrder } = require('../controllers/orderController');
const requireAuth = require('../middleware/requireAuth');
const { validateCreateOrder, validateUpdateOrder } = require('../middleware/validateSchemas')

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

router.post('/', validateCreateOrder, createOrder);
router.get('/', getOrders);
router.patch('/:id', validateUpdateOrder, updateOrder);

module.exports = router;

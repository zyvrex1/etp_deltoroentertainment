const express = require('express');
const {
  createOrder,
  getOrders,
  updateOrder
} = require('../controllers/orderController');
const requireAuth = require('../middleware/requireAuth');
const validateObjectId = require('../middleware/validateObjectId');
const { verifyOrderOwner } = require('../middleware/verifyOwnership');
const {validateCreateOrder,validateUpdateOrder} = require('../middleware/validateSchemas');

const router = express.Router();
const paginate = require('../middleware/paginate');
router.use(requireAuth);

router.post('/', validateCreateOrder, createOrder);
router.get('/', paginate, getOrders);

router.patch('/:id', validateObjectId, verifyOrderOwner, validateUpdateOrder, updateOrder);

module.exports = router;
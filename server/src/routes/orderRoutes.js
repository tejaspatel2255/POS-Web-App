const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getOrders,
  getOrderById,
  createOrder,
  refundOrder,
  voidOrder,
} = require('../controllers/orderController');

router.use(protect);

router.route('/')
  .get(getOrders)
  .post(createOrder);

router.route('/:id')
  .get(getOrderById);

router.post('/:id/refund', authorize('admin', 'manager'), refundOrder);
router.put('/:id/void', authorize('admin', 'manager'), voidOrder);

module.exports = router;

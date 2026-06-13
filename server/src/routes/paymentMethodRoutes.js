const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} = require('../controllers/paymentMethodController');

router.use(protect);

router.route('/')
  .get(getPaymentMethods)
  .post(authorize('admin', 'manager'), createPaymentMethod);

router.route('/:id')
  .put(authorize('admin', 'manager'), updatePaymentMethod)
  .delete(authorize('admin', 'manager'), deletePaymentMethod);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDiscountTypes,
  createDiscountType,
  updateDiscountType,
  deleteDiscountType,
} = require('../controllers/discountTypeController');

router.use(protect);

router.route('/')
  .get(getDiscountTypes)
  .post(authorize('admin', 'manager'), createDiscountType);

router.route('/:id')
  .put(authorize('admin', 'manager'), updateDiscountType)
  .delete(authorize('admin', 'manager'), deleteDiscountType);

module.exports = router;

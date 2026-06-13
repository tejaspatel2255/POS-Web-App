const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getReasons,
  createReason,
  updateReason,
  deleteReason,
} = require('../controllers/stockAdjustmentReasonController');

router.use(protect);

router.route('/')
  .get(getReasons)
  .post(authorize('admin', 'manager'), createReason);

router.route('/:id')
  .put(authorize('admin', 'manager'), updateReason)
  .delete(authorize('admin', 'manager'), deleteReason);

module.exports = router;

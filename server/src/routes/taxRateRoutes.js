const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getTaxRates,
  createTaxRate,
  updateTaxRate,
  deleteTaxRate,
} = require('../controllers/taxRateController');

router.use(protect);

router.route('/')
  .get(getTaxRates)
  .post(authorize('admin', 'manager'), createTaxRate);

router.route('/:id')
  .put(authorize('admin', 'manager'), updateTaxRate)
  .delete(authorize('admin', 'manager'), deleteTaxRate);

module.exports = router;

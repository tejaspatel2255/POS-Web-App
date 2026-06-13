const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getSalesReport,
  getInventoryReport,
} = require('../controllers/reportController');

router.use(protect);
router.use(authorize('admin', 'manager'));

router.get('/sales', getSalesReport);
router.get('/inventory', getInventoryReport);

module.exports = router;

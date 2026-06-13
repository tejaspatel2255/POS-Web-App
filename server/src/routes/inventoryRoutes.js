const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getInventory,
  adjustStock,
  getInventoryLogs,
  transferStock,
} = require('../controllers/inventoryController');

router.use(protect);

router.get('/', getInventory);
router.post('/adjust', authorize('admin', 'manager'), adjustStock);
router.get('/logs', authorize('admin', 'manager'), getInventoryLogs);
router.post('/transfer', authorize('admin', 'manager'), transferStock);

module.exports = router;

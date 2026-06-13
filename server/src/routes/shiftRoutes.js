const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getCurrentShift,
  openShift,
  closeShift,
  getShifts,
} = require('../controllers/shiftController');

router.use(protect);

router.get('/current', getCurrentShift);
router.post('/open', openShift);
router.post('/close', closeShift);
router.get('/', authorize('admin', 'manager'), getShifts);

module.exports = router;

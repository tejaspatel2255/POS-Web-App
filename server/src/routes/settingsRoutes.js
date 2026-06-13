const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getSettings,
  updateSettings,
  updateOutletProfile,
} = require('../controllers/settingsController');

router.use(protect);

router.route('/')
  .get(getSettings)
  .put(authorize('admin', 'manager'), updateSettings);

router.put('/profile', authorize('admin', 'manager'), updateOutletProfile);

module.exports = router;

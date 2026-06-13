const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getOutlets,
  createOutlet,
  updateOutlet,
  deleteOutlet,
} = require('../controllers/outletController');

router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getOutlets)
  .post(createOutlet);

router.route('/:id')
  .put(updateOutlet)
  .delete(deleteOutlet);

module.exports = router;

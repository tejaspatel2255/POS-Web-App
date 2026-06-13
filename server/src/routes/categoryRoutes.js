const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} = require('../controllers/categoryController');

router.use(protect);

router.route('/')
  .get(getCategories)
  .post(authorize('admin', 'manager'), createCategory);

router.post('/reorder', authorize('admin', 'manager'), reorderCategories);

router.route('/:id')
  .put(authorize('admin', 'manager'), updateCategory)
  .delete(authorize('admin', 'manager'), deleteCategory);

module.exports = router;

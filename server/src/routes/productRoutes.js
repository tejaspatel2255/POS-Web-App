const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  importProductsCSV,
} = require('../controllers/productController');

router.use(protect);

router.route('/')
  .get(getProducts)
  .post(authorize('admin', 'manager'), createProduct);

router.post('/bulk-delete', authorize('admin', 'manager'), bulkDeleteProducts);
router.post('/import', authorize('admin', 'manager'), importProductsCSV);

router.route('/:id')
  .put(authorize('admin', 'manager'), updateProduct)
  .delete(authorize('admin', 'manager'), deleteProduct);

module.exports = router;

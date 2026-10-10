const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { productSchema } = require('../utils/validators');

router.get('/', requireAuth, productController.getProducts);
router.get('/:id', requireAuth, productController.getProductById);
router.post(
  '/',
  requireAuth,
  requireRole('Admin', 'Warehouse Manager'),
  validateBody(productSchema),
  productController.createProduct
);
router.put(
  '/:id',
  requireAuth,
  requireRole('Admin', 'Warehouse Manager'),
  productController.updateProduct
);
router.delete('/:id', requireAuth, requireRole('Admin'), productController.deleteProduct);

module.exports = router;

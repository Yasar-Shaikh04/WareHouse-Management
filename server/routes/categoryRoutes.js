const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { categorySchema } = require('../utils/validators');

router.get('/', requireAuth, categoryController.getAllCategories);
router.get('/:id', requireAuth, categoryController.getCategoryById);
router.post(
  '/',
  requireAuth,
  requireRole('Admin', 'Warehouse Manager'),
  validateBody(categorySchema),
  categoryController.createCategory
);
router.put(
  '/:id',
  requireAuth,
  requireRole('Admin', 'Warehouse Manager'),
  validateBody(categorySchema),
  categoryController.updateCategory
);
router.delete('/:id', requireAuth, requireRole('Admin'), categoryController.deleteCategory);

module.exports = router;

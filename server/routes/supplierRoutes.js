const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { supplierSchema } = require('../utils/validators');

router.get('/', requireAuth, supplierController.getAllSuppliers);
router.get('/:id', requireAuth, supplierController.getSupplierById);
router.post(
  '/',
  requireAuth,
  requireRole('Admin', 'Warehouse Manager'),
  validateBody(supplierSchema),
  supplierController.createSupplier
);
router.put(
  '/:id',
  requireAuth,
  requireRole('Admin', 'Warehouse Manager'),
  validateBody(supplierSchema),
  supplierController.updateSupplier
);
router.delete('/:id', requireAuth, requireRole('Admin'), supplierController.deleteSupplier);

module.exports = router;

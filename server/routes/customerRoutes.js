const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { customerSchema } = require('../utils/validators');

router.get('/', requireAuth, customerController.getAllCustomers);
router.get('/:id', requireAuth, customerController.getCustomerById);
router.post(
  '/',
  requireAuth,
  requireRole('Admin', 'Warehouse Manager'),
  validateBody(customerSchema),
  customerController.createCustomer
);
router.put(
  '/:id',
  requireAuth,
  requireRole('Admin', 'Warehouse Manager'),
  validateBody(customerSchema),
  customerController.updateCustomer
);
router.delete(
  '/:id',
  requireAuth,
  requireRole('Admin', 'Warehouse Manager'),
  customerController.deleteCustomer
);

module.exports = router;

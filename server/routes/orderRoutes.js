const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { orderSchema, orderStatusSchema } = require('../utils/validators');

router.get('/', requireAuth, orderController.getOrders);
router.get('/:id', requireAuth, orderController.getOrderById);
router.post('/', requireAuth, validateBody(orderSchema), orderController.createOrder);
router.patch(
  '/:id/status',
  requireAuth,
  requireRole('Admin', 'Warehouse Manager'),
  validateBody(orderStatusSchema),
  orderController.updateOrderStatus
);
router.delete('/:id', requireAuth, requireRole('Admin'), orderController.deleteOrder);

module.exports = router;

const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { stockMovementSchema } = require('../utils/validators');

router.get('/inventory', requireAuth, inventoryController.getInventoryOverview);
router.get('/stock-movements', requireAuth, inventoryController.getStockMovements);
router.post(
  '/stock-movements',
  requireAuth,
  validateBody(stockMovementSchema),
  inventoryController.recordStockMovement
);

module.exports = router;

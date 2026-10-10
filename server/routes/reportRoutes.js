const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { requireAuth } = require('../middleware/auth');

router.get('/dashboard', requireAuth, reportController.getDashboardStats);
router.get('/inventory', requireAuth, reportController.getInventoryReport);
router.get('/low-stock', requireAuth, reportController.getLowStockReport);

// CSV Export routes
router.get('/inventory/export', requireAuth, reportController.exportInventoryCsv);
router.get('/stock-movements/export', requireAuth, reportController.exportStockMovementsCsv);
router.get('/orders/export', requireAuth, reportController.exportOrdersCsv);

module.exports = router;

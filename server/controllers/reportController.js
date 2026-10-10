const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const StockMovement = require('../models/StockMovement');
const Category = require('../models/Category');

const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalProducts,
      totalSuppliers,
      totalCustomers,
      products,
      pendingOrdersCount,
      recentMovements,
      recentOrders,
      categories,
    ] = await Promise.all([
      Product.countDocuments(),
      Supplier.countDocuments(),
      Customer.countDocuments(),
      Product.find().select('quantity minStockLevel category').lean(),
      Order.countDocuments({ status: 'Pending' }),
      StockMovement.find()
        .populate('product', 'name sku')
        .populate('performedBy', 'name')
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      Order.find()
        .populate('customer', 'name companyName')
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      Category.find().select('name').lean(),
    ]);

    let totalInventoryUnits = 0;
    let lowStockProducts = 0;
    const categoryQtyMap = {};

    products.forEach((p) => {
      totalInventoryUnits += p.quantity;
      if (p.quantity <= p.minStockLevel) {
        lowStockProducts++;
      }
      const catId = p.category ? p.category.toString() : 'other';
      categoryQtyMap[catId] = (categoryQtyMap[catId] || 0) + p.quantity;
    });

    // Format Category distribution for charts
    const categoryDistribution = categories.map((cat) => ({
      name: cat.name,
      units: categoryQtyMap[cat._id.toString()] || 0,
    })).filter((c) => c.units > 0);

    // Monthly order trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyAggregation = await Order.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyActivity = monthlyAggregation.map((m) => ({
      month: `${monthNames[m._id.month - 1]} ${m._id.year}`,
      orders: m.orderCount,
      revenue: Math.round(m.totalRevenue),
    }));

    // If less than 6 months of data, generate month slots
    const finalMonthlyTrend = monthlyActivity.length > 0 ? monthlyActivity : [
      { month: 'Current Month', orders: await Order.countDocuments(), revenue: 0 }
    ];

    return res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        totalSuppliers,
        totalCustomers,
        totalInventoryUnits,
        lowStockProducts,
        pendingOrders: pendingOrdersCount,
      },
      recentMovements,
      recentOrders,
      charts: {
        categoryDistribution,
        monthlyActivity: finalMonthlyTrend,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getInventoryReport = async (req, res, next) => {
  try {
    const products = await Product.find()
      .populate('category', 'name')
      .populate('supplier', 'companyName')
      .sort({ name: 1 })
      .lean();

    const data = products.map((p) => ({
      sku: p.sku,
      name: p.name,
      category: p.category?.name || 'N/A',
      supplier: p.supplier?.companyName || 'N/A',
      location: p.location,
      quantity: p.quantity,
      minStockLevel: p.minStockLevel,
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
      inventoryValue: p.quantity * p.purchasePrice,
      status: p.quantity === 0 ? 'Out of Stock' : p.quantity <= p.minStockLevel ? 'Low Stock' : 'In Stock',
    }));

    return res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};

const getLowStockReport = async (req, res, next) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$quantity', '$minStockLevel'] },
    })
      .populate('category', 'name')
      .populate('supplier', 'companyName phone email')
      .sort({ quantity: 1 })
      .lean();

    return res.status(200).json({ success: true, count: products.length, products });
  } catch (err) {
    next(err);
  }
};

const exportCsvHelper = (res, filename, headers, rows) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const escapeCsvField = (field) => {
    if (field === null || field === undefined) return '';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escapeCsvField).join(',');
  const rowLines = rows.map((r) => r.map(escapeCsvField).join(','));
  const csvContent = [headerLine, ...rowLines].join('\r\n');

  res.status(200).send(csvContent);
};

const exportInventoryCsv = async (req, res, next) => {
  try {
    const products = await Product.find()
      .populate('category', 'name')
      .populate('supplier', 'companyName')
      .lean();

    const headers = ['SKU', 'Product Name', 'Category', 'Supplier', 'Location', 'Quantity', 'Min Stock Level', 'Purchase Price', 'Selling Price', 'Inventory Value', 'Status'];
    const rows = products.map((p) => [
      p.sku,
      p.name,
      p.category?.name || '',
      p.supplier?.companyName || '',
      p.location,
      p.quantity,
      p.minStockLevel,
      p.purchasePrice,
      p.sellingPrice,
      (p.quantity * p.purchasePrice).toFixed(2),
      p.quantity === 0 ? 'Out of Stock' : p.quantity <= p.minStockLevel ? 'Low Stock' : 'In Stock',
    ]);

    exportCsvHelper(res, `inventory_report_${Date.now()}.csv`, headers, rows);
  } catch (err) {
    next(err);
  }
};

const exportStockMovementsCsv = async (req, res, next) => {
  try {
    const movements = await StockMovement.find()
      .populate('product', 'name sku')
      .populate('performedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const headers = ['Date', 'Reference', 'SKU', 'Product', 'Type', 'Quantity', 'Previous Stock', 'New Stock', 'Reason', 'Performed By'];
    const rows = movements.map((m) => [
      new Date(m.createdAt).toISOString(),
      m.referenceNumber,
      m.product?.sku || '',
      m.product?.name || '',
      m.movementType,
      m.quantity,
      m.previousStock,
      m.newStock,
      m.reason,
      m.performedBy?.name || '',
    ]);

    exportCsvHelper(res, `stock_movements_${Date.now()}.csv`, headers, rows);
  } catch (err) {
    next(err);
  }
};

const exportOrdersCsv = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('customer', 'name companyName')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const headers = ['Order Number', 'Date', 'Customer', 'Items Count', 'Total Amount', 'Status', 'Created By', 'Notes'];
    const rows = orders.map((o) => [
      o.orderNumber,
      new Date(o.orderDate || o.createdAt).toISOString(),
      o.customer ? `${o.customer.name} (${o.customer.companyName || 'Individual'})` : '',
      o.items?.length || 0,
      o.totalAmount.toFixed(2),
      o.status,
      o.createdBy?.name || '',
      o.notes || '',
    ]);

    exportCsvHelper(res, `orders_report_${Date.now()}.csv`, headers, rows);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats,
  getInventoryReport,
  getLowStockReport,
  exportInventoryCsv,
  exportStockMovementsCsv,
  exportOrdersCsv,
};

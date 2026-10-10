const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const StockMovement = require('../models/StockMovement');

const generateOrderNumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const countToday = await Order.countDocuments({
    createdAt: {
      $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      $lte: new Date(new Date().setHours(23, 59, 59, 999)),
    },
  });
  const sequence = String(countToday + 1).padStart(4, '0');
  return `ORD-${dateStr}-${sequence}`;
};

const getOrders = async (req, res, next) => {
  try {
    const {
      status,
      customer,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (customer) {
      query.customer = customer;
    }

    if (search) {
      query.orderNumber = { $regex: search, $options: 'i' };
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const [orders, totalCount] = await Promise.all([
      Order.find(query)
        .populate('customer', 'name email phone companyName')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    return res.status(200).json({
      success: true,
      orders,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone address companyName')
      .populate('createdBy', 'name email role')
      .populate('items.product', 'name sku imageUrl quantity');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (err) {
    next(err);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const { customer: customerId, items, notes } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(400).json({
        success: false,
        message: 'Selected Customer does not exist.',
      });
    }

    if (!items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one product item.',
      });
    }

    // Validate products and check stock availability
    const preparedItems = [];
    let calculatedTotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product ID '${item.product}' not found.`,
        });
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient inventory for product '${product.name}' (SKU: ${product.sku}). Available: ${product.quantity}, Requested: ${item.quantity}.`,
        });
      }

      const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : product.sellingPrice;
      const subtotal = unitPrice * Number(item.quantity);
      calculatedTotal += subtotal;

      preparedItems.push({
        product: product._id,
        productName: product.name,
        sku: product.sku,
        quantity: Number(item.quantity),
        unitPrice,
        subtotal,
      });
    }

    const orderNumber = await generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      customer: customer._id,
      items: preparedItems,
      totalAmount: calculatedTotal,
      status: 'Pending',
      notes: notes || '',
      createdBy: req.user._id,
    });

    // Deduct stock and record movement for each item
    for (const item of preparedItems) {
      const product = await Product.findById(item.product);
      const previousStock = product.quantity;
      const newStock = previousStock - item.quantity;
      product.quantity = newStock;
      await product.save();

      await StockMovement.create({
        product: product._id,
        movementType: 'OUT',
        quantity: item.quantity,
        previousStock,
        newStock,
        reason: `Order placed - ${orderNumber}`,
        referenceNumber: orderNumber,
        performedBy: req.user._id,
      });
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'name email companyName')
      .populate('createdBy', 'name');

    return res.status(201).json({
      success: true,
      message: 'Order created and stock successfully deducted.',
      order: populatedOrder,
    });
  } catch (err) {
    next(err);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    const prevStatus = order.status;

    if (prevStatus === status) {
      return res.status(200).json({
        success: true,
        message: `Order is already in '${status}' status.`,
        order,
      });
    }

    // If order was already cancelled, do not allow changing back directly
    if (prevStatus === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cancelled orders cannot be reopened. Please create a new order.',
      });
    }

    // If changing to Cancelled, restore deducted stock
    if (status === 'Cancelled') {
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          const previousStock = product.quantity;
          const newStock = previousStock + item.quantity;
          product.quantity = newStock;
          await product.save();

          await StockMovement.create({
            product: product._id,
            movementType: 'IN',
            quantity: item.quantity,
            previousStock,
            newStock,
            reason: `Restoration: Order ${order.orderNumber} cancelled (${reason || 'Customer cancellation'})`,
            referenceNumber: order.orderNumber,
            performedBy: req.user._id,
          });
        }
      }
    }

    order.status = status;
    if (reason) {
      order.notes = order.notes ? `${order.notes} | Status note: ${reason}` : `Status note: ${reason}`;
    }
    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('customer', 'name email companyName')
      .populate('createdBy', 'name');

    return res.status(200).json({
      success: true,
      message: `Order status updated to '${status}'.`,
      order: updatedOrder,
    });
  } catch (err) {
    next(err);
  }
};

const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    if (order.status !== 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Only cancelled orders can be purged from records.',
      });
    }

    await Order.findByIdAndDelete(order._id);

    return res.status(200).json({
      success: true,
      message: 'Order deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder,
};

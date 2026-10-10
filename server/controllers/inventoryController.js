const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');

const getInventoryOverview = async (req, res, next) => {
  try {
    const products = await Product.find()
      .populate('category', 'name')
      .populate('supplier', 'companyName')
      .sort({ quantity: 1 })
      .lean();

    let totalProducts = products.length;
    let totalStockUnits = 0;
    let totalPurchaseValuation = 0;
    let totalSellingValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const inventoryList = products.map((prod) => {
      totalStockUnits += prod.quantity;
      totalPurchaseValuation += prod.quantity * prod.purchasePrice;
      totalSellingValuation += prod.quantity * prod.sellingPrice;

      let status = 'In Stock';
      if (prod.quantity === 0) {
        status = 'Out of Stock';
        outOfStockCount++;
      } else if (prod.quantity <= prod.minStockLevel) {
        status = 'Low Stock';
        lowStockCount++;
      }

      return {
        ...prod,
        status,
        inventoryValue: prod.quantity * prod.purchasePrice,
      };
    });

    return res.status(200).json({
      success: true,
      summary: {
        totalProducts,
        totalStockUnits,
        totalPurchaseValuation,
        totalSellingValuation,
        lowStockCount,
        outOfStockCount,
      },
      inventory: inventoryList,
    });
  } catch (err) {
    next(err);
  }
};

const getStockMovements = async (req, res, next) => {
  try {
    const {
      product,
      movementType,
      user,
      startDate,
      endDate,
      page = 1,
      limit = 15,
    } = req.query;

    const query = {};

    if (product) {
      query.product = product;
    }

    if (movementType) {
      query.movementType = movementType;
    }

    if (user) {
      query.performedBy = user;
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
    const limitNum = Math.max(1, parseInt(limit, 10) || 15);
    const skip = (pageNum - 1) * limitNum;

    const [movements, totalCount] = await Promise.all([
      StockMovement.find(query)
        .populate('product', 'name sku imageUrl')
        .populate('performedBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      StockMovement.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    return res.status(200).json({
      success: true,
      movements,
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

const recordStockMovement = async (req, res, next) => {
  try {
    const { product: productId, movementType, quantity, reason, referenceNumber } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    const previousStock = product.quantity;
    let newStock = previousStock;

    if (movementType === 'IN') {
      newStock = previousStock + Number(quantity);
    } else if (movementType === 'OUT') {
      if (Number(quantity) > previousStock) {
        return res.status(400).json({
          success: false,
          message: `Cannot dispatch ${quantity} unit(s). Current available stock is only ${previousStock}.`,
        });
      }
      newStock = previousStock - Number(quantity);
    } else if (movementType === 'ADJUSTMENT') {
      // If adjustment, quantity in body can be delta or target
      // If req.body.isAbsolute is true, quantity is target stock
      if (req.body.isAbsolute) {
        newStock = Number(quantity);
        if (newStock < 0) {
          return res.status(400).json({
            success: false,
            message: 'Stock count cannot be adjusted to a negative value.',
          });
        }
      } else {
        // Delta adjustment (+ or -)
        const delta = req.body.adjustmentDirection === 'SUBTRACT' ? -Number(quantity) : Number(quantity);
        newStock = previousStock + delta;
        if (newStock < 0) {
          return res.status(400).json({
            success: false,
            message: `Negative stock prevented. Current stock is ${previousStock}.`,
          });
        }
      }
    }

    product.quantity = newStock;
    await product.save();

    const movement = await StockMovement.create({
      product: product._id,
      movementType,
      quantity: Math.abs(newStock - previousStock) || Number(quantity),
      previousStock,
      newStock,
      reason,
      referenceNumber: referenceNumber || `MOV-${Date.now().toString().slice(-6)}`,
      performedBy: req.user._id,
    });

    const populatedMovement = await StockMovement.findById(movement._id)
      .populate('product', 'name sku')
      .populate('performedBy', 'name email');

    return res.status(201).json({
      success: true,
      message: 'Stock movement recorded successfully.',
      movement: populatedMovement,
      product: {
        _id: product._id,
        name: product.name,
        sku: product.sku,
        quantity: product.quantity,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getInventoryOverview,
  getStockMovements,
  recordStockMovement,
};

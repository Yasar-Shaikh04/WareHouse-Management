const Product = require('../models/Product');
const Category = require('../models/Category');
const Supplier = require('../models/Supplier');
const StockMovement = require('../models/StockMovement');
const Order = require('../models/Order');

const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      supplier,
      stockStatus,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    // Search by name or SKU
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by Category
    if (category) {
      query.category = category;
    }

    // Filter by Supplier
    if (supplier) {
      query.supplier = supplier;
    }

    // Filter by Stock Status
    if (stockStatus === 'out-of-stock') {
      query.quantity = { $eq: 0 };
    } else if (stockStatus === 'low-stock') {
      query.$expr = {
        $and: [
          { $gt: ['$quantity', 0] },
          { $lte: ['$quantity', '$minStockLevel'] },
        ],
      };
    } else if (stockStatus === 'in-stock') {
      query.$expr = {
        $gt: ['$quantity', '$minStockLevel'],
      };
    }

    const sortOptions = {};
    const validSortFields = ['name', 'sku', 'sellingPrice', 'purchasePrice', 'quantity', 'createdAt'];
    const field = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    sortOptions[field] = sortOrder === 'asc' ? 1 : -1;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .populate('category', 'name')
        .populate('supplier', 'name companyName')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    return res.status(200).json({
      success: true,
      products,
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

const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name description')
      .populate('supplier', 'name companyName email phone address');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    const recentMovements = await StockMovement.find({ product: product._id })
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return res.status(200).json({
      success: true,
      product,
      recentMovements,
    });
  } catch (err) {
    next(err);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { sku, category, supplier, quantity = 0 } = req.body;

    const skuUpper = sku.toUpperCase().trim();
    const existingSku = await Product.findOne({ sku: skuUpper });
    if (existingSku) {
      return res.status(409).json({
        success: false,
        message: `Product with SKU '${skuUpper}' already exists.`,
      });
    }

    const [catExists, supExists] = await Promise.all([
      Category.findById(category),
      Supplier.findById(supplier),
    ]);

    if (!catExists) {
      return res.status(400).json({
        success: false,
        message: 'Selected Category does not exist.',
      });
    }

    if (!supExists) {
      return res.status(400).json({
        success: false,
        message: 'Selected Supplier does not exist.',
      });
    }

    const product = await Product.create({
      ...req.body,
      sku: skuUpper,
    });

    // If initial quantity is greater than zero, log initial stock movement
    if (quantity > 0) {
      await StockMovement.create({
        product: product._id,
        movementType: 'IN',
        quantity,
        previousStock: 0,
        newStock: quantity,
        reason: 'Initial stock intake on product creation',
        referenceNumber: `INIT-${product.sku}`,
        performedBy: req.user._id,
      });
    }

    const populatedProduct = await Product.findById(product._id)
      .populate('category', 'name')
      .populate('supplier', 'companyName');

    return res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      product: populatedProduct,
    });
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    const { sku, category, supplier } = req.body;

    if (sku && sku.toUpperCase().trim() !== product.sku) {
      const existingSku = await Product.findOne({ sku: sku.toUpperCase().trim() });
      if (existingSku) {
        return res.status(409).json({
          success: false,
          message: `Product with SKU '${sku.toUpperCase().trim()}' already exists.`,
        });
      }
      product.sku = sku.toUpperCase().trim();
    }

    if (category) {
      const catExists = await Category.findById(category);
      if (!catExists) {
        return res.status(400).json({ success: false, message: 'Selected Category does not exist.' });
      }
      product.category = category;
    }

    if (supplier) {
      const supExists = await Supplier.findById(supplier);
      if (!supExists) {
        return res.status(400).json({ success: false, message: 'Selected Supplier does not exist.' });
      }
      product.supplier = supplier;
    }

    const updateFields = ['name', 'description', 'purchasePrice', 'sellingPrice', 'minStockLevel', 'location', 'imageUrl'];
    updateFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    await product.save();

    const populatedProduct = await Product.findById(product._id)
      .populate('category', 'name')
      .populate('supplier', 'companyName');

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      product: populatedProduct,
    });
  } catch (err) {
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    // Check if product is in active orders
    const activeOrderCount = await Order.countDocuments({
      'items.product': product._id,
      status: { $in: ['Pending', 'Processing'] },
    });

    if (activeOrderCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete product '${product.name}' because it exists in ${activeOrderCount} active order(s).`,
      });
    }

    // Clean up related stock movements or keep records?
    // Deleting product should also remove or archive movements
    await StockMovement.deleteMany({ product: product._id });
    await Product.findByIdAndDelete(product._id);

    return res.status(200).json({
      success: true,
      message: 'Product and associated movements deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};

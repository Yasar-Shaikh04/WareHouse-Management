const Supplier = require('../models/Supplier');
const Product = require('../models/Product');

const getAllSuppliers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const suppliers = await Supplier.find(filter).sort({ companyName: 1 }).lean();

    const supplierIds = suppliers.map((s) => s._id);
    const productCounts = await Product.aggregate([
      { $match: { supplier: { $in: supplierIds } } },
      { $group: { _id: '$supplier', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    productCounts.forEach((item) => {
      countMap[item._id.toString()] = item.count;
    });

    const enriched = suppliers.map((s) => ({
      ...s,
      productCount: countMap[s._id.toString()] || 0,
    }));

    return res.status(200).json({
      success: true,
      count: enriched.length,
      suppliers: enriched,
    });
  } catch (err) {
    next(err);
  }
};

const getSupplierById = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found.',
      });
    }

    const products = await Product.find({ supplier: supplier._id })
      .populate('category', 'name')
      .lean();

    return res.status(200).json({
      success: true,
      supplier,
      products,
    });
  } catch (err) {
    next(err);
  }
};

const createSupplier = async (req, res, next) => {
  try {
    const { name, companyName, email, phone, address, gstin, documentUrl } = req.body;

    const supplier = await Supplier.create({
      name,
      companyName,
      email,
      phone,
      address,
      gstin: gstin || '',
      documentUrl: documentUrl || null,
    });

    return res.status(201).json({
      success: true,
      message: 'Supplier created successfully.',
      supplier,
    });
  } catch (err) {
    next(err);
  }
};

const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found.',
      });
    }

    Object.assign(supplier, req.body);
    await supplier.save();

    return res.status(200).json({
      success: true,
      message: 'Supplier updated successfully.',
      supplier,
    });
  } catch (err) {
    next(err);
  }
};

const deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found.',
      });
    }

    // Referential integrity check
    const linkedProductsCount = await Product.countDocuments({ supplier: supplier._id });
    if (linkedProductsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete supplier '${supplier.companyName}' because ${linkedProductsCount} product(s) are supplied by them. Please reassign or delete these products first.`,
      });
    }

    await Supplier.findByIdAndDelete(supplier._id);

    return res.status(200).json({
      success: true,
      message: 'Supplier deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};

const Category = require('../models/Category');
const Product = require('../models/Product');

const getAllCategories = async (req, res, next) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const categories = await Category.find(filter).sort({ name: 1 }).lean();

    // Attach product count for each category
    const categoryIds = categories.map((c) => c._id);
    const productCounts = await Product.aggregate([
      { $match: { category: { $in: categoryIds } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    productCounts.forEach((item) => {
      countMap[item._id.toString()] = item.count;
    });

    const enriched = categories.map((cat) => ({
      ...cat,
      productCount: countMap[cat._id.toString()] || 0,
    }));

    return res.status(200).json({
      success: true,
      count: enriched.length,
      categories: enriched,
    });
  } catch (err) {
    next(err);
  }
};

const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    const products = await Product.find({ category: category._id })
      .select('sku name purchasePrice sellingPrice quantity minStockLevel')
      .lean();

    return res.status(200).json({
      success: true,
      category,
      products,
    });
  } catch (err) {
    next(err);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, description, imageUrl } = req.body;

    const existing = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Category with name '${name}' already exists.`,
      });
    }

    const category = await Category.create({
      name,
      description,
      imageUrl,
    });

    return res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      category,
    });
  } catch (err) {
    next(err);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { name, description, imageUrl } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    if (name && name.toLowerCase() !== category.name.toLowerCase()) {
      const existing = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Another category named '${name}' already exists.`,
        });
      }
    }

    category.name = name || category.name;
    category.description = description !== undefined ? description : category.description;
    if (imageUrl !== undefined) category.imageUrl = imageUrl;
    await category.save();

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully.',
      category,
    });
  } catch (err) {
    next(err);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    // Referential integrity check
    const linkedProductsCount = await Product.countDocuments({ category: category._id });
    if (linkedProductsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category '${category.name}' because ${linkedProductsCount} product(s) are currently associated with it. Please reassign those products first.`,
      });
    }

    await Category.findByIdAndDelete(category._id);

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};

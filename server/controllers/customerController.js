const Customer = require('../models/Customer');
const Order = require('../models/Order');

const getAllCustomers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
      ];
    }

    const customers = await Customer.find(filter).sort({ name: 1 }).lean();

    // Attach order counts for customers
    const customerIds = customers.map((c) => c._id);
    const orderCounts = await Order.aggregate([
      { $match: { customer: { $in: customerIds } } },
      { $group: { _id: '$customer', count: { $sum: 1 }, totalSpent: { $sum: '$totalAmount' } } },
    ]);

    const orderMap = {};
    orderCounts.forEach((item) => {
      orderMap[item._id.toString()] = {
        orderCount: item.count,
        totalSpent: item.totalSpent,
      };
    });

    const enriched = customers.map((c) => ({
      ...c,
      orderCount: orderMap[c._id.toString()]?.orderCount || 0,
      totalSpent: orderMap[c._id.toString()]?.totalSpent || 0,
    }));

    return res.status(200).json({
      success: true,
      count: enriched.length,
      customers: enriched,
    });
  } catch (err) {
    next(err);
  }
};

const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    const orders = await Order.find({ customer: customer._id })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name')
      .lean();

    return res.status(200).json({
      success: true,
      customer,
      orders,
    });
  } catch (err) {
    next(err);
  }
};

const createCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.create(req.body);
    return res.status(201).json({
      success: true,
      message: 'Customer created successfully.',
      customer,
    });
  } catch (err) {
    next(err);
  }
};

const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    Object.assign(customer, req.body);
    await customer.save();

    return res.status(200).json({
      success: true,
      message: 'Customer updated successfully.',
      customer,
    });
  } catch (err) {
    next(err);
  }
};

const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    const orderCount = await Order.countDocuments({ customer: customer._id });
    if (orderCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete customer '${customer.name}' because they have ${orderCount} existing order(s).`,
      });
    }

    await Customer.findByIdAndDelete(customer._id);

    return res.status(200).json({
      success: true,
      message: 'Customer deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};

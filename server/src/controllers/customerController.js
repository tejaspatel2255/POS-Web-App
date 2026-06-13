const Customer = require('../models/Customer');
const Order = require('../models/Order');

const getCustomers = async (req, res) => {
  const { search } = req.query;
  const filter = { outlet_id: req.user.outlet_id };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  try {
    const customers = await Customer.find(filter);
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customers', error: error.message });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, outlet_id: req.user.outlet_id });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Get order history
    const orders = await Order.find({ customer_id: customer._id, outlet_id: req.user.outlet_id })
      .populate('cashier_id')
      .sort({ createdAt: -1 });

    const totalSpent = orders
      .filter((o) => o.status === 'completed')
      .reduce((sum, o) => sum + o.total, 0);

    const visitCount = orders.filter((o) => o.status === 'completed').length;

    res.status(200).json({
      customer,
      totalSpent,
      visitCount,
      purchaseHistory: orders,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customer profile', error: error.message });
  }
};

const createCustomer = async (req, res) => {
  const { name, phone, email, loyalty_points } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ message: 'Name and phone number are required' });
  }

  try {
    const customer = new Customer({
      name,
      phone,
      email: email || '',
      loyalty_points: loyalty_points || 0,
      outlet_id: req.user.outlet_id,
    });

    await customer.save();
    res.status(201).json(customer);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A customer with this phone number already exists in this outlet' });
    }
    res.status(500).json({ message: 'Error creating customer', error: error.message });
  }
};

const updateCustomer = async (req, res) => {
  const { name, phone, email, loyalty_points } = req.body;
  try {
    const customer = await Customer.findOne({ _id: req.params.id, outlet_id: req.user.outlet_id });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (name) customer.name = name;
    if (phone) customer.phone = phone;
    if (email !== undefined) customer.email = email;
    if (loyalty_points !== undefined) customer.loyalty_points = loyalty_points;

    await customer.save();
    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Error updating customer', error: error.message });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({ _id: req.params.id, outlet_id: req.user.outlet_id });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Set customer_id to null in their orders so orders remain valid
    await Order.updateMany({ customer_id: req.params.id }, { customer_id: null });

    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting customer', error: error.message });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};

const PaymentMethod = require('../models/PaymentMethod');

const getPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = await PaymentMethod.find({ outlet_id: req.user.outlet_id });
    res.status(200).json(paymentMethods);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payment methods', error: error.message });
  }
};

const createPaymentMethod = async (req, res) => {
  const { name, enabled } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Payment method name is required' });
  }

  try {
    const paymentMethod = new PaymentMethod({
      name,
      enabled: enabled !== undefined ? enabled : true,
      outlet_id: req.user.outlet_id,
    });
    await paymentMethod.save();
    res.status(201).json(paymentMethod);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A payment method with this name already exists in this outlet' });
    }
    res.status(500).json({ message: 'Error creating payment method', error: error.message });
  }
};

const updatePaymentMethod = async (req, res) => {
  const { name, enabled } = req.body;
  try {
    const paymentMethod = await PaymentMethod.findOne({ _id: req.params.id, outlet_id: req.user.outlet_id });
    if (!paymentMethod) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    if (name) paymentMethod.name = name;
    if (enabled !== undefined) paymentMethod.enabled = enabled;

    await paymentMethod.save();
    res.status(200).json(paymentMethod);
  } catch (error) {
    res.status(500).json({ message: 'Error updating payment method', error: error.message });
  }
};

const deletePaymentMethod = async (req, res) => {
  try {
    const paymentMethod = await PaymentMethod.findOne({ _id: req.params.id, outlet_id: req.user.outlet_id });
    if (!paymentMethod) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    // Prevent deleting core methods like 'Cash' if they are standard, or just let them delete custom ones
    const coreMethods = ['cash', 'card', 'upi', 'wallet'];
    if (coreMethods.includes(paymentMethod.name.toLowerCase())) {
      return res.status(400).json({ message: 'Core payment methods cannot be deleted, but they can be disabled' });
    }

    await PaymentMethod.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Payment method deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting payment method', error: error.message });
  }
};

module.exports = {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
};

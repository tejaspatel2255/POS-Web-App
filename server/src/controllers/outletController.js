const Outlet = require('../models/Outlet');
const PaymentMethod = require('../models/PaymentMethod');
const StockAdjustmentReason = require('../models/StockAdjustmentReason');

const getOutlets = async (req, res) => {
  try {
    const outlets = await Outlet.find();
    res.status(200).json(outlets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching outlets', error: error.message });
  }
};

const createOutlet = async (req, res) => {
  const { name, address, tax_number, receiptSettings } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Outlet name is required' });
  }

  try {
    const outlet = new Outlet({ name, address, tax_number, receiptSettings });
    await outlet.save();

    // Seed default payment methods for this new outlet
    const methods = ['Cash', 'Card', 'UPI', 'Wallet'];
    for (const method of methods) {
      await PaymentMethod.create({
        outlet_id: outlet._id,
        name: method,
        enabled: true,
      });
    }

    // Seed default stock adjustment reasons for this new outlet
    const reasons = ['Damaged', 'Theft', 'Correction', 'Restock'];
    for (const reason of reasons) {
      await StockAdjustmentReason.create({
        outlet_id: outlet._id,
        label: reason,
      });
    }

    res.status(201).json(outlet);
  } catch (error) {
    res.status(500).json({ message: 'Error creating outlet', error: error.message });
  }
};

const updateOutlet = async (req, res) => {
  try {
    const outlet = await Outlet.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!outlet) {
      return res.status(404).json({ message: 'Outlet not found' });
    }
    res.status(200).json(outlet);
  } catch (error) {
    res.status(500).json({ message: 'Error updating outlet', error: error.message });
  }
};

const deleteOutlet = async (req, res) => {
  try {
    const outlet = await Outlet.findById(req.params.id);
    if (!outlet) {
      return res.status(404).json({ message: 'Outlet not found' });
    }

    await Outlet.findByIdAndDelete(req.params.id);
    // clean up associated payment methods & reasons
    await PaymentMethod.deleteMany({ outlet_id: req.params.id });
    await StockAdjustmentReason.deleteMany({ outlet_id: req.params.id });

    res.status(200).json({ message: 'Outlet deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting outlet', error: error.message });
  }
};

module.exports = {
  getOutlets,
  createOutlet,
  updateOutlet,
  deleteOutlet,
};

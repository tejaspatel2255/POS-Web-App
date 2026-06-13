const DiscountType = require('../models/DiscountType');

const getDiscountTypes = async (req, res) => {
  try {
    const discountTypes = await DiscountType.find({ outlet_id: req.user.outlet_id });
    res.status(200).json(discountTypes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching discount types', error: error.message });
  }
};

const createDiscountType = async (req, res) => {
  const { name, type, default_value, requires_approval } = req.body;
  if (!name || !type || default_value === undefined) {
    return res.status(400).json({ message: 'Name, type, and default_value are required' });
  }

  try {
    const discountType = new DiscountType({
      name,
      type,
      default_value,
      requires_approval: requires_approval || false,
      outlet_id: req.user.outlet_id,
    });
    await discountType.save();
    res.status(201).json(discountType);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A discount type with this name already exists in this outlet' });
    }
    res.status(500).json({ message: 'Error creating discount type', error: error.message });
  }
};

const updateDiscountType = async (req, res) => {
  const { name, type, default_value, requires_approval } = req.body;
  try {
    const discountType = await DiscountType.findOne({ _id: req.params.id, outlet_id: req.user.outlet_id });
    if (!discountType) {
      return res.status(404).json({ message: 'Discount type not found' });
    }

    if (name) discountType.name = name;
    if (type) discountType.type = type;
    if (default_value !== undefined) discountType.default_value = default_value;
    if (requires_approval !== undefined) discountType.requires_approval = requires_approval;

    await discountType.save();
    res.status(200).json(discountType);
  } catch (error) {
    res.status(500).json({ message: 'Error updating discount type', error: error.message });
  }
};

const deleteDiscountType = async (req, res) => {
  try {
    const discountType = await DiscountType.findOneAndDelete({ _id: req.params.id, outlet_id: req.user.outlet_id });
    if (!discountType) {
      return res.status(404).json({ message: 'Discount type not found' });
    }
    res.status(200).json({ message: 'Discount type deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting discount type', error: error.message });
  }
};

module.exports = {
  getDiscountTypes,
  createDiscountType,
  updateDiscountType,
  deleteDiscountType,
};

const StockAdjustmentReason = require('../models/StockAdjustmentReason');

const getReasons = async (req, res) => {
  try {
    const reasons = await StockAdjustmentReason.find({ outlet_id: req.user.outlet_id });
    res.status(200).json(reasons);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching adjustment reasons', error: error.message });
  }
};

const createReason = async (req, res) => {
  const { label } = req.body;
  if (!label) {
    return res.status(400).json({ message: 'Label is required' });
  }

  try {
    const reason = new StockAdjustmentReason({
      label,
      outlet_id: req.user.outlet_id,
    });
    await reason.save();
    res.status(201).json(reason);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This reason already exists in this outlet' });
    }
    res.status(500).json({ message: 'Error creating adjustment reason', error: error.message });
  }
};

const updateReason = async (req, res) => {
  const { label } = req.body;
  try {
    const reason = await StockAdjustmentReason.findOne({ _id: req.params.id, outlet_id: req.user.outlet_id });
    if (!reason) {
      return res.status(404).json({ message: 'Reason not found' });
    }

    if (label) reason.label = label;
    await reason.save();
    res.status(200).json(reason);
  } catch (error) {
    res.status(500).json({ message: 'Error updating adjustment reason', error: error.message });
  }
};

const deleteReason = async (req, res) => {
  try {
    const reason = await StockAdjustmentReason.findOneAndDelete({ _id: req.params.id, outlet_id: req.user.outlet_id });
    if (!reason) {
      return res.status(404).json({ message: 'Reason not found' });
    }
    res.status(200).json({ message: 'Adjustment reason deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting adjustment reason', error: error.message });
  }
};

module.exports = {
  getReasons,
  createReason,
  updateReason,
  deleteReason,
};

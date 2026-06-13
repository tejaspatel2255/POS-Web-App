const TaxRate = require('../models/TaxRate');

const getTaxRates = async (req, res) => {
  try {
    const taxRates = await TaxRate.find({ outlet_id: req.user.outlet_id });
    res.status(200).json(taxRates);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tax rates', error: error.message });
  }
};

const createTaxRate = async (req, res) => {
  const { name, percentage, description } = req.body;
  if (!name || percentage === undefined) {
    return res.status(400).json({ message: 'Name and percentage are required' });
  }

  try {
    const taxRate = new TaxRate({
      name,
      percentage,
      description,
      outlet_id: req.user.outlet_id,
    });
    await taxRate.save();
    res.status(201).json(taxRate);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A tax rate with this name already exists in this outlet' });
    }
    res.status(500).json({ message: 'Error creating tax rate', error: error.message });
  }
};

const updateTaxRate = async (req, res) => {
  const { name, percentage, description } = req.body;
  try {
    const taxRate = await TaxRate.findOne({ _id: req.params.id, outlet_id: req.user.outlet_id });
    if (!taxRate) {
      return res.status(404).json({ message: 'Tax rate not found' });
    }

    if (name) taxRate.name = name;
    if (percentage !== undefined) taxRate.percentage = percentage;
    if (description !== undefined) taxRate.description = description;

    await taxRate.save();
    res.status(200).json(taxRate);
  } catch (error) {
    res.status(500).json({ message: 'Error updating tax rate', error: error.message });
  }
};

const deleteTaxRate = async (req, res) => {
  try {
    const taxRate = await TaxRate.findOneAndDelete({ _id: req.params.id, outlet_id: req.user.outlet_id });
    if (!taxRate) {
      return res.status(404).json({ message: 'Tax rate not found' });
    }
    res.status(200).json({ message: 'Tax rate deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting tax rate', error: error.message });
  }
};

module.exports = {
  getTaxRates,
  createTaxRate,
  updateTaxRate,
  deleteTaxRate,
};

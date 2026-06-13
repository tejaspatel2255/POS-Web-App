const Settings = require('../models/Settings');
const Outlet = require('../models/Outlet');

const getSettings = async (req, res) => {
  try {
    const dbSettings = await Settings.find({ outlet_id: req.user.outlet_id });
    const outlet = await Outlet.findById(req.user.outlet_id);

    // Map database settings array to a nice key-value object
    const settingsObj = {};
    dbSettings.forEach((s) => {
      settingsObj[s.key] = s.value;
    });

    res.status(200).json({
      outlet,
      settings: settingsObj,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching settings', error: error.message });
  }
};

const updateSettings = async (req, res) => {
  const { settings } = req.body; // e.g. { loyalty_earn_rate: 1, loyalty_redeem_rate: 0.05 }
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ message: 'Invalid settings payload' });
  }

  try {
    const keys = Object.keys(settings);
    const bulkOps = keys.map((key) => ({
      updateOne: {
        filter: { key, outlet_id: req.user.outlet_id },
        update: { $set: { value: settings[key] } },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      await Settings.bulkWrite(bulkOps);
    }

    res.status(200).json({ message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating settings', error: error.message });
  }
};

const updateOutletProfile = async (req, res) => {
  const { name, address, tax_number, receiptSettings } = req.body;

  try {
    const outlet = await Outlet.findById(req.user.outlet_id);
    if (!outlet) {
      return res.status(404).json({ message: 'Outlet not found' });
    }

    if (name) outlet.name = name;
    if (address !== undefined) outlet.address = address;
    if (tax_number !== undefined) outlet.tax_number = tax_number;
    if (receiptSettings !== undefined) {
      outlet.receiptSettings = {
        ...outlet.receiptSettings.toObject(),
        ...receiptSettings,
      };
    }

    await outlet.save();
    res.status(200).json({ message: 'Outlet business profile updated successfully', outlet });
  } catch (error) {
    res.status(500).json({ message: 'Error updating business profile', error: error.message });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  updateOutletProfile,
};

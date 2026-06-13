const Inventory = require('../models/Inventory');
const InventoryLog = require('../models/InventoryLog');
const Product = require('../models/Product');
const Outlet = require('../models/Outlet');

const getInventory = async (req, res) => {
  try {
    const products = await Product.find({ outlet_id: req.user.outlet_id, status: 'active' })
      .populate('category_id');

    const inventoryData = await Promise.all(
      products.map(async (prod) => {
        let inv = await Inventory.findOne({ product_id: prod._id, outlet_id: req.user.outlet_id });
        if (!inv) {
          inv = await Inventory.create({ product_id: prod._id, outlet_id: req.user.outlet_id, quantity: 0 });
        }
        return {
          product: prod,
          quantity: inv.quantity,
          isLowStock: inv.quantity <= prod.stock_threshold,
        };
      })
    );

    res.status(200).json(inventoryData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inventory', error: error.message });
  }
};

const adjustStock = async (req, res) => {
  const { product_id, change, reason } = req.body;
  if (!product_id || change === undefined || !reason) {
    return res.status(400).json({ message: 'Product ID, change quantity, and reason are required' });
  }

  try {
    let inv = await Inventory.findOne({ product_id, outlet_id: req.user.outlet_id });
    if (!inv) {
      inv = new Inventory({ product_id, outlet_id: req.user.outlet_id, quantity: 0 });
    }

    inv.quantity += Number(change);
    if (inv.quantity < 0) {
      return res.status(400).json({ message: 'Stock quantity cannot drop below zero' });
    }

    await inv.save();

    // Log the adjustment
    const log = new InventoryLog({
      product_id,
      outlet_id: req.user.outlet_id,
      change: Number(change),
      reason,
      user_id: req.user._id,
    });
    await log.save();

    res.status(200).json({ message: 'Stock adjusted successfully', quantity: inv.quantity });
  } catch (error) {
    res.status(500).json({ message: 'Error adjusting stock', error: error.message });
  }
};

const getInventoryLogs = async (req, res) => {
  const { product_id, startDate, endDate, user_id } = req.query;
  const filter = { outlet_id: req.user.outlet_id };

  if (product_id) filter.product_id = product_id;
  if (user_id) filter.user_id = user_id;
  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) filter.timestamp.$gte = new Date(startDate);
    if (endDate) filter.timestamp.$lte = new Date(endDate);
  }

  try {
    const logs = await InventoryLog.find(filter)
      .populate('product_id')
      .populate('user_id')
      .sort({ timestamp: -1 });
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inventory logs', error: error.message });
  }
};

const transferStock = async (req, res) => {
  const { product_id, from_outlet_id, to_outlet_id, quantity } = req.body;
  const qty = Number(quantity);

  if (!product_id || !from_outlet_id || !to_outlet_id || !qty || qty <= 0) {
    return res.status(400).json({ message: 'Invalid transfer details' });
  }

  try {
    // 1. Check source stock
    const sourceInv = await Inventory.findOne({ product_id, outlet_id: from_outlet_id });
    if (!sourceInv || sourceInv.quantity < qty) {
      return res.status(400).json({ message: 'Insufficient stock in source outlet' });
    }

    // Get outlet details for logs
    const fromOutlet = await Outlet.findById(from_outlet_id);
    const toOutlet = await Outlet.findById(to_outlet_id);

    if (!fromOutlet || !toOutlet) {
      return res.status(404).json({ message: 'One or both outlets not found' });
    }

    // 2. Deduct from source
    sourceInv.quantity -= qty;
    await sourceInv.save();

    // 3. Add to target
    let targetInv = await Inventory.findOne({ product_id, outlet_id: to_outlet_id });
    if (!targetInv) {
      targetInv = new Inventory({ product_id, outlet_id: to_outlet_id, quantity: 0 });
    }
    targetInv.quantity += qty;
    await targetInv.save();

    // 4. Create logs for both outlets
    await InventoryLog.create({
      product_id,
      outlet_id: from_outlet_id,
      change: -qty,
      reason: `Transfer to ${toOutlet.name}`,
      user_id: req.user._id,
    });

    await InventoryLog.create({
      product_id,
      outlet_id: to_outlet_id,
      change: qty,
      reason: `Transfer from ${fromOutlet.name}`,
      user_id: req.user._id,
    });

    res.status(200).json({ message: 'Stock transferred successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error transferring stock', error: error.message });
  }
};

module.exports = {
  getInventory,
  adjustStock,
  getInventoryLogs,
  transferStock,
};

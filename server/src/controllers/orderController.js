const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const InventoryLog = require('../models/InventoryLog');
const Customer = require('../models/Customer');
const Settings = require('../models/Settings');

const getOrders = async (req, res) => {
  const { status, startDate, endDate } = req.query;
  const filter = { outlet_id: req.user.outlet_id };

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  try {
    const orders = await Order.find(filter)
      .populate('cashier_id')
      .populate('customer_id')
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, outlet_id: req.user.outlet_id })
      .populate('cashier_id')
      .populate('customer_id');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order details', error: error.message });
  }
};

const createOrder = async (req, res) => {
  const {
    customer_id,
    items,
    discounts,
    taxes,
    subtotal,
    discount_amount,
    tax_amount,
    total,
    payments,
    redeemedPoints, // Number of loyalty points redeemed
  } = req.body;

  if (!items || items.length === 0 || total === undefined) {
    return res.status(400).json({ message: 'Invalid order payload' });
  }

  try {
    // 1. Create order document
    const order = new Order({
      outlet_id: req.user.outlet_id,
      cashier_id: req.user._id,
      customer_id: customer_id || null,
      items,
      discounts: discounts || [],
      taxes: taxes || [],
      subtotal,
      discount_amount,
      tax_amount,
      total,
      payments,
      status: 'completed',
    });

    await order.save();

    // 2. Deduct inventory and log it
    for (const item of items) {
      let inv = await Inventory.findOne({ product_id: item.product_id, outlet_id: req.user.outlet_id });
      if (!inv) {
        inv = new Inventory({ product_id: item.product_id, outlet_id: req.user.outlet_id, quantity: 0 });
      }
      inv.quantity -= item.quantity;
      await inv.save();

      await InventoryLog.create({
        product_id: item.product_id,
        outlet_id: req.user.outlet_id,
        change: -item.quantity,
        reason: 'Sale',
        user_id: req.user._id,
      });
    }

    // 3. Handle loyalty points if customer is attached
    if (customer_id) {
      const customer = await Customer.findOne({ _id: customer_id, outlet_id: req.user.outlet_id });
      if (customer) {
        // Fetch loyalty rules from Settings
        const loyaltyEarnSetting = await Settings.findOne({ key: 'loyalty_earn_rate', outlet_id: req.user.outlet_id });
        const loyaltyRedeemSetting = await Settings.findOne({ key: 'loyalty_redeem_rate', outlet_id: req.user.outlet_id });
        
        const earnRate = loyaltyEarnSetting ? Number(loyaltyEarnSetting.value) : 1; // points per currency unit (e.g. 1 point per $1)
        const redeemRate = loyaltyRedeemSetting ? Number(loyaltyRedeemSetting.value) : 0.01; // value of 1 point (e.g. $0.01)

        let pointsAdjustment = 0;

        // Deduct redeemed points
        if (redeemedPoints && redeemedPoints > 0) {
          customer.loyalty_points = Math.max(0, customer.loyalty_points - redeemedPoints);
        }

        // Earn points based on order total
        // Formula: points = Math.floor(order total * earnRate)
        const pointsEarned = Math.floor(total * earnRate);
        customer.loyalty_points += pointsEarned;

        await customer.save();
      }
    }

    const populated = await Order.findById(order._id)
      .populate('cashier_id')
      .populate('customer_id');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Error processing sale', error: error.message });
  }
};

const refundOrder = async (req, res) => {
  const { reason, items_to_refund } = req.body; // items_to_refund optional for partial, if empty refund whole order
  
  try {
    const order = await Order.findOne({ _id: req.params.id, outlet_id: req.user.outlet_id });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === 'refunded') {
      return res.status(400).json({ message: 'Order has already been refunded' });
    }

    // Re-stock refunded items
    const items = items_to_refund || order.items;
    for (const refundItem of items) {
      const dbItem = order.items.find((i) => i.product_id.toString() === refundItem.product_id.toString());
      const qtyToRefund = refundItem.quantity || dbItem.quantity;

      let inv = await Inventory.findOne({ product_id: refundItem.product_id, outlet_id: req.user.outlet_id });
      if (!inv) {
        inv = new Inventory({ product_id: refundItem.product_id, outlet_id: req.user.outlet_id, quantity: 0 });
      }
      inv.quantity += qtyToRefund;
      await inv.save();

      await InventoryLog.create({
        product_id: refundItem.product_id,
        outlet_id: req.user.outlet_id,
        change: qtyToRefund,
        reason: 'Refund Restock',
        user_id: req.user._id,
      });
    }

    // Update order status
    order.status = 'refunded';
    order.refund_reason = reason || 'Customer Return';
    order.refunded_by = req.user._id;
    await order.save();

    // Deduct loyalty points if points were earned on this order
    if (order.customer_id) {
      const customer = await Customer.findOne({ _id: order.customer_id, outlet_id: req.user.outlet_id });
      if (customer) {
        const loyaltyEarnSetting = await Settings.findOne({ key: 'loyalty_earn_rate', outlet_id: req.user.outlet_id });
        const earnRate = loyaltyEarnSetting ? Number(loyaltyEarnSetting.value) : 1;
        const pointsEarned = Math.floor(order.total * earnRate);
        customer.loyalty_points = Math.max(0, customer.loyalty_points - pointsEarned);
        await customer.save();
      }
    }

    const populated = await Order.findById(order._id)
      .populate('cashier_id')
      .populate('customer_id');

    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Error refunding order', error: error.message });
  }
};

const voidOrder = async (req, res) => {
  const { reason } = req.body;
  try {
    const order = await Order.findOne({ _id: req.params.id, outlet_id: req.user.outlet_id });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === 'voided') {
      return res.status(400).json({ message: 'Order is already voided' });
    }

    // Re-stock all items
    for (const item of order.items) {
      let inv = await Inventory.findOne({ product_id: item.product_id, outlet_id: req.user.outlet_id });
      if (!inv) {
        inv = new Inventory({ product_id: item.product_id, outlet_id: req.user.outlet_id, quantity: 0 });
      }
      inv.quantity += item.quantity;
      await inv.save();

      await InventoryLog.create({
        product_id: item.product_id,
        outlet_id: req.user.outlet_id,
        change: item.quantity,
        reason: 'Void Restock',
        user_id: req.user._id,
      });
    }

    // Update status
    order.status = 'voided';
    order.void_reason = reason || 'Incorrect Sale Entry';
    order.voided_by = req.user._id;
    await order.save();

    // Deduct loyalty points if points were earned on this order
    if (order.customer_id) {
      const customer = await Customer.findOne({ _id: order.customer_id, outlet_id: req.user.outlet_id });
      if (customer) {
        const loyaltyEarnSetting = await Settings.findOne({ key: 'loyalty_earn_rate', outlet_id: req.user.outlet_id });
        const earnRate = loyaltyEarnSetting ? Number(loyaltyEarnSetting.value) : 1;
        const pointsEarned = Math.floor(order.total * earnRate);
        customer.loyalty_points = Math.max(0, customer.loyalty_points - pointsEarned);
        await customer.save();
      }
    }

    const populated = await Order.findById(order._id)
      .populate('cashier_id')
      .populate('customer_id');

    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Error voiding order', error: error.message });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  refundOrder,
  voidOrder,
};

const Shift = require('../models/Shift');
const Order = require('../models/Order');

const getCurrentShift = async (req, res) => {
  try {
    const shift = await Shift.findOne({
      cashier_id: req.user._id,
      outlet_id: req.user.outlet_id,
      status: 'open',
    }).populate('cashier_id');

    res.status(200).json(shift);
  } catch (error) {
    res.status(500).json({ message: 'Error checking current shift', error: error.message });
  }
};

const openShift = async (req, res) => {
  const { opening_cash } = req.body;
  if (opening_cash === undefined || opening_cash < 0) {
    return res.status(400).json({ message: 'Valid opening cash drawer balance is required' });
  }

  try {
    // Check if shift is already open
    const existing = await Shift.findOne({
      cashier_id: req.user._id,
      outlet_id: req.user.outlet_id,
      status: 'open',
    });

    if (existing) {
      return res.status(400).json({ message: 'You already have an active open shift', shift: existing });
    }

    const shift = new Shift({
      cashier_id: req.user._id,
      outlet_id: req.user.outlet_id,
      opening_cash: Number(opening_cash),
      status: 'open',
    });

    await shift.save();
    res.status(201).json(shift);
  } catch (error) {
    res.status(500).json({ message: 'Error opening shift', error: error.message });
  }
};

const closeShift = async (req, res) => {
  const { actual_closing_cash } = req.body;
  if (actual_closing_cash === undefined || actual_closing_cash < 0) {
    return res.status(400).json({ message: 'Actual closing cash balance is required' });
  }

  try {
    const shift = await Shift.findOne({
      cashier_id: req.user._id,
      outlet_id: req.user.outlet_id,
      status: 'open',
    });

    if (!shift) {
      return res.status(400).json({ message: 'No active open shift found to close' });
    }

    // Calculate expected closing cash from Cash payments in orders since shift started
    const orders = await Order.find({
      outlet_id: req.user.outlet_id,
      cashier_id: req.user._id,
      status: 'completed',
      createdAt: { $gte: shift.start_time },
    });

    let totalCashPayments = 0;
    orders.forEach((order) => {
      order.payments.forEach((p) => {
        if (p.method.toLowerCase() === 'cash') {
          totalCashPayments += p.amount;
        }
      });
    });

    const expectedClosingCash = shift.opening_cash + totalCashPayments;

    shift.end_time = new Date();
    shift.closing_cash = expectedClosingCash;
    shift.actual_closing_cash = Number(actual_closing_cash);
    shift.status = 'closed';

    await shift.save();
    res.status(200).json(shift);
  } catch (error) {
    res.status(500).json({ message: 'Error closing shift', error: error.message });
  }
};

const getShifts = async (req, res) => {
  try {
    // Managers/Admins can see all cashier shifts
    const shifts = await Shift.find({ outlet_id: req.user.outlet_id })
      .populate('cashier_id')
      .sort({ createdAt: -1 });
    res.status(200).json(shifts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shifts log', error: error.message });
  }
};

module.exports = {
  getCurrentShift,
  openShift,
  closeShift,
  getShifts,
};

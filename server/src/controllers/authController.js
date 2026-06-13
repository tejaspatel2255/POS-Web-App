const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Outlet = require('../models/Outlet');
const PaymentMethod = require('../models/PaymentMethod');
const StockAdjustmentReason = require('../models/StockAdjustmentReason');

const syncUser = async (req, res) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(400).json({ message: 'No authorization token provided' });
    }

    // Verify token using Supabase JWT Secret
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token signature' });
    }

    const email = decoded.email || req.body.email;
    const name = decoded.user_metadata?.name || req.body.name || email.split('@')[0];
    const supabaseUid = decoded.sub;

    // 1. Check if user already linked via supabaseUid
    let user = await User.findOne({ supabase_uid: supabaseUid }).populate('outlet_id');
    if (user) {
      return res.status(200).json({ user });
    }

    // 2. Check if first user overall
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      // Create default outlet
      let defaultOutlet = await Outlet.findOne({ name: 'Main Outlet' });
      if (!defaultOutlet) {
        defaultOutlet = new Outlet({
          name: 'Main Outlet',
          address: '123 Main Street',
          tax_number: 'TAX-FREE-100',
        });
        await defaultOutlet.save();

        // Populate default payment methods
        const methods = ['Cash', 'Card', 'UPI', 'Wallet'];
        for (const method of methods) {
          await PaymentMethod.create({
            outlet_id: defaultOutlet._id,
            name: method,
            enabled: true,
          });
        }

        // Populate default stock adjustment reasons
        const reasons = ['Damaged', 'Theft', 'Correction', 'Restock'];
        for (const reason of reasons) {
          await StockAdjustmentReason.create({
            outlet_id: defaultOutlet._id,
            label: reason,
          });
        }
      }

      // Create Admin User
      user = new User({
        supabase_uid: supabaseUid,
        name: name,
        email: email,
        role: 'admin',
        outlet_id: defaultOutlet._id,
        status: 'active',
      });
      await user.save();
      user = await User.findById(user._id).populate('outlet_id');
      return res.status(201).json({ user, message: 'First user registered as Admin and default outlet created.' });
    }

    // 3. Check if user was pre-created/invited by email
    user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      // Link the supabase_uid to the pre-created user
      user.supabase_uid = supabaseUid;
      if (req.body.name) user.name = req.body.name;
      user.status = 'active';
      await user.save();
      user = await User.findById(user._id).populate('outlet_id');
      return res.status(200).json({ user, message: 'Supabase account linked to existing staff record.' });
    }

    // 4. Deny self-signup if not invited
    return res.status(403).json({ 
      message: 'Signup is invite-only. Please ask your administrator to register your email.' 
    });

  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ message: 'Internal server error during sync', error: error.message });
  }
};

module.exports = { syncUser };

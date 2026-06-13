const User = require('../models/User');

const getUsers = async (req, res) => {
  try {
    const users = await User.find().populate('outlet_id');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

const createUser = async (req, res) => {
  const { name, email, role, outlet_id } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ message: 'Name, email, and role are required' });
  }

  try {
    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      role,
      outlet_id: outlet_id || null,
      status: 'active',
      supabase_uid: 'PENDING_' + Math.random().toString(36).substr(2, 9), // Placeholder until they sync
    });

    await newUser.save();
    const user = await User.findById(newUser._id).populate('outlet_id');
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error creating user invite', error: error.message });
  }
};

const updateUser = async (req, res) => {
  const { name, role, outlet_id, status } = req.body;

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't allow changing the last admin role
    if (user.role === 'admin' && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', status: 'active' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot demote the only active admin' });
      }
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (outlet_id !== undefined) user.outlet_id = outlet_id || null;
    if (status) user.status = status;

    await user.save();
    const updatedUser = await User.findById(user._id).populate('outlet_id');
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't allow deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the only admin' });
      }
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};

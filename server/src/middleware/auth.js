const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token using Supabase JWT Secret
      const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);

      // Find user in MongoDB using the sub (Supabase UID)
      const user = await User.findOne({ supabase_uid: decoded.sub }).populate('outlet_id');

      if (!user) {
        return res.status(401).json({ message: 'User not found in local database. Please sync.' });
      }

      if (user.status === 'inactive') {
        return res.status(403).json({ message: 'Account is deactivated' });
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      console.error('Auth verification error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Role authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role ${req.user.role} is not authorized to access this route` 
      });
    }
    
    next();
  };
};

module.exports = { protect, authorize };

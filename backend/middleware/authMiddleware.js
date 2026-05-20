const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT and attach user to request
const protect = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const token = auth.split(' ')[1];
    console.log('🔐 Token received:', token.substring(0, 20) + '...');
    console.log('🔑 JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token verified, userId:', decoded.id);
    
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      console.log('❌ User not found in DB');
      return res.status(401).json({ message: 'User not found' });
    }
    
    console.log('👤 User found:', user.email, 'Status:', user.status);
    
    if (user.status !== 'approved') {
      return res.status(403).json({ message: 'Account not approved or inactive' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('🚨 Auth error:', err.message);
    return res.status(401).json({ message: 'Token invalid or expired', error: err.message });
  }
};

// Role-based access control
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Access denied. Required role: ${roles.join(' or ')}`,
    });
  }
  next();
};

module.exports = { protect, authorize };
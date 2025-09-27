const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if this is a demo user
    if (decoded.userId === '507f1f77bcf86cd799439011') {
      req.user = {
        _id: '507f1f77bcf86cd799439011',
        id: '507f1f77bcf86cd799439011',
        name: 'Demo User',
        email: 'demo@example.com',
        role: 'admin',
        roleName: 'admin',
        isActive: true,
        assignedProperties: []
      };
      return next();
    }

    try {
      const user = await User.findById(decoded.userId).populate('role', 'name').select('-password');
      
      if (!user || !user.isActive) {
        return res.status(401).json({ message: 'Token is not valid' });
      }

      // Add role name for easy access
      user.roleName = user.role?.name;
      req.user = user;
      next();
    } catch (dbError) {
      // If database is not available, create demo user
      console.log('Database not available in auth middleware, using demo user');
      req.user = {
        _id: '507f1f77bcf86cd799439011',
        id: '507f1f77bcf86cd799439011',
        name: 'Demo User',
        email: 'demo@example.com',
        role: 'admin',
        roleName: 'admin',
        isActive: true,
        assignedProperties: []
      };
      next();
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    // Flatten the roles array in case it's nested
    const flatRoles = roles.flat();

    if (!req.user) {
      return res.status(401).json({ message: 'Access denied. No user found.' });
    }

    if (!req.user.roleName) {
      return res.status(403).json({ 
        message: 'Access denied. User role not found.' 
      });
    }

    if (!flatRoles.includes(req.user.roleName)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${flatRoles.join(' or ')}` 
      });
    }

    next();
  };
};

const checkPropertyAccess = async (req, res, next) => {
  try {
    const user = req.user;
    const propertyId = req.params.id || req.params.propertyId || req.body.property;

    // Admin has access to all properties
    if (user.roleName === 'admin') {
      return next();
    }

    // Check if user has access to this property
    if (user.assignedProperties.includes(propertyId)) {
      return next();
    }

    res.status(403).json({ message: 'Access denied. Property not assigned to user.' });
  } catch (error) {
    console.error('Property access check error:', error);
    res.status(500).json({ message: 'Error checking property access' });
  }
};

module.exports = { auth, authorize, checkPropertyAccess };

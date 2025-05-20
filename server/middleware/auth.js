const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

// Middleware to protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'store_rating_jwt_secret_key');

    // Set user to req.user
    req.user = await User.findByPk(decoded.id);
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Middleware to authorize by role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Check if user role is in the roles argument
    // Handle both single roles and arrays of roles
    const authorized = roles.some(role => {
      // If role is an array, check if user's role is in the array
      if (Array.isArray(role)) {
        return role.includes(req.user.role);
      } 
      // Otherwise, check if user's role matches the role string
      return req.user.role === role;
    });

    if (!authorized) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }

    next();
  };
}; 
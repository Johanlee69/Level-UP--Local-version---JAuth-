const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// Protect routes
const protect = async (req, res, next) => {
  let token;

  console.log('Auth Headers:', req.headers.authorization);
  
  // Get token from authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Extract token from Bearer token
    token = req.headers.authorization.split(' ')[1];
    console.log('Token from Authorization header:', token ? 'Found' : 'Not found');
  }
  // Allow token from cookie as fallback (if configured)
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log('Token from cookies:', token ? 'Found' : 'Not found');
  }

  // Check if token exists
  if (!token) {
    console.log('No token found in request');
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified, user ID:', decoded.id);
    // Find user by id
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      console.log('User not found for ID:', decoded.id);
      return next(new ErrorResponse('User not found', 404));
    }

    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('User not authenticated', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role '${req.user.role}' is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};

module.exports = {
  protect,
  authorize
}; 
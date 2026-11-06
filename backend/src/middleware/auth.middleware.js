/**
 * ResourceX – JWT Authentication Middleware
 */
'use strict';

const jwt  = require('jsonwebtoken');
const User = require('../models/User.model');

/**
 * Verifies Bearer JWT in Authorization header.
 * Attaches the full user document (without password) to req.user.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User account not found.' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Your account has been suspended. Contact campus administration.' });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err); // Passes JsonWebTokenError / TokenExpiredError to error handler
  }
}

/**
 * Restricts route to specific roles.
 * Must be used AFTER authenticate().
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
    }
    next();
  };
}

module.exports = { authenticate, authorize };

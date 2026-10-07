const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

// Verifies the JWT, loads the user, and attaches it to req.user.
// Every protected route depends on this running first.
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw ApiError.unauthorized('No authentication token provided');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Session expired, please log in again');
    }
    throw ApiError.unauthorized('Invalid authentication token');
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw ApiError.unauthorized('User account no longer exists');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated');
  }

  req.user = user;
  next();
});

module.exports = { protect };

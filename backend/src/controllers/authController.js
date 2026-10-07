const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { logAction } = require('../services/auditService');

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw ApiError.badRequest('Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated. Contact your administrator.');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = generateToken(user._id);
  await logAction({ actor: user, action: 'LOGIN', entityType: 'User', entityId: user._id });

  res.json({
    success: true,
    data: { user: user.toSafeObject(), token },
  });
});

// POST /api/auth/logout
// Stateless JWT — logout is handled client-side by discarding the token.
// We still expose this endpoint for a consistent API and to audit-log it.
const logout = asyncHandler(async (req, res) => {
  await logAction({ actor: req.user, action: 'LOGOUT', entityType: 'User', entityId: req.user._id });
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('department', 'name code');
  res.json({ success: true, data: user });
});

// PUT /api/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw ApiError.badRequest('Current and new password are required');
  }
  if (newPassword.length < 6) {
    throw ApiError.badRequest('New password must be at least 6 characters');
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.unauthorized('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password updated successfully' });
});

module.exports = { login, logout, getMe, changePassword };

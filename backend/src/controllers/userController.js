const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const { ROLES } = require('../config/constants');
const { logAction } = require('../services/auditService');

// GET /api/users
const getUsers = asyncHandler(async (req, res) => {
  const { role, department, search, isActive } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (department) filter.department = department;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(filter).populate('department', 'name').sort({ createdAt: -1 });
  res.json({ success: true, data: users, count: users.length });
});

// GET /api/users/technicians - helper for assignment dropdowns
const getTechnicians = asyncHandler(async (req, res) => {
  const technicians = await User.find({ role: ROLES.TECHNICIAN, isActive: true })
    .select('name email department')
    .populate('department', 'name');
  res.json({ success: true, data: technicians });
});

// GET /api/users/:id
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('department', 'name');
  if (!user) throw ApiError.notFound('User not found');
  res.json({ success: true, data: user });
});

// POST /api/users
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, department, phone } = req.body;
  if (!name || !email || !password || !role) {
    throw ApiError.badRequest('name, email, password, and role are required');
  }
  if (!Object.values(ROLES).includes(role)) {
    throw ApiError.badRequest('Invalid role');
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) throw ApiError.conflict('A user with this email already exists');

  const user = await User.create({ name, email, password, role, department, phone });
  await logAction({
    actor: req.user,
    action: 'USER_CREATED',
    entityType: 'User',
    entityId: user._id,
    metadata: { email, role },
  });

  res.status(201).json({ success: true, data: user.toSafeObject() });
});

// PUT /api/users/:id
const updateUser = asyncHandler(async (req, res) => {
  const { name, role, department, phone, isActive } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  if (name !== undefined) user.name = name;
  if (role !== undefined) {
    if (!Object.values(ROLES).includes(role)) throw ApiError.badRequest('Invalid role');
    user.role = role;
  }
  if (department !== undefined) user.department = department;
  if (phone !== undefined) user.phone = phone;
  if (isActive !== undefined) user.isActive = isActive;

  await user.save();
  await logAction({
    actor: req.user,
    action: 'USER_UPDATED',
    entityType: 'User',
    entityId: user._id,
    metadata: req.body,
  });

  res.json({ success: true, data: user.toSafeObject() });
});

// DELETE /api/users/:id - soft delete (deactivate) to preserve referential integrity
const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  user.isActive = false;
  await user.save();
  await logAction({
    actor: req.user,
    action: 'USER_DEACTIVATED',
    entityType: 'User',
    entityId: user._id,
  });

  res.json({ success: true, message: 'User deactivated' });
});

module.exports = { getUsers, getTechnicians, getUserById, createUser, updateUser, deactivateUser };

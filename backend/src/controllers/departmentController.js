const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Department = require('../models/Department');
const { logAction } = require('../services/auditService');

const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find().sort({ name: 1 });
  res.json({ success: true, data: departments });
});

const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, description } = req.body;
  if (!name) throw ApiError.badRequest('Department name is required');

  const dept = await Department.create({ name, code, description });
  await logAction({ actor: req.user, action: 'DEPARTMENT_CREATED', entityType: 'Department', entityId: dept._id });
  res.status(201).json({ success: true, data: dept });
});

const updateDepartment = asyncHandler(async (req, res) => {
  const dept = await Department.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!dept) throw ApiError.notFound('Department not found');
  await logAction({ actor: req.user, action: 'DEPARTMENT_UPDATED', entityType: 'Department', entityId: dept._id });
  res.json({ success: true, data: dept });
});

const deleteDepartment = asyncHandler(async (req, res) => {
  const dept = await Department.findByIdAndDelete(req.params.id);
  if (!dept) throw ApiError.notFound('Department not found');
  await logAction({ actor: req.user, action: 'DEPARTMENT_DELETED', entityType: 'Department', entityId: dept._id });
  res.json({ success: true, message: 'Department deleted' });
});

module.exports = { getDepartments, createDepartment, updateDepartment, deleteDepartment };

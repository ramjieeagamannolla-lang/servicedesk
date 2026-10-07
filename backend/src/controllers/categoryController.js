const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Category = require('../models/Category');
const { logAction } = require('../services/auditService');

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });
  res.json({ success: true, data: categories });
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, subcategories, description } = req.body;
  if (!name) throw ApiError.badRequest('Category name is required');

  const category = await Category.create({ name, subcategories, description });
  await logAction({ actor: req.user, action: 'CATEGORY_CREATED', entityType: 'Category', entityId: category._id });
  res.status(201).json({ success: true, data: category });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) throw ApiError.notFound('Category not found');
  await logAction({ actor: req.user, action: 'CATEGORY_UPDATED', entityType: 'Category', entityId: category._id });
  res.json({ success: true, data: category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!category) throw ApiError.notFound('Category not found');
  await logAction({ actor: req.user, action: 'CATEGORY_DELETED', entityType: 'Category', entityId: category._id });
  res.json({ success: true, message: 'Category deactivated' });
});

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };

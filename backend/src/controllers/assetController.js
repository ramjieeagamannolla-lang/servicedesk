const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Asset = require('../models/Asset');
const AssetHistory = require('../models/AssetHistory');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { generateAssetTag } = require('../utils/idGenerator');
const { logAction } = require('../services/auditService');

// GET /api/assets
const getAssets = asyncHandler(async (req, res) => {
  const { type, status, department, assignedTo, search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (department) filter.department = department;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (search) filter.$text = { $search: search };

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const assets = await Asset.find(filter)
    .populate('assignedTo', 'name email')
    .populate('department', 'name')
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  const total = await Asset.countDocuments(filter);

  res.json({
    success: true,
    data: assets,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

// GET /api/assets/:id
const getAssetById = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id)
    .populate('assignedTo', 'name email')
    .populate('department', 'name');
  if (!asset) throw ApiError.notFound('Asset not found');

  const history = await AssetHistory.find({ asset: asset._id })
    .populate('performedBy', 'name')
    .sort({ createdAt: -1 });

  const relatedTickets = await Ticket.find({ asset: asset._id })
    .select('ticketNumber title status priority createdAt')
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({ success: true, data: { asset, history, relatedTickets } });
});

// POST /api/assets
const createAsset = asyncHandler(async (req, res) => {
  const { name, type, brand, model, serialNumber, purchaseDate, warrantyExpiry, department, location, notes } = req.body;
  if (!name || !type) throw ApiError.badRequest('name and type are required');

  const assetTag = await generateAssetTag(type);

  const asset = await Asset.create({
    assetTag,
    name,
    type,
    brand,
    model,
    serialNumber,
    purchaseDate,
    warrantyExpiry,
    department,
    location,
    notes,
    status: 'AVAILABLE',
  });

  await AssetHistory.create({
    asset: asset._id,
    action: 'CREATED',
    performedBy: req.user._id,
    toValue: assetTag,
  });
  await logAction({ actor: req.user, action: 'ASSET_CREATED', entityType: 'Asset', entityId: asset._id, metadata: { assetTag } });

  res.status(201).json({ success: true, data: asset });
});

// PUT /api/assets/:id
const updateAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id);
  if (!asset) throw ApiError.notFound('Asset not found');

  const editable = ['name', 'brand', 'model', 'serialNumber', 'purchaseDate', 'warrantyExpiry', 'department', 'location', 'notes', 'status'];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) asset[field] = req.body[field];
  });

  await asset.save();
  await AssetHistory.create({
    asset: asset._id,
    action: 'UPDATED',
    performedBy: req.user._id,
  });
  await logAction({ actor: req.user, action: 'ASSET_UPDATED', entityType: 'Asset', entityId: asset._id, metadata: req.body });

  res.json({ success: true, data: asset });
});

// PATCH /api/assets/:id/assign
const assignAsset = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) throw ApiError.badRequest('userId is required');

  const asset = await Asset.findById(req.params.id);
  if (!asset) throw ApiError.notFound('Asset not found');
  if (asset.status === 'RETIRED' || asset.status === 'LOST') {
    throw ApiError.badRequest(`Cannot assign an asset with status ${asset.status}`);
  }

  const user = await User.findById(userId);
  if (!user) throw ApiError.badRequest('Invalid user');

  asset.assignedTo = user._id;
  asset.status = 'ASSIGNED';
  await asset.save();

  await AssetHistory.create({
    asset: asset._id,
    action: 'ASSIGNED',
    performedBy: req.user._id,
    toValue: user.name,
  });
  await logAction({ actor: req.user, action: 'ASSET_ASSIGNED', entityType: 'Asset', entityId: asset._id, metadata: { userId } });

  res.json({ success: true, data: asset });
});

// PATCH /api/assets/:id/unassign
const unassignAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id);
  if (!asset) throw ApiError.notFound('Asset not found');

  const previousUser = asset.assignedTo;
  asset.assignedTo = null;
  asset.status = 'AVAILABLE';
  await asset.save();

  await AssetHistory.create({
    asset: asset._id,
    action: 'UNASSIGNED',
    performedBy: req.user._id,
    fromValue: previousUser ? String(previousUser) : undefined,
  });
  await logAction({ actor: req.user, action: 'ASSET_UNASSIGNED', entityType: 'Asset', entityId: asset._id });

  res.json({ success: true, data: asset });
});

module.exports = { getAssets, getAssetById, createAsset, updateAsset, assignAsset, unassignAsset };

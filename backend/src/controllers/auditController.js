const asyncHandler = require('../utils/asyncHandler');
const AuditLog = require('../models/AuditLog');

// GET /api/audit-logs
const getAuditLogs = asyncHandler(async (req, res) => {
  const { entityType, action, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (entityType) filter.entityType = entityType;
  if (action) filter.action = action;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);

  const logs = await AuditLog.find(filter)
    .populate('actor', 'name role')
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  const total = await AuditLog.countDocuments(filter);

  res.json({
    success: true,
    data: logs,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

module.exports = { getAuditLogs };

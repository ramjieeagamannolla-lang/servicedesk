const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Ticket = require('../models/Ticket');
const Asset = require('../models/Asset');
const User = require('../models/User');
const KnowledgeArticle = require('../models/KnowledgeArticle');
const { ROLES } = require('../config/constants');

// GET /api/search?q=
const globalSearch = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    throw ApiError.badRequest('Query must be at least 2 characters');
  }
  const regex = { $regex: q, $options: 'i' };

  const ticketFilter =
    req.user.role === ROLES.EMPLOYEE
      ? { requester: req.user._id, $or: [{ title: regex }, { ticketNumber: regex }] }
      : { $or: [{ title: regex }, { ticketNumber: regex }] };

  const [tickets, assets, users, articles] = await Promise.all([
    Ticket.find(ticketFilter).select('ticketNumber title status priority').limit(5),
    req.user.role === ROLES.EMPLOYEE
      ? []
      : Asset.find({ $or: [{ name: regex }, { assetTag: regex }, { serialNumber: regex }] })
          .select('assetTag name type status')
          .limit(5),
    [ROLES.SYSTEM_ADMIN, ROLES.IT_MANAGER].includes(req.user.role)
      ? User.find({ $or: [{ name: regex }, { email: regex }] }).select('name email role').limit(5)
      : [],
    KnowledgeArticle.find({ status: 'PUBLISHED', title: regex }).select('title category').limit(5),
  ]);

  res.json({ success: true, data: { tickets, assets, users, articles } });
});

module.exports = { globalSearch };

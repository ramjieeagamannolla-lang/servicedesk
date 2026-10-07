const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Ticket = require('../models/Ticket');
const TicketComment = require('../models/TicketComment');
const WorkLog = require('../models/WorkLog');
const KnowledgeArticle = require('../models/KnowledgeArticle');
const User = require('../models/User');
const { ROLES, TICKET_TRANSITIONS, TICKET_CATEGORIES, TICKET_PRIORITY } = require('../config/constants');
const { classifyTicket } = require('../services/aiService');
const { calculateDeadlines, evaluateSlaStatus, minutesRemaining } = require('../services/slaService');
const { generateTicketNumber } = require('../utils/idGenerator');
const { notify, notifyMany } = require('../services/notificationService');
const { logAction } = require('../services/auditService');

// Finds up to 3 knowledge articles relevant to a classified ticket by
// matching category + a lightweight text search over title/tags/symptoms.
async function findRelatedArticles(category, text) {
  const articles = await KnowledgeArticle.find({
    status: 'PUBLISHED',
    $or: [{ category }, { $text: { $search: text } }],
  })
    .limit(3)
    .select('title category');
  return articles;
}

function scopeFilterForUser(user) {
  if (user.role === ROLES.SYSTEM_ADMIN || user.role === ROLES.IT_MANAGER) {
    return {}; // full visibility
  }
  if (user.role === ROLES.ASSET_MANAGER) {
    return {}; // needs visibility to see tickets tied to assets they manage
  }
  if (user.role === ROLES.TECHNICIAN) {
    // Assigned to them, or unassigned tickets they could pick up
    return { $or: [{ assignedTo: user._id }, { assignedTo: null }] };
  }
  // EMPLOYEE - only their own tickets
  return { requester: user._id };
}

function serializeTicketSla(ticket) {
  const evaluated = evaluateSlaStatus(ticket);
  return {
    ...ticket.sla,
    status: evaluated.status,
    escalationLevel: evaluated.escalationLevel,
    responseMinutesRemaining: minutesRemaining(ticket.sla?.responseDeadline),
    resolutionMinutesRemaining: minutesRemaining(ticket.sla?.resolutionDeadline),
  };
}

// GET /api/tickets
const getTickets = asyncHandler(async (req, res) => {
  const { status, priority, category, assignedTo, department, search, slaStatus, page = 1, limit = 20 } = req.query;

  const filter = { ...scopeFilterForUser(req.user) };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (department) filter.department = department;
  if (search) {
    filter.$text = { $search: search };
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  let tickets = await Ticket.find(filter)
    .populate('requester', 'name email')
    .populate('assignedTo', 'name email')
    .populate('department', 'name')
    .populate('asset', 'assetTag name')
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .lean();

  tickets = tickets.map((t) => ({ ...t, sla: serializeTicketSla(t) }));

  if (slaStatus) {
    tickets = tickets.filter((t) => t.sla.status === slaStatus);
  }

  const total = await Ticket.countDocuments(filter);

  res.json({
    success: true,
    data: tickets,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

// GET /api/tickets/:id
const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id)
    .populate('requester', 'name email department')
    .populate('assignedTo', 'name email')
    .populate('department', 'name')
    .populate('asset', 'assetTag name type status')
    .populate('ai.relatedArticles', 'title category')
    .populate('resolution.resolvedBy', 'name');

  if (!ticket) throw ApiError.notFound('Ticket not found');

  // Employees may only view their own tickets
  if (req.user.role === ROLES.EMPLOYEE && String(ticket.requester._id) !== String(req.user._id)) {
    throw ApiError.forbidden('You do not have access to this ticket');
  }

  const comments = await TicketComment.find({
    ticket: ticket._id,
    ...(req.user.role === ROLES.EMPLOYEE ? { isInternal: false } : {}),
  })
    .populate('author', 'name role')
    .sort({ createdAt: 1 });

  const workLogs = await WorkLog.find({ ticket: ticket._id })
    .populate('technician', 'name')
    .sort({ createdAt: 1 });

  const obj = ticket.toObject();
  obj.sla = serializeTicketSla(ticket);

  res.json({ success: true, data: { ticket: obj, comments, workLogs } });
});

// POST /api/tickets
const createTicket = asyncHandler(async (req, res) => {
  const { title, description, category, priority, department, asset, impact, urgency, attachments } = req.body;

  if (!title || !description) {
    throw ApiError.badRequest('Title and description are required');
  }

  // Run AI classification (never throws - guaranteed fallback inside)
  const ai = await classifyTicket({ title, description });

  const finalCategory = category && TICKET_CATEGORIES.includes(category) ? category : ai.category;
  const finalPriority = priority && TICKET_PRIORITY.includes(priority) ? priority : ai.priority;

  const relatedArticles = await findRelatedArticles(finalCategory, `${title} ${description}`);

  const deadlines = await calculateDeadlines(finalPriority);
  const ticketNumber = await generateTicketNumber();

  const ticket = await Ticket.create({
    ticketNumber,
    title,
    description,
    category: finalCategory,
    subcategory: ai.subcategory,
    priority: finalPriority,
    status: 'NEW',
    impact: impact || 'MEDIUM',
    urgency: urgency || 'HIGH',
    requester: req.user._id,
    department: department || req.user.department,
    asset: asset || null,
    attachments: attachments || [],
    ai: {
      predictedCategory: ai.category,
      predictedSubcategory: ai.subcategory,
      predictedPriority: ai.priority,
      confidence: ai.confidence,
      summary: ai.summary,
      suggestedSolution: ai.suggestedSolution,
      relatedArticles: relatedArticles.map((a) => a._id),
      source: ai.source,
      analyzedAt: new Date(),
    },
    sla: {
      responseDeadline: deadlines.responseDeadline,
      resolutionDeadline: deadlines.resolutionDeadline,
      status: 'SAFE',
      escalationLevel: 0,
    },
  });

  await logAction({
    actor: req.user,
    action: 'TICKET_CREATED',
    entityType: 'Ticket',
    entityId: ticket._id,
    metadata: { ticketNumber, category: finalCategory, priority: finalPriority, aiSource: ai.source },
  });
  await logAction({
    actor: req.user,
    action: 'AI_CLASSIFICATION',
    entityType: 'Ticket',
    entityId: ticket._id,
    metadata: { source: ai.source, confidence: ai.confidence },
  });

  // Notify IT managers of new high-priority tickets
  if (finalPriority === 'CRITICAL' || finalPriority === 'HIGH') {
    const managers = await User.find({ role: ROLES.IT_MANAGER, isActive: true }).select('_id');
    await notifyMany(
      managers.map((m) => m._id),
      `New ${finalPriority} ticket ${ticketNumber}: ${title}`,
      'GENERAL',
      ticket._id
    );
  }

  const populated = await Ticket.findById(ticket._id).populate('ai.relatedArticles', 'title category');
  const obj = populated.toObject();
  obj.sla = serializeTicketSla(populated);

  res.status(201).json({ success: true, data: obj });
});

// PATCH /api/tickets/:id/status
const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw ApiError.notFound('Ticket not found');

  const allowed = TICKET_TRANSITIONS[ticket.status] || [];
  if (!allowed.includes(status)) {
    throw ApiError.badRequest(
      `Cannot transition ticket from ${ticket.status} to ${status}. Allowed: ${allowed.join(', ') || 'none'}`
    );
  }

  // Only technicians/managers/admins can move a ticket through the working
  // states; employees can only confirm resolution or reopen (handled below).
  const staffRoles = [ROLES.TECHNICIAN, ROLES.IT_MANAGER, ROLES.SYSTEM_ADMIN];
  if (['TRIAGED', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_USER'].includes(status) && !staffRoles.includes(req.user.role)) {
    throw ApiError.forbidden('Only IT staff can update this ticket to that status');
  }

  const previousStatus = ticket.status;
  ticket.status = status;

  if (status === 'IN_PROGRESS' && !ticket.sla.respondedAt) {
    ticket.sla.respondedAt = new Date();
  }
  if (status === 'CLOSED') {
    ticket.closedAt = new Date();
  }

  const evaluated = evaluateSlaStatus(ticket);
  ticket.sla.status = evaluated.status;
  ticket.sla.escalationLevel = evaluated.escalationLevel;

  await ticket.save();
  await logAction({
    actor: req.user,
    action: 'TICKET_STATUS_CHANGED',
    entityType: 'Ticket',
    entityId: ticket._id,
    metadata: { from: previousStatus, to: status },
  });

  await notify(ticket.requester, `Ticket ${ticket.ticketNumber} status changed to ${status}`, 'GENERAL', ticket._id);

  res.json({ success: true, data: ticket });
});

// PATCH /api/tickets/:id/assign
const assignTicket = asyncHandler(async (req, res) => {
  const { technicianId } = req.body;
  if (!technicianId) throw ApiError.badRequest('technicianId is required');

  const technician = await User.findOne({ _id: technicianId, role: ROLES.TECHNICIAN, isActive: true });
  if (!technician) throw ApiError.badRequest('Invalid or inactive technician');

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw ApiError.notFound('Ticket not found');

  const previousAssignee = ticket.assignedTo;
  ticket.assignedTo = technician._id;
  if (ticket.status === 'NEW' || ticket.status === 'TRIAGED') {
    ticket.status = 'ASSIGNED';
  }
  await ticket.save();

  await logAction({
    actor: req.user,
    action: 'TICKET_ASSIGNED',
    entityType: 'Ticket',
    entityId: ticket._id,
    metadata: { from: previousAssignee, to: technician._id },
  });

  await notify(technician._id, `Ticket ${ticket.ticketNumber} assigned to you.`, 'ASSIGNMENT', ticket._id);

  res.json({ success: true, data: ticket });
});

// POST /api/tickets/:id/accept - technician self-assigns an unassigned ticket
const acceptTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw ApiError.notFound('Ticket not found');
  if (ticket.assignedTo) throw ApiError.conflict('Ticket is already assigned');

  ticket.assignedTo = req.user._id;
  ticket.status = 'ASSIGNED';
  await ticket.save();

  await logAction({ actor: req.user, action: 'TICKET_ACCEPTED', entityType: 'Ticket', entityId: ticket._id });
  res.json({ success: true, data: ticket });
});

// POST /api/tickets/:id/comments
const addComment = asyncHandler(async (req, res) => {
  const { message, isInternal } = req.body;
  if (!message) throw ApiError.badRequest('message is required');

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw ApiError.notFound('Ticket not found');

  const staffRoles = [ROLES.TECHNICIAN, ROLES.IT_MANAGER, ROLES.SYSTEM_ADMIN];
  const internal = Boolean(isInternal) && staffRoles.includes(req.user.role);

  const comment = await TicketComment.create({
    ticket: ticket._id,
    author: req.user._id,
    message,
    isInternal: internal,
  });
  await comment.populate('author', 'name role');

  if (!internal) {
    const notifyTarget = String(req.user._id) === String(ticket.requester) ? ticket.assignedTo : ticket.requester;
    await notify(notifyTarget, `New comment on ticket ${ticket.ticketNumber}`, 'COMMENT', ticket._id);
  }

  await logAction({ actor: req.user, action: 'TICKET_COMMENT_ADDED', entityType: 'Ticket', entityId: ticket._id });

  res.status(201).json({ success: true, data: comment });
});

// POST /api/tickets/:id/worklogs
const addWorkLog = asyncHandler(async (req, res) => {
  const { description, minutesSpent } = req.body;
  if (!description) throw ApiError.badRequest('description is required');

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw ApiError.notFound('Ticket not found');

  const workLog = await WorkLog.create({
    ticket: ticket._id,
    technician: req.user._id,
    description,
    minutesSpent: minutesSpent || 0,
  });
  await workLog.populate('technician', 'name');

  await logAction({ actor: req.user, action: 'WORKLOG_ADDED', entityType: 'Ticket', entityId: ticket._id });

  res.status(201).json({ success: true, data: workLog });
});

// POST /api/tickets/:id/resolve
const resolveTicket = asyncHandler(async (req, res) => {
  const { summary } = req.body;
  if (!summary) throw ApiError.badRequest('Resolution summary is required');

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw ApiError.notFound('Ticket not found');

  const allowed = TICKET_TRANSITIONS[ticket.status] || [];
  if (!allowed.includes('RESOLVED')) {
    throw ApiError.badRequest(`Cannot resolve a ticket in status ${ticket.status}`);
  }

  ticket.status = 'RESOLVED';
  ticket.resolution = {
    summary,
    resolvedBy: req.user._id,
    resolvedAt: new Date(),
    confirmedByRequester: false,
  };

  const evaluated = evaluateSlaStatus(ticket);
  ticket.sla.status = evaluated.status;

  await ticket.save();
  await logAction({ actor: req.user, action: 'TICKET_RESOLVED', entityType: 'Ticket', entityId: ticket._id });
  await notify(ticket.requester, `Ticket ${ticket.ticketNumber} has been resolved. Please confirm.`, 'RESOLUTION', ticket._id);

  res.json({ success: true, data: ticket });
});

// POST /api/tickets/:id/confirm - employee confirms resolution -> CLOSED
const confirmResolution = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw ApiError.notFound('Ticket not found');

  if (String(ticket.requester) !== String(req.user._id)) {
    throw ApiError.forbidden('Only the requester can confirm resolution');
  }
  if (ticket.status !== 'RESOLVED') {
    throw ApiError.badRequest('Ticket must be RESOLVED before it can be confirmed');
  }

  ticket.status = 'CLOSED';
  ticket.closedAt = new Date();
  ticket.resolution.confirmedByRequester = true;
  ticket.resolution.confirmedAt = new Date();
  await ticket.save();

  await logAction({ actor: req.user, action: 'TICKET_CLOSED', entityType: 'Ticket', entityId: ticket._id });
  res.json({ success: true, data: ticket });
});

// POST /api/tickets/:id/reopen
const reopenTicket = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw ApiError.notFound('Ticket not found');

  if (String(ticket.requester) !== String(req.user._id) && req.user.role === ROLES.EMPLOYEE) {
    throw ApiError.forbidden('Only the requester can reopen this ticket');
  }
  if (ticket.status !== 'RESOLVED') {
    throw ApiError.badRequest('Only resolved tickets can be reopened');
  }

  ticket.status = 'REOPENED';
  ticket.reopenCount += 1;
  await ticket.save();

  if (reason) {
    await TicketComment.create({
      ticket: ticket._id,
      author: req.user._id,
      message: `Ticket reopened: ${reason}`,
      isInternal: false,
    });
  }

  await logAction({ actor: req.user, action: 'TICKET_REOPENED', entityType: 'Ticket', entityId: ticket._id, metadata: { reason } });
  await notify(ticket.assignedTo, `Ticket ${ticket.ticketNumber} was reopened by the requester.`, 'GENERAL', ticket._id);

  res.json({ success: true, data: ticket });
});

module.exports = {
  getTickets,
  getTicketById,
  createTicket,
  updateStatus,
  assignTicket,
  acceptTicket,
  addComment,
  addWorkLog,
  resolveTicket,
  confirmResolution,
  reopenTicket,
};

const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const SLA = require('../models/SLA');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { ROLES } = require('../config/constants');
const { evaluateSlaStatus } = require('../services/slaService');
const { notify, notifyMany } = require('../services/notificationService');
const { logAction } = require('../services/auditService');

// GET /api/sla/config
const getSlaConfig = asyncHandler(async (req, res) => {
  const configs = await SLA.find().sort({ priority: 1 });
  res.json({ success: true, data: configs });
});

// PUT /api/sla/config/:priority
const updateSlaConfig = asyncHandler(async (req, res) => {
  const { responseMinutes, resolutionMinutes } = req.body;
  const config = await SLA.findOneAndUpdate(
    { priority: req.params.priority },
    { responseMinutes, resolutionMinutes },
    { new: true, upsert: true, runValidators: true }
  );
  await logAction({ actor: req.user, action: 'SLA_CONFIG_UPDATED', entityType: 'SLA', entityId: config._id, metadata: req.body });
  res.json({ success: true, data: config });
});

// POST /api/sla/check
// Recomputes SLA status for every open ticket and raises notifications /
// audit logs for newly AT_RISK or newly BREACHED tickets. Designed to be
// triggered on-demand (e.g. from the dashboard, or an external cron hitting
// this endpoint) rather than relying on a long-running background worker,
// since Render's free tier doesn't guarantee a persistent process.
const runSlaCheck = asyncHandler(async (req, res) => {
  const openTickets = await Ticket.find({
    status: { $nin: ['RESOLVED', 'CLOSED'] },
  });

  let atRiskCount = 0;
  let breachedCount = 0;
  const managers = await User.find({ role: ROLES.IT_MANAGER, isActive: true }).select('_id');
  const managerIds = managers.map((m) => m._id);

  for (const ticket of openTickets) {
    const previousStatus = ticket.sla.status;
    const evaluated = evaluateSlaStatus(ticket);

    if (evaluated.status !== previousStatus) {
      ticket.sla.status = evaluated.status;
      ticket.sla.escalationLevel = evaluated.escalationLevel;

      if (evaluated.status === 'AT_RISK') {
        atRiskCount += 1;
        await notify(ticket.assignedTo, `Ticket ${ticket.ticketNumber} is approaching its SLA deadline.`, 'SLA_AT_RISK', ticket._id);
      }
      if (evaluated.status === 'BREACHED') {
        breachedCount += 1;
        ticket.sla.breachNotifiedAt = new Date();
        await notify(ticket.assignedTo, `Ticket ${ticket.ticketNumber} has BREACHED its SLA.`, 'SLA_BREACHED', ticket._id);
        await notifyMany(managerIds, `SLA breached on ticket ${ticket.ticketNumber}.`, 'SLA_BREACHED', ticket._id);
        await logAction({
          actor: null,
          action: 'SLA_BREACHED',
          entityType: 'Ticket',
          entityId: ticket._id,
          metadata: { ticketNumber: ticket.ticketNumber, priority: ticket.priority },
        });
      }

      await ticket.save();
    }
  }

  res.json({
    success: true,
    message: `SLA check complete. ${openTickets.length} open tickets evaluated.`,
    data: { evaluated: openTickets.length, newlyAtRisk: atRiskCount, newlyBreached: breachedCount },
  });
});

module.exports = { getSlaConfig, updateSlaConfig, runSlaCheck };

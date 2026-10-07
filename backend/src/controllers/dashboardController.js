const asyncHandler = require('../utils/asyncHandler');
const Ticket = require('../models/Ticket');
const Asset = require('../models/Asset');
const User = require('../models/User');
const WorkLog = require('../models/WorkLog');
const { ROLES } = require('../config/constants');
const { evaluateSlaStatus } = require('../services/slaService');

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

// GET /api/dashboard/stats
// Single aggregated payload that feeds the whole dashboard (cards, charts).
// Scoped by department for IT Managers if they pass ?department=, otherwise
// full visibility for admin/manager, and own-tickets-only isn't meaningful
// for a dashboard so employees get a lighter subset on the frontend.
const getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const fourteenDaysAgo = new Date(todayStart.getTime() - 13 * 24 * 60 * 60 * 1000);

  const [
    totalTickets,
    openTickets,
    inProgressTickets,
    resolvedToday,
    totalAssets,
    activeTechnicians,
    allOpenForSla,
    categoryAgg,
    statusAgg,
    trendAgg,
    technicians,
  ] = await Promise.all([
    Ticket.countDocuments({}),
    Ticket.countDocuments({ status: { $in: ['NEW', 'TRIAGED', 'ASSIGNED'] } }),
    Ticket.countDocuments({ status: { $in: ['IN_PROGRESS', 'WAITING_FOR_USER'] } }),
    Ticket.countDocuments({ 'resolution.resolvedAt': { $gte: todayStart } }),
    Asset.countDocuments({}),
    User.countDocuments({ role: ROLES.TECHNICIAN, isActive: true }),
    Ticket.find({ status: { $nin: ['CLOSED'] } }).select('sla status createdAt resolution'),
    Ticket.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
    Ticket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Ticket.aggregate([
      { $match: { createdAt: { $gte: fourteenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    User.find({ role: ROLES.TECHNICIAN, isActive: true }).select('name'),
  ]);

  // SLA breakdown computed live (status can drift between periodic checks)
  let slaMet = 0;
  let slaAtRisk = 0;
  let slaBreached = 0;
  allOpenForSla.forEach((t) => {
    const evaluated = evaluateSlaStatus(t);
    if (evaluated.status === 'SAFE') slaMet += 1;
    else if (evaluated.status === 'AT_RISK') slaAtRisk += 1;
    else slaBreached += 1;
  });
  const closedSlaAgg = await Ticket.aggregate([
    { $match: { status: 'CLOSED' } },
    { $group: { _id: '$sla.status', count: { $sum: 1 } } },
  ]);
  closedSlaAgg.forEach((row) => {
    if (row._id === 'SAFE') slaMet += row.count;
    else if (row._id === 'BREACHED') slaBreached += row.count;
  });

  // Technician workload
  const workload = await Promise.all(
    technicians.map(async (tech) => {
      const [assigned, resolved, resolvedTickets, logs] = await Promise.all([
        Ticket.countDocuments({ assignedTo: tech._id, status: { $nin: ['RESOLVED', 'CLOSED'] } }),
        Ticket.countDocuments({ assignedTo: tech._id, status: { $in: ['RESOLVED', 'CLOSED'] } }),
        Ticket.find({ assignedTo: tech._id, status: { $in: ['RESOLVED', 'CLOSED'] }, 'resolution.resolvedAt': { $exists: true } })
          .select('createdAt resolution.resolvedAt sla.status'),
        WorkLog.countDocuments({ technician: tech._id }),
      ]);

      const compliant = resolvedTickets.filter((t) => t.sla?.status !== 'BREACHED').length;
      const slaCompliance = resolvedTickets.length ? Math.round((compliant / resolvedTickets.length) * 100) : 100;

      const avgResolutionMs =
        resolvedTickets.length > 0
          ? resolvedTickets.reduce((sum, t) => sum + (new Date(t.resolution.resolvedAt) - new Date(t.createdAt)), 0) /
            resolvedTickets.length
          : 0;

      return {
        technicianId: tech._id,
        name: tech.name,
        assigned,
        resolved,
        slaCompliance,
        avgResolutionHours: Math.round((avgResolutionMs / 3600000) * 10) / 10,
        workLogCount: logs,
      };
    })
  );

  res.json({
    success: true,
    data: {
      cards: {
        totalTickets,
        openTickets,
        inProgress: inProgressTickets,
        resolvedToday,
        slaAtRisk,
        slaBreached,
        totalAssets,
        activeTechnicians,
      },
      ticketTrend: trendAgg.map((r) => ({ date: r._id, count: r.count })),
      categories: categoryAgg.map((r) => ({ category: r._id, count: r.count })),
      statuses: statusAgg.map((r) => ({ status: r._id, count: r.count })),
      slaPerformance: { met: slaMet, atRisk: slaAtRisk, breached: slaBreached },
      technicianWorkload: workload,
    },
  });
});

module.exports = { getDashboardStats };

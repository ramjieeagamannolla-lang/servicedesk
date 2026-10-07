const SLA = require('../models/SLA');
const { DEFAULT_SLA_MINUTES } = require('../config/constants');

// Fraction of the way to the resolution deadline at which a ticket flips
// from SAFE to AT_RISK (e.g. 0.75 = last quarter of the window is "at risk").
const AT_RISK_THRESHOLD = 0.75;

async function getSlaTargets(priority) {
  const config = await SLA.findOne({ priority, isActive: true });
  if (config) {
    return { responseMinutes: config.responseMinutes, resolutionMinutes: config.resolutionMinutes };
  }
  // Config missing from DB (shouldn't normally happen post-seed) — fall back
  // to the hardcoded defaults so ticket creation never breaks.
  return DEFAULT_SLA_MINUTES[priority] || DEFAULT_SLA_MINUTES.MEDIUM;
}

async function calculateDeadlines(priority, fromDate = new Date()) {
  const { responseMinutes, resolutionMinutes } = await getSlaTargets(priority);
  return {
    responseDeadline: new Date(fromDate.getTime() + responseMinutes * 60000),
    resolutionDeadline: new Date(fromDate.getTime() + resolutionMinutes * 60000),
  };
}

/**
 * Given a ticket's SLA sub-document and current status, returns what the
 * sla.status and escalationLevel SHOULD be right now. Pure function — the
 * caller decides whether/how to persist it.
 */
function evaluateSlaStatus(ticket) {
  const { sla, status, createdAt } = ticket;
  if (!sla || !sla.resolutionDeadline) return { status: 'SAFE', escalationLevel: 0 };

  // Resolved/closed tickets keep whatever status they ended on (based on
  // whether they were resolved before/after the deadline).
  if (status === 'RESOLVED' || status === 'CLOSED') {
    const resolvedAt = ticket.resolution?.resolvedAt || new Date();
    if (resolvedAt > sla.resolutionDeadline) {
      return { status: 'BREACHED', escalationLevel: sla.escalationLevel || 1 };
    }
    return { status: 'SAFE', escalationLevel: sla.escalationLevel || 0 };
  }

  const now = new Date();
  const start = new Date(createdAt);
  const total = sla.resolutionDeadline - start;
  const elapsed = now - start;

  if (now > sla.resolutionDeadline) {
    return { status: 'BREACHED', escalationLevel: Math.max(sla.escalationLevel || 0, 2) };
  }
  if (total > 0 && elapsed / total >= AT_RISK_THRESHOLD) {
    return { status: 'AT_RISK', escalationLevel: Math.max(sla.escalationLevel || 0, 1) };
  }
  return { status: 'SAFE', escalationLevel: 0 };
}

function minutesRemaining(deadline) {
  if (!deadline) return null;
  return Math.round((new Date(deadline).getTime() - Date.now()) / 60000);
}

module.exports = { calculateDeadlines, evaluateSlaStatus, minutesRemaining, getSlaTargets };

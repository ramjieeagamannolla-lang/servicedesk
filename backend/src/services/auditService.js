const AuditLog = require('../models/AuditLog');

async function logAction({ actor, action, entityType, entityId, metadata }) {
  try {
    await AuditLog.create({
      actor: actor?._id || actor || null,
      actorName: actor?.name || 'System',
      action,
      entityType,
      entityId,
      metadata,
    });
  } catch (err) {
    // Audit logging must never break the primary request flow.
    console.error('[auditService] failed to write audit log:', err.message);
  }
}

module.exports = { logAction };

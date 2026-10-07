const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorName: String, // denormalized for display even if user is later deleted
    action: { type: String, required: true }, // e.g. TICKET_CREATED, LOGIN, SLA_BREACHED
    entityType: { type: String, required: true }, // Ticket, Asset, User, ...
    entityId: { type: mongoose.Schema.Types.ObjectId },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ actor: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

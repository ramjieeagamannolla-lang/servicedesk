const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['ASSIGNMENT', 'SLA_AT_RISK', 'SLA_BREACHED', 'RESOLUTION', 'COMMENT', 'GENERAL'],
      default: 'GENERAL',
    },
    relatedTicket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

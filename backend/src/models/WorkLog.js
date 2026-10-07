const mongoose = require('mongoose');

const workLogSchema = new mongoose.Schema(
  {
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
    technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true },
    minutesSpent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

workLogSchema.index({ ticket: 1, createdAt: 1 });

module.exports = mongoose.model('WorkLog', workLogSchema);

const mongoose = require('mongoose');
const { TICKET_PRIORITY } = require('../config/constants');

const slaSchema = new mongoose.Schema(
  {
    priority: {
      type: String,
      enum: TICKET_PRIORITY,
      required: true,
      unique: true,
    },
    responseMinutes: { type: Number, required: true },
    resolutionMinutes: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SLA', slaSchema);

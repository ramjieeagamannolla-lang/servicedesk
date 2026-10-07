const mongoose = require('mongoose');
const {
  TICKET_CATEGORIES,
  TICKET_PRIORITY,
  TICKET_STATUS,
  SLA_STATUS,
  IMPACT,
  URGENCY,
} = require('../config/constants');

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, required: true, unique: true }, // e.g. INC-1042
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },

    category: { type: String, enum: TICKET_CATEGORIES, required: true },
    subcategory: { type: String, trim: true },
    priority: { type: String, enum: TICKET_PRIORITY, required: true, default: 'MEDIUM' },
    status: { type: String, enum: TICKET_STATUS, required: true, default: 'NEW' },
    impact: { type: String, enum: IMPACT, default: 'MEDIUM' },
    urgency: { type: String, enum: URGENCY, default: 'MEDIUM' },

    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', default: null },

    attachments: [
      {
        fileName: String,
        fileUrl: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // AI analysis, populated right after creation (or via fallback classifier)
    ai: {
      predictedCategory: String,
      predictedSubcategory: String,
      predictedPriority: String,
      confidence: Number,
      summary: String,
      suggestedSolution: [String],
      relatedArticles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'KnowledgeArticle' }],
      source: { type: String, enum: ['ai', 'fallback'], default: 'fallback' },
      analyzedAt: Date,
    },

    // SLA tracking
    sla: {
      responseDeadline: Date,
      resolutionDeadline: Date,
      respondedAt: Date,
      status: { type: String, enum: SLA_STATUS, default: 'SAFE' },
      escalationLevel: { type: Number, default: 0 },
      breachNotifiedAt: Date,
    },

    resolution: {
      summary: String,
      resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      resolvedAt: Date,
      confirmedByRequester: { type: Boolean, default: false },
      confirmedAt: Date,
    },

    reopenCount: { type: Number, default: 0 },
    closedAt: Date,
  },
  { timestamps: true }
);

ticketSchema.index({ status: 1 });
ticketSchema.index({ priority: 1 });
ticketSchema.index({ requester: 1 });
ticketSchema.index({ assignedTo: 1 });
ticketSchema.index({ department: 1 });
ticketSchema.index({ 'sla.status': 1 });
ticketSchema.index({ title: 'text', description: 'text', ticketNumber: 'text' });

module.exports = mongoose.model('Ticket', ticketSchema);

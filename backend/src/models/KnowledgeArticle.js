const mongoose = require('mongoose');
const { TICKET_CATEGORIES } = require('../config/constants');

const knowledgeArticleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: TICKET_CATEGORIES, required: true },
    tags: [{ type: String, trim: true }],
    symptoms: [{ type: String, trim: true }],
    solution: { type: String, required: true }, // markdown/plain steps
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], default: 'PUBLISHED' },
    views: { type: Number, default: 0 },
    helpfulVotes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

knowledgeArticleSchema.index({ title: 'text', tags: 'text', symptoms: 'text', solution: 'text' });
knowledgeArticleSchema.index({ category: 1 });

module.exports = mongoose.model('KnowledgeArticle', knowledgeArticleSchema);

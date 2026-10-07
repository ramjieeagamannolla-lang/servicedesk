const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const KnowledgeArticle = require('../models/KnowledgeArticle');
const { logAction } = require('../services/auditService');

// GET /api/knowledge
const getArticles = asyncHandler(async (req, res) => {
  const { category, search, status } = req.query;
  const filter = {};
  if (category) filter.category = category;
  filter.status = status || 'PUBLISHED';
  if (search) filter.$text = { $search: search };

  const articles = await KnowledgeArticle.find(filter)
    .populate('author', 'name')
    .sort(search ? { score: { $meta: 'textScore' } } : { views: -1 });

  res.json({ success: true, data: articles });
});

// GET /api/knowledge/:id
const getArticleById = asyncHandler(async (req, res) => {
  const article = await KnowledgeArticle.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true }
  ).populate('author', 'name');
  if (!article) throw ApiError.notFound('Article not found');
  res.json({ success: true, data: article });
});

// POST /api/knowledge
const createArticle = asyncHandler(async (req, res) => {
  const { title, category, tags, symptoms, solution, status } = req.body;
  if (!title || !category || !solution) {
    throw ApiError.badRequest('title, category, and solution are required');
  }

  const article = await KnowledgeArticle.create({
    title,
    category,
    tags: tags || [],
    symptoms: symptoms || [],
    solution,
    author: req.user._id,
    status: status || 'PUBLISHED',
  });

  await logAction({ actor: req.user, action: 'KB_ARTICLE_CREATED', entityType: 'KnowledgeArticle', entityId: article._id });
  res.status(201).json({ success: true, data: article });
});

// PUT /api/knowledge/:id
const updateArticle = asyncHandler(async (req, res) => {
  const editable = ['title', 'category', 'tags', 'symptoms', 'solution', 'status'];
  const updates = {};
  editable.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const article = await KnowledgeArticle.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!article) throw ApiError.notFound('Article not found');

  await logAction({ actor: req.user, action: 'KB_ARTICLE_UPDATED', entityType: 'KnowledgeArticle', entityId: article._id });
  res.json({ success: true, data: article });
});

// POST /api/knowledge/:id/vote
const voteHelpful = asyncHandler(async (req, res) => {
  const article = await KnowledgeArticle.findByIdAndUpdate(
    req.params.id,
    { $inc: { helpfulVotes: 1 } },
    { new: true }
  );
  if (!article) throw ApiError.notFound('Article not found');
  res.json({ success: true, data: article });
});

// DELETE /api/knowledge/:id
const deleteArticle = asyncHandler(async (req, res) => {
  const article = await KnowledgeArticle.findByIdAndUpdate(req.params.id, { status: 'ARCHIVED' }, { new: true });
  if (!article) throw ApiError.notFound('Article not found');
  await logAction({ actor: req.user, action: 'KB_ARTICLE_ARCHIVED', entityType: 'KnowledgeArticle', entityId: article._id });
  res.json({ success: true, message: 'Article archived' });
});

module.exports = { getArticles, getArticleById, createArticle, updateArticle, voteHelpful, deleteArticle };

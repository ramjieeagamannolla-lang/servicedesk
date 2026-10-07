const express = require('express');
const {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  voteHelpful,
  deleteArticle,
} = require('../controllers/knowledgeController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

const authors = [ROLES.TECHNICIAN, ROLES.IT_MANAGER, ROLES.SYSTEM_ADMIN];

router.get('/', getArticles);
router.get('/:id', getArticleById);
router.post('/', authorize(...authors), createArticle);
router.put('/:id', authorize(...authors), updateArticle);
router.post('/:id/vote', voteHelpful);
router.delete('/:id', authorize(...authors), deleteArticle);

module.exports = router;

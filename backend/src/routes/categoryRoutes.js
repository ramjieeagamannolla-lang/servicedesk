const express = require('express');
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

router.get('/', getCategories);
router.post('/', authorize(ROLES.SYSTEM_ADMIN), createCategory);
router.put('/:id', authorize(ROLES.SYSTEM_ADMIN), updateCategory);
router.delete('/:id', authorize(ROLES.SYSTEM_ADMIN), deleteCategory);

module.exports = router;

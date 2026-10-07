const express = require('express');
const {
  getUsers,
  getTechnicians,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

router.get('/technicians', getTechnicians); // any authenticated staff can fetch this for assignment dropdowns
router.get('/', authorize(ROLES.SYSTEM_ADMIN, ROLES.IT_MANAGER), getUsers);
router.get('/:id', authorize(ROLES.SYSTEM_ADMIN, ROLES.IT_MANAGER), getUserById);
router.post('/', authorize(ROLES.SYSTEM_ADMIN), createUser);
router.put('/:id', authorize(ROLES.SYSTEM_ADMIN), updateUser);
router.delete('/:id', authorize(ROLES.SYSTEM_ADMIN), deactivateUser);

module.exports = router;

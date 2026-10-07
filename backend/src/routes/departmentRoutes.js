const express = require('express');
const {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

router.get('/', getDepartments); // needed broadly (ticket creation dropdown, etc.)
router.post('/', authorize(ROLES.SYSTEM_ADMIN), createDepartment);
router.put('/:id', authorize(ROLES.SYSTEM_ADMIN), updateDepartment);
router.delete('/:id', authorize(ROLES.SYSTEM_ADMIN), deleteDepartment);

module.exports = router;

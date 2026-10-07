const express = require('express');
const { getAuditLogs } = require('../controllers/auditController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);
router.get('/', authorize(ROLES.SYSTEM_ADMIN, ROLES.IT_MANAGER), getAuditLogs);

module.exports = router;

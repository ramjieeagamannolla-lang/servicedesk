const express = require('express');
const { getSlaConfig, updateSlaConfig, runSlaCheck } = require('../controllers/slaController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

router.get('/config', getSlaConfig);
router.put('/config/:priority', authorize(ROLES.SYSTEM_ADMIN, ROLES.IT_MANAGER), updateSlaConfig);
router.post('/check', authorize(ROLES.SYSTEM_ADMIN, ROLES.IT_MANAGER), runSlaCheck);

module.exports = router;

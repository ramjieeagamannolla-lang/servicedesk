const express = require('express');
const {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  assignAsset,
  unassignAsset,
} = require('../controllers/assetController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

const canManage = [ROLES.ASSET_MANAGER, ROLES.SYSTEM_ADMIN];

router.get('/', getAssets); // broadly readable (technicians/managers need this too)
router.get('/:id', getAssetById);
router.post('/', authorize(...canManage), createAsset);
router.put('/:id', authorize(...canManage), updateAsset);
router.patch('/:id/assign', authorize(...canManage), assignAsset);
router.patch('/:id/unassign', authorize(...canManage), unassignAsset);

module.exports = router;

const express = require('express');
const router = express.Router();
const { ActivityController } = require('../../controller/index');
const { authenticate, hasPermission } = require('../../middleware/auth');
const { PERMISSIONS } = require('../../config/constants');

router.use(authenticate);

router.get(
  '/',
  hasPermission([PERMISSIONS.VIEW_ACTIVITY]),
  ActivityController.getActivityLogs
);

module.exports = router;

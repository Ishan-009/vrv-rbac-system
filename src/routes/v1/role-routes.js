const express = require('express');
const router = express.Router();
const { RoleController } = require('../../controller/index');
const validate = require('../../middleware/validate');
const { createRoleSchema, updateRoleSchema } = require('../../schemas/schema');
const { authenticate, hasPermission } = require('../../middleware/auth');
const { PERMISSIONS } = require('../../config/constants');

router.use(authenticate);
router.use(hasPermission([PERMISSIONS.MANAGE_ROLES])); // All role routes require MANAGE_ROLES permission

router.get('/', RoleController.getRoles);
router.get('/:id', RoleController.getRoleById);
router.post('/', validate(createRoleSchema), RoleController.createRole);
router.put('/:id', validate(updateRoleSchema), RoleController.updateRole);
router.delete('/:id', RoleController.deleteRole);

module.exports = router;

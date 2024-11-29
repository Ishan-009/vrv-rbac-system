const express = require('express');
const router = express.Router();
const { UserController } = require('../../controller/index');
const validate = require('../../middleware/validate');
const { createUserSchema, updateUserSchema } = require('../../schemas/schema');
const { authenticate, hasPermission } = require('../../middleware/auth');
const { PERMISSIONS } = require('../../config/constants');

router.use(authenticate);

router.get(
  '/',
  hasPermission([PERMISSIONS.READ_USER]),
  UserController.getUsers
);
router.get(
  '/:id',
  hasPermission([PERMISSIONS.READ_USER]),
  UserController.getUserById
);
router.post(
  '/',
  hasPermission([PERMISSIONS.CREATE_USER]),
  validate(createUserSchema),
  UserController.createUser
);
router.put(
  '/:id',
  hasPermission([PERMISSIONS.UPDATE_USER]),
  validate(updateUserSchema),
  UserController.updateUser
);
router.delete(
  '/:id',
  hasPermission([PERMISSIONS.DELETE_USER]),
  UserController.deleteUser
);

module.exports = router;

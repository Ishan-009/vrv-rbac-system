const express = require('express');
const router = express.Router();
const { PostController } = require('../../controller/index');
const validate = require('../../middleware/validate');
const { createPostSchema, updatePostSchema } = require('../../schemas/schema');
const { authenticate, hasPermission } = require('../../middleware/auth');
const { PERMISSIONS } = require('../../config/constants');

router.use(authenticate);

router.get(
  '/',
  hasPermission([PERMISSIONS.READ_POST]),
  PostController.getPosts
);

router.get(
  '/:id',
  hasPermission([PERMISSIONS.READ_POST]),
  PostController.getPostById
);

router.post(
  '/',
  hasPermission([PERMISSIONS.CREATE_POST]),
  validate(createPostSchema),
  PostController.createPost
);

router.put(
  '/:id',
  hasPermission([PERMISSIONS.UPDATE_POST]),
  validate(updatePostSchema),
  PostController.updatePost
);

router.delete(
  '/:id',
  hasPermission([PERMISSIONS.DELETE_POST]),
  PostController.deletePost
);

module.exports = router;

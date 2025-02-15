const express = require('express');
const router = express.Router();
const { AuthController } = require('../../controller/index');
const validate = require('../../middleware/validate');
const { loginSchema, registerSchema } = require('../../schemas/schema');

router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
module.exports = router;

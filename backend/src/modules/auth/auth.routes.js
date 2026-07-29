const express = require('express');
const router = express.Router();

const validate = require('../../common/middleware/validate');
const authGuard = require('../../common/middleware/authGuard');
const { authRateLimiter } = require('../../common/middleware/rateLimiter');
const asyncHandler = require('../../common/utils/asyncHandler');

const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('./auth.schema');

const repository = require('./auth.repository');
const createAuthService = require('./auth.service');
const createAuthController = require('./auth.controller');

const service = createAuthService(repository);
const controller = createAuthController(service);

router.post('/register', authRateLimiter, validate(registerSchema), asyncHandler(controller.register));
router.post('/login', authRateLimiter, validate(loginSchema), asyncHandler(controller.login));
router.post('/logout', authGuard, asyncHandler(controller.logout));
router.post('/refresh', authRateLimiter, asyncHandler(controller.refresh));
router.get('/me', authGuard, asyncHandler(controller.me));
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), asyncHandler(controller.forgotPassword));
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), asyncHandler(controller.resetPassword));

module.exports = router;

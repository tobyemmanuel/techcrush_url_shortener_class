import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { validate } from '../middlewares/validationMiddleware.js';
import {
  changePasswordRules,
  emailOnlyRules,
  loginRules,
  registerRules,
  resetPasswordRules,
  verifyEmailRules,
} from '../utils/validation.js';

const router = Router();

router.post('/register', authLimiter, validate(registerRules), authController.register);
router.post('/login', authLimiter, validate(loginRules), authController.login);
router.post('/logout', authController.logout);

router.get('/verify-email', validate(verifyEmailRules), authController.verifyEmail);
router.post('/resend-verification', authLimiter, validate(emailOnlyRules), authController.resendVerification);

router.post('/forgot-password', authLimiter, validate(emailOnlyRules), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordRules), authController.resetPassword);

router.get('/me', authenticate, authController.me);
router.patch('/password', authenticate, validate(changePasswordRules), authController.changePassword);

export default router;

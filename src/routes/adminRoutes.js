import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { ROLES } from '../utils/constants.js';
import { listAllUrlsRules, listUsersRules, updateRoleRules, updateStatusRules } from '../utils/validation.js';

const router = Router();

// Only admins get past this line. Everything below is protected by it.
router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/stats', adminController.getStats);
router.get('/users', validate(listUsersRules), adminController.listUsers);
router.patch('/users/:id/role', validate(updateRoleRules), adminController.updateUserRole);
router.patch('/users/:id/status', validate(updateStatusRules), adminController.setUserStatus);
router.get('/urls', validate(listAllUrlsRules), adminController.listAllUrls);

export default router;

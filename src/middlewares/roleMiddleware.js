import { AppError } from '../utils/AppError.js';

/**
 * Role based access control (RBAC).
 * Always place it after `authenticate`, because it reads req.user.
 *
 *   router.use(authenticate, authorize(ROLES.ADMIN));
 */
export const authorize =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user) {
      throw new AppError('Authentication required. Please log in.', 401);
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError('You do not have permission to perform this action', 403);
    }
    next();
  };

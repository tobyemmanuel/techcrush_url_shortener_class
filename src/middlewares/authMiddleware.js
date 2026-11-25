import { env } from '../config/env.js';
import { User } from '../models/index.js';
import { verifyAuthToken } from '../services/tokenService.js';
import { AppError } from '../utils/AppError.js';

/**
 * Requires a valid login cookie. On success the full user record is on req.user.
 *
 * We load the user from the database on every request instead of trusting the
 * role stored in the token. That way a deactivated account, a changed role or a
 * changed password takes effect immediately.
 */
export const authenticate = async (req, res, next) => {
  const token = req.cookies?.[env.cookie.name];
  if (!token) {
    throw new AppError('Authentication required. Please log in.', 401);
  }

  let payload;
  try {
    payload = verifyAuthToken(token);
  } catch {
    throw new AppError('Your session is invalid or has expired. Please log in again.', 401);
  }

  const user = await User.findByPk(payload.sub);
  if (!user) {
    throw new AppError('Your session is invalid. Please log in again.', 401);
  }

  if (!user.isActive) {
    throw new AppError('This account has been deactivated.', 403);
  }

  // Tokens issued before the last password change are no longer accepted.
  if (user.passwordChangedAt && Math.floor(user.passwordChangedAt.getTime() / 1000) > payload.iat) {
    throw new AppError('Your password was changed. Please log in again.', 401);
  }

  req.user = user;
  next();
};

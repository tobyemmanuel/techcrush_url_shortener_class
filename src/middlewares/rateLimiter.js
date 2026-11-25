import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const build = (limit) =>
  rateLimit({
    windowMs: env.rateLimit.windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => !env.rateLimit.enabled,
    handler: (req, res, next) => next(new AppError('Too many requests. Please try again later.', 429)),
  });

/** General limit for the whole API. */
export const apiLimiter = build(env.rateLimit.max);

/** Much stricter limit for login, register and password endpoints to slow down guessing. */
export const authLimiter = build(env.rateLimit.authMax);

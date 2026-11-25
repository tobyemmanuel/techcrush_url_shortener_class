import { UniqueConstraintError, ValidationError as SequelizeValidationError } from 'sequelize';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

/** Runs when no route matched. */
export const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

/** Turns library errors into AppErrors so the client always gets the same response shape. */
const normalizeError = (err) => {
  if (err instanceof AppError) return err;

  // UniqueConstraintError is a kind of ValidationError, so it must be checked first.
  if (err instanceof UniqueConstraintError) {
    return new AppError(
      'A record with these details already exists',
      409,
      err.errors.map((e) => ({ field: e.path, message: `${e.path} is already in use` })),
    );
  }

  if (err instanceof SequelizeValidationError) {
    return new AppError(
      'Validation failed',
      400,
      err.errors.map((e) => ({ field: e.path, message: e.message })),
    );
  }

  // Errors raised by express.json() for bad request bodies.
  if (err.type === 'entity.parse.failed') return new AppError('Request body contains malformed JSON', 400);
  if (err.type === 'entity.too.large') return new AppError('Request body is too large', 413);

  return err;
};

// Express requires all four parameters here to treat this as an error handler.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const error = normalizeError(err);
  const statusCode = error.statusCode || 500;
  const isServerError = statusCode >= 500;

  const logMeta = { requestId: req.id, method: req.method, url: req.originalUrl, statusCode, userId: req.user?.id };
  if (isServerError) {
    logger.error(error.stack || error.message, logMeta);
  } else {
    logger.warn(error.message, logMeta);
  }

  const body = {
    success: false,
    // Never leak internal details of unexpected errors to clients.
    message: isServerError && !error.isOperational ? 'Something went wrong on our side' : error.message,
  };
  if (error.errors) body.errors = error.errors;
  if (!env.isProduction && isServerError) body.stack = error.stack;

  res.status(statusCode).json(body);
};

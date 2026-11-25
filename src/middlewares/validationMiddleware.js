import { validationResult } from 'express-validator';
import { AppError } from '../utils/AppError.js';

/**
 * Runs a list of express-validator chains, then stops the request with a 400
 * if any of them failed.
 *
 *   router.post('/register', validate(registerRules), authController.register);
 */
export const validate = (rules) => [
  ...rules,
  (req, res, next) => {
    const result = validationResult(req);
    if (result.isEmpty()) return next();

    const errors = result.array({ onlyFirstError: true }).map((error) => ({
      field: error.path,
      message: error.msg,
    }));

    return next(new AppError('Validation failed', 400, errors));
  },
];

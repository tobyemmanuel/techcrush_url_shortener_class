import { body, param, query } from 'express-validator';
import { env } from '../config/env.js';
import { CODE_PATTERN, MAX_PAGE_SIZE, ROLE_VALUES } from './constants.js';

/**
 * Validation rules, grouped by feature.
 * Each export is an array of express-validator chains that you pass to validate(...).
 */

const passwordRule = (field) =>
  body(field)
    .isString()
    .withMessage('Password is required')
    .bail()
    .isLength({ min: 8, max: 72 })
    .withMessage('Password must be between 8 and 72 characters')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain at least one letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number');

const emailRule = (field = 'email') =>
  body(field).trim().toLowerCase().isEmail().withMessage('Please provide a valid email address').isLength({ max: 255 });

const tokenRule = (location) =>
  location('token')
    .isString()
    .withMessage('Token is required')
    .bail()
    .matches(/^[a-f0-9]{64}$/)
    .withMessage('Token is malformed');

const uuidParam = (field = 'id') => param(field).isUUID().withMessage('Id must be a valid UUID');

const originalUrlRule = (rule) =>
  rule
    .isString()
    .withMessage('originalUrl must be a string')
    .bail()
    .trim()
    .isLength({ max: 2048 })
    .withMessage('originalUrl must be at most 2048 characters')
    .isURL({ protocols: ['http', 'https'], require_protocol: true, require_tld: env.isProduction })
    .withMessage('originalUrl must be a valid http or https URL')
    .custom((value) => {
      // Stop people from shortening our own short links, which could create redirect loops.
      if (new URL(value).host === new URL(env.baseUrl).host) {
        throw new Error('You cannot shorten a link that points to this service');
      }
      return true;
    });

const expiresAtRule = () =>
  body('expiresAt')
    // null is allowed and means "remove the expiry date".
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('expiresAt must be an ISO 8601 date, for example 2027-01-31T12:00:00Z')
    .bail()
    .custom((value) => {
      if (new Date(value) <= new Date()) throw new Error('expiresAt must be in the future');
      return true;
    });

const paginationRules = () => [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: MAX_PAGE_SIZE })
    .withMessage(`limit must be between 1 and ${MAX_PAGE_SIZE}`),
  query('q').optional().isString().trim().isLength({ max: 100 }).withMessage('q must be at most 100 characters'),
];

// ---------------------------------------------------------------- auth

export const registerRules = [
  body('name')
    .isString()
    .withMessage('Name is required')
    .bail()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  emailRule(),
  passwordRule('password'),
];

export const loginRules = [
  emailRule(),
  body('password').isString().notEmpty().withMessage('Password is required'),
];

export const emailOnlyRules = [emailRule()];

export const verifyEmailRules = [tokenRule(query)];

export const resetPasswordRules = [tokenRule(body), passwordRule('password')];

export const changePasswordRules = [
  body('currentPassword').isString().notEmpty().withMessage('Current password is required'),
  passwordRule('newPassword'),
  body('newPassword')
    .custom((value, { req }) => value !== req.body.currentPassword)
    .withMessage('New password must be different from the current password'),
];

// ---------------------------------------------------------------- urls

export const createUrlRules = [
  originalUrlRule(body('originalUrl')),
  body('customAlias')
    .optional()
    .isString()
    .trim()
    .matches(CODE_PATTERN)
    .withMessage('customAlias must be 3 to 32 characters: letters, numbers, hyphen or underscore'),
  expiresAtRule(),
];

export const updateUrlRules = [
  uuidParam(),
  originalUrlRule(body('originalUrl').optional()),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false').toBoolean(),
  expiresAtRule(),
];

export const urlIdRules = [uuidParam()];

export const statsRules = [
  uuidParam(),
  query('days').optional().isInt({ min: 1, max: 90 }).withMessage('days must be between 1 and 90'),
];

export const listUrlsRules = [
  ...paginationRules(),
  query('sortBy').optional().isIn(['createdAt', 'clickCount']).withMessage('sortBy must be createdAt or clickCount'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('order must be asc or desc'),
  query('isActive').optional().isBoolean().withMessage('isActive must be true or false'),
];

// ---------------------------------------------------------------- admin

export const listUsersRules = [
  ...paginationRules(),
  query('role').optional().isIn(ROLE_VALUES).withMessage(`role must be one of: ${ROLE_VALUES.join(', ')}`),
];

export const listAllUrlsRules = [...paginationRules()];

export const updateRoleRules = [
  uuidParam(),
  body('role').isIn(ROLE_VALUES).withMessage(`role must be one of: ${ROLE_VALUES.join(', ')}`),
];

export const updateStatusRules = [
  uuidParam(),
  body('isActive').isBoolean({ strict: true }).withMessage('isActive must be true or false'),
];

export const ROLES = Object.freeze({
  USER: 'user',
  ADMIN: 'admin',
});

export const ROLE_VALUES = Object.values(ROLES);

// Codes that must never be used as short codes because they clash with real routes.
export const RESERVED_CODES = Object.freeze([
  'api',
  'admin',
  'health',
  'login',
  'logout',
  'register',
  'static',
  'assets',
  'favicon',
  'robots',
  'sitemap',
  'docs',
  'status',
  'www',
]);

// Letters, numbers, underscore and hyphen, 3 to 32 characters.
export const CODE_PATTERN = /^[A-Za-z0-9_-]{3,32}$/;

export const GENERATED_CODE_LENGTH = 7;
export const MAX_CODE_GENERATION_ATTEMPTS = 5;

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

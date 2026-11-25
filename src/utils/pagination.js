import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './constants.js';

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
};

/** Turns ?page=2&limit=20 into { page, limit, offset } with safe bounds. */
export const parsePagination = (query = {}) => {
  const page = toPositiveInt(query.page, 1);
  const limit = Math.min(toPositiveInt(query.limit, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
  return { page, limit, offset: (page - 1) * limit };
};

export const buildPaginationMeta = (totalItems, page, limit) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};

/** Escapes % and _ so user input is matched literally inside ILIKE patterns. */
export const escapeLike = (value) => String(value).replace(/[\\%_]/g, '\\$&');

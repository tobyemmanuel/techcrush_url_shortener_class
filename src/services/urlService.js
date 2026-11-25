import { col, fn, literal, Op, UniqueConstraintError } from 'sequelize';
import { env } from '../config/env.js';
import { Click, Url } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { MAX_CODE_GENERATION_ATTEMPTS, ROLES } from '../utils/constants.js';
import { logger } from '../utils/logger.js';
import { buildPaginationMeta, escapeLike } from '../utils/pagination.js';
import { generateShortCode, isReservedCode } from '../utils/shortCode.js';
import { urlCache } from './cacheService.js';

const isAdmin = (user) => user.role === ROLES.ADMIN;

/**
 * Loads a URL the user is allowed to touch.
 * Owners can access their own URLs and admins can access any URL.
 * Everyone else gets a 404, so they cannot tell whether the id exists.
 */
async function findAccessibleUrl(user, id) {
  const url = await Url.findByPk(id);
  if (!url || (url.userId !== user.id && !isAdmin(user))) {
    throw new AppError('URL not found', 404);
  }
  return url;
}

export async function createUrl(user, { originalUrl, customAlias, expiresAt }) {
  const base = {
    userId: user.id,
    originalUrl,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
  };

  let url;

  if (customAlias) {
    if (isReservedCode(customAlias)) {
      throw new AppError('That alias is reserved. Please choose another one.', 400);
    }
    try {
      url = await Url.create({ ...base, code: customAlias, isCustomAlias: true });
    } catch (error) {
      // The database enforces uniqueness, so two people cannot win the same alias by racing.
      if (error instanceof UniqueConstraintError) {
        throw new AppError('That alias is already taken', 409);
      }
      throw error;
    }
  } else {
    for (let attempt = 1; attempt <= MAX_CODE_GENERATION_ATTEMPTS && !url; attempt += 1) {
      try {
        url = await Url.create({ ...base, code: generateShortCode() });
      } catch (error) {
        if (!(error instanceof UniqueConstraintError)) throw error;
        logger.warn('Generated short code collided, retrying', { attempt });
      }
    }
    if (!url) {
      throw new AppError('Could not generate a unique short code. Please try again.', 503);
    }
  }

  // A "not found" answer may be cached for this code. Remove it so the new link works at once.
  urlCache.delete(url.code);
  return url;
}

export async function listUrls(user, { page, limit, offset }, { q, isActive, sortBy = 'createdAt', order = 'desc' } = {}) {
  const where = { userId: user.id };

  if (q) {
    const pattern = `%${escapeLike(q)}%`;
    where[Op.or] = [{ originalUrl: { [Op.iLike]: pattern } }, { code: { [Op.iLike]: pattern } }];
  }
  if (isActive !== undefined) {
    where.isActive = isActive === 'true' || isActive === true;
  }

  const { rows, count } = await Url.findAndCountAll({
    where,
    order: [[sortBy, order.toUpperCase()]],
    limit,
    offset,
  });

  return { urls: rows, meta: buildPaginationMeta(count, page, limit) };
}

export const getUrl = (user, id) => findAccessibleUrl(user, id);

export async function updateUrl(user, id, { originalUrl, isActive, expiresAt }) {
  const url = await findAccessibleUrl(user, id);

  if (originalUrl !== undefined) url.originalUrl = originalUrl;
  if (isActive !== undefined) url.isActive = isActive;
  // Sending expiresAt: null removes the expiry date.
  if (expiresAt !== undefined) url.expiresAt = expiresAt === null ? null : new Date(expiresAt);

  await url.save();
  urlCache.delete(url.code);
  return url;
}

export async function deleteUrl(user, id) {
  const url = await findAccessibleUrl(user, id);
  await url.destroy();
  urlCache.delete(url.code);
}

export async function getUrlStats(user, id, days = 7) {
  const url = await findAccessibleUrl(user, id);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const where = { urlId: url.id, createdAt: { [Op.gte]: since } };

  const [clicksByDay, topReferrers] = await Promise.all([
    Click.findAll({
      attributes: [
        [fn('date_trunc', 'day', col('created_at')), 'day'],
        [fn('COUNT', col('id')), 'clicks'],
      ],
      where,
      group: ['day'],
      order: [[col('day'), 'ASC']],
      raw: true,
    }),
    Click.findAll({
      attributes: ['referer', [fn('COUNT', col('id')), 'clicks']],
      where: { ...where, referer: { [Op.ne]: null } },
      group: ['referer'],
      order: [[literal('clicks'), 'DESC']],
      limit: 5,
      raw: true,
    }),
  ]);

  return {
    url,
    totalClicks: url.clickCount,
    lastClickedAt: url.lastClickedAt,
    periodDays: days,
    clicksByDay: clicksByDay.map((row) => ({ date: row.day, clicks: Number(row.clicks) })),
    topReferrers: topReferrers.map((row) => ({ referer: row.referer, clicks: Number(row.clicks) })),
  };
}

/**
 * Used by the redirect route on every visit, so it must be fast.
 * 1. Look in the in-memory cache.
 * 2. On a miss, ask the database and remember the answer.
 * Returns null when the code does not exist.
 */
export async function resolveCode(code) {
  const cached = urlCache.get(code);
  if (cached !== undefined) return cached;

  const url = await Url.findOne({
    where: { code },
    attributes: ['id', 'originalUrl', 'isActive', 'expiresAt'],
  });

  if (!url) {
    // Remember misses briefly so scanners guessing codes do not hammer the database.
    urlCache.set(code, null, env.cache.negativeTtlMs);
    return null;
  }

  const record = {
    id: url.id,
    originalUrl: url.originalUrl,
    isActive: url.isActive,
    expiresAt: url.expiresAt,
  };
  urlCache.set(code, record);
  return record;
}

/**
 * Stores the click and updates the counters.
 * The redirect does not wait for this. A slow database should not slow down visitors,
 * and a failure here is logged instead of breaking the redirect.
 */
export function recordClick(urlId, { ip, userAgent, referer }) {
  const clip = (value, max) => (value ? String(value).slice(0, max) : null);

  Promise.all([
    Click.create({ urlId, ip: clip(ip, 64), userAgent: clip(userAgent, 512), referer: clip(referer, 2048) }),
    Url.update(
      { clickCount: literal('click_count + 1'), lastClickedAt: new Date() },
      { where: { id: urlId }, silent: true },
    ),
  ]).catch((error) => logger.error('Failed to record click', { urlId, error: error.message }));
}

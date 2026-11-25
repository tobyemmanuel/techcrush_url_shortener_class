import { env } from '../config/env.js';
import { TTLCache } from '../utils/cache.js';

/**
 * Maps a short code to what the redirect needs: { id, originalUrl, isActive, expiresAt }.
 * A value of null means "we checked the database and this code does not exist".
 */
export const urlCache = new TTLCache({
  ttlMs: env.cache.ttlMs,
  maxItems: env.cache.maxItems,
});

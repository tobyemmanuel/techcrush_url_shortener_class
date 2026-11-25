import * as urlService from '../services/urlService.js';
import { AppError } from '../utils/AppError.js';
import { isValidCodeFormat } from '../utils/shortCode.js';

export const redirectToOriginal = async (req, res) => {
  const { code } = req.params;

  // Reject obviously invalid codes before touching the cache or the database.
  if (!isValidCodeFormat(code)) {
    throw new AppError('Short link not found', 404);
  }

  const record = await urlService.resolveCode(code);
  if (!record || !record.isActive) {
    throw new AppError('Short link not found', 404);
  }

  // The expiry is checked on every visit, even for cached records.
  if (record.expiresAt && new Date(record.expiresAt) <= new Date()) {
    throw new AppError('This short link has expired', 410);
  }

  // Not awaited on purpose. See recordClick for the reasoning.
  urlService.recordClick(record.id, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    referer: req.get('referer'),
  });

  // 302 (temporary) instead of 301 (permanent). Browsers cache a 301 forever and
  // would never hit this server again, so clicks could not be counted.
  return res.redirect(302, record.originalUrl);
};

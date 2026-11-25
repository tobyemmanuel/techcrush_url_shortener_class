import * as urlService from '../services/urlService.js';
import { parsePagination } from '../utils/pagination.js';
import { sendSuccess } from '../utils/response.js';

export const createUrl = async (req, res) => {
  const { originalUrl, customAlias, expiresAt } = req.body;
  const url = await urlService.createUrl(req.user, { originalUrl, customAlias, expiresAt });

  return sendSuccess(res, { statusCode: 201, message: 'Short link created', data: { url } });
};

export const listUrls = async (req, res) => {
  const { q, isActive, sortBy, order } = req.query;
  const { urls, meta } = await urlService.listUrls(req.user, parsePagination(req.query), {
    q,
    isActive,
    sortBy,
    order,
  });

  return sendSuccess(res, { message: 'Your short links', data: { urls }, meta });
};

export const getUrl = async (req, res) => {
  const url = await urlService.getUrl(req.user, req.params.id);
  return sendSuccess(res, { message: 'Short link details', data: { url } });
};

export const updateUrl = async (req, res) => {
  const { originalUrl, isActive, expiresAt } = req.body;
  const url = await urlService.updateUrl(req.user, req.params.id, { originalUrl, isActive, expiresAt });

  return sendSuccess(res, { message: 'Short link updated', data: { url } });
};

export const deleteUrl = async (req, res) => {
  await urlService.deleteUrl(req.user, req.params.id);
  return sendSuccess(res, { message: 'Short link deleted' });
};

export const getUrlStats = async (req, res) => {
  const days = req.query.days ? Number.parseInt(req.query.days, 10) : 7;
  const stats = await urlService.getUrlStats(req.user, req.params.id, days);

  return sendSuccess(res, { message: 'Short link statistics', data: stats });
};

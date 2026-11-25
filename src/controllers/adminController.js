import * as adminService from '../services/adminService.js';
import { parsePagination } from '../utils/pagination.js';
import { sendSuccess } from '../utils/response.js';

export const listUsers = async (req, res) => {
  const { q, role } = req.query;
  const { users, meta } = await adminService.listUsers(parsePagination(req.query), { q, role });

  return sendSuccess(res, { message: 'Users', data: { users }, meta });
};

export const updateUserRole = async (req, res) => {
  const user = await adminService.updateUserRole(req.user, req.params.id, req.body.role);
  return sendSuccess(res, { message: 'User role updated', data: { user } });
};

export const setUserStatus = async (req, res) => {
  const user = await adminService.setUserStatus(req.user, req.params.id, req.body.isActive);
  const message = user.isActive ? 'User account activated' : 'User account deactivated';

  return sendSuccess(res, { message, data: { user } });
};

export const listAllUrls = async (req, res) => {
  const { urls, meta } = await adminService.listAllUrls(parsePagination(req.query), { q: req.query.q });
  return sendSuccess(res, { message: 'All short links', data: { urls }, meta });
};

export const getStats = async (req, res) => {
  const stats = await adminService.getPlatformStats();
  return sendSuccess(res, { message: 'Platform statistics', data: stats });
};

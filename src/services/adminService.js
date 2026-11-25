import { Op } from 'sequelize';
import { Click, Url, User } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { buildPaginationMeta, escapeLike } from '../utils/pagination.js';
import { urlCache } from './cacheService.js';

async function findUser(id) {
  const user = await User.findByPk(id);
  if (!user) throw new AppError('User not found', 404);
  return user;
}

export async function listUsers({ page, limit, offset }, { q, role } = {}) {
  const where = {};

  if (role) where.role = role;
  if (q) {
    const pattern = `%${escapeLike(q)}%`;
    where[Op.or] = [{ name: { [Op.iLike]: pattern } }, { email: { [Op.iLike]: pattern } }];
  }

  const { rows, count } = await User.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return { users: rows, meta: buildPaginationMeta(count, page, limit) };
}

export async function updateUserRole(actor, id, role) {
  if (actor.id === id) {
    throw new AppError('You cannot change your own role', 400);
  }
  const user = await findUser(id);
  await user.update({ role });
  return user;
}

export async function setUserStatus(actor, id, isActive) {
  if (actor.id === id) {
    throw new AppError('You cannot change the status of your own account', 400);
  }
  const user = await findUser(id);
  await user.update({ isActive });
  return user;
}

export async function listAllUrls({ page, limit, offset }, { q } = {}) {
  const where = {};

  if (q) {
    const pattern = `%${escapeLike(q)}%`;
    where[Op.or] = [{ originalUrl: { [Op.iLike]: pattern } }, { code: { [Op.iLike]: pattern } }];
  }

  const { rows, count } = await Url.findAndCountAll({
    where,
    include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email'] }],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return { urls: rows, meta: buildPaginationMeta(count, page, limit) };
}

export async function getPlatformStats() {
  const [totalUsers, activeUsers, totalUrls, activeUrls, totalClicks, topUrls] = await Promise.all([
    User.count(),
    User.count({ where: { isActive: true } }),
    Url.count(),
    Url.count({ where: { isActive: true } }),
    Click.count(),
    Url.findAll({ order: [['clickCount', 'DESC']], limit: 5 }),
  ]);

  return {
    users: { total: totalUsers, active: activeUsers },
    urls: { total: totalUrls, active: activeUrls },
    clicks: { total: totalClicks },
    topUrls,
    cache: urlCache.stats(),
  };
}

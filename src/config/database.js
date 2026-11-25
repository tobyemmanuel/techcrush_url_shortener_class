import { Sequelize } from 'sequelize';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export const sequelize = new Sequelize(env.db.url, {
  dialect: 'postgres',
  logging: env.db.logging ? (sql) => logger.debug(sql) : false,
  dialectOptions: env.db.ssl ? { ssl: { require: true, rejectUnauthorized: false } } : {},
  define: {
    // JavaScript uses camelCase (createdAt), the database uses snake_case (created_at).
    underscored: true,
    timestamps: true,
  },
  pool: { max: 10, min: 0, acquire: 30_000, idle: 10_000 },
});

export async function connectDatabase() {
  await sequelize.authenticate();
  logger.info('Database connection established');
}

import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

/** One row per visit to a short link. */
export class Click extends Model {}

Click.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    urlId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'urls', key: 'id' },
      onDelete: 'CASCADE',
    },
    ip: { type: DataTypes.STRING(64) },
    userAgent: { type: DataTypes.STRING(512) },
    referer: { type: DataTypes.STRING(2048) },
  },
  {
    sequelize,
    modelName: 'Click',
    tableName: 'clicks',
    updatedAt: false,
    indexes: [{ fields: ['url_id', 'created_at'] }],
  },
);

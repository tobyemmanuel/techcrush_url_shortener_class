import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import { env } from '../config/env.js';

export class Url extends Model {
  get shortUrl() {
    return `${env.baseUrl}/${this.code}`;
  }

  toJSON() {
    return { ...this.get(), shortUrl: this.shortUrl };
  }
}

Url.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    code: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
    },
    originalUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isCustomAlias: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    expiresAt: { type: DataTypes.DATE },
    clickCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    lastClickedAt: { type: DataTypes.DATE },
  },
  {
    sequelize,
    modelName: 'Url',
    tableName: 'urls',
    indexes: [{ fields: ['user_id'] }, { fields: ['created_at'] }],
  },
);

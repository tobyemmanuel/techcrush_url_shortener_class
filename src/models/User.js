import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import { ROLES, ROLE_VALUES } from '../utils/constants.js';

const HIDDEN_FIELDS = [
  'passwordHash',
  'emailVerifyTokenHash',
  'emailVerifyExpires',
  'passwordResetTokenHash',
  'passwordResetExpires',
  'passwordChangedAt',
];

export class User extends Model {
  /** Never send password hashes or one-time token hashes to a client. */
  toJSON() {
    const values = { ...this.get() };
    for (const field of HIDDEN_FIELDS) delete values[field];
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(...ROLE_VALUES),
      allowNull: false,
      defaultValue: ROLES.USER,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    emailVerifyTokenHash: { type: DataTypes.STRING(64) },
    emailVerifyExpires: { type: DataTypes.DATE },
    passwordResetTokenHash: { type: DataTypes.STRING(64) },
    passwordResetExpires: { type: DataTypes.DATE },
    passwordChangedAt: { type: DataTypes.DATE },
    lastLoginAt: { type: DataTypes.DATE },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    indexes: [{ fields: ['email_verify_token_hash'] }, { fields: ['password_reset_token_hash'] }],
  },
);

import { sequelize } from '../config/database.js';
import { User } from './User.js';
import { Url } from './Url.js';
import { Click } from './Click.js';

// Relationships live in one place so you can see the whole data model at a glance.
User.hasMany(Url, { foreignKey: 'userId', as: 'urls', onDelete: 'CASCADE' });
Url.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

Url.hasMany(Click, { foreignKey: 'urlId', as: 'clicks', onDelete: 'CASCADE' });
Click.belongsTo(Url, { foreignKey: 'urlId', as: 'url' });

export { sequelize, User, Url, Click };

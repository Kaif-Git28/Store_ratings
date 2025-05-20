const { User, ROLES } = require('./User');
const Store = require('./Store');
const Rating = require('./Rating');

// User has many Stores (as owner)
User.hasMany(Store, { foreignKey: 'ownerId' });
Store.belongsTo(User, { foreignKey: 'ownerId' });

// User has many Ratings
User.hasMany(Rating, { foreignKey: 'userId' });
Rating.belongsTo(User, { foreignKey: 'userId' });

// Store has many Ratings
Store.hasMany(Rating, { foreignKey: 'storeId' });
Rating.belongsTo(Store, { foreignKey: 'storeId' });

module.exports = {
  User,
  ROLES,
  Store,
  Rating
}; 
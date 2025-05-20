const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize } = require('../config/db');

// User roles defined as constants
const ROLES = {
  ADMIN: 'admin',
  NORMAL_USER: 'normal_user',
  STORE_OWNER: 'store_owner'
};

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM(ROLES.ADMIN, ROLES.NORMAL_USER, ROLES.STORE_OWNER),
    defaultValue: ROLES.NORMAL_USER,
    allowNull: false
  }
}, {
  timestamps: true
});

// Hash password before saving
User.beforeCreate(async (user) => {
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
});

// Match entered password with hashed password
User.prototype.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
User.prototype.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this.id, role: this.role }, 
    process.env.JWT_SECRET || 'store_rating_jwt_secret_key',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

module.exports = { User, ROLES }; 
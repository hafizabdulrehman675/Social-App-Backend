'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

// User model = JavaScript class representing the Users table
// Every field here must match what we defined in the migration
const User = sequelize.define('User', {

  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },

  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },

  // Password stored as bcrypt hash — never plain text
  // When we send user data to frontend we EXCLUDE this field
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // URL string now → Cloudinary URL later (no schema change needed)
  avatarUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },

}, {
  tableName: 'Users',   // must match exact table name from migration
  timestamps: true,     // auto-manages createdAt and updatedAt
});

module.exports = User;

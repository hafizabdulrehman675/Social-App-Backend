'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

const Follower = sequelize.define('Follower', {

  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  // WHO is doing the following
  // Frontend socialSlice: followingByUserId key is this user
  followerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  // WHO is being followed
  // Frontend socialSlice: followingByUserId[followerId] contains followingId
  followingId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

}, {
  tableName: 'Followers',
  timestamps: true,
});

module.exports = Follower;

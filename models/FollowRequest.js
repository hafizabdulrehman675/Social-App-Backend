'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

const FollowRequest = sequelize.define('FollowRequest', {

  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  // Frontend socialSlice: requestsById[id].fromUserId
  fromUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  // Frontend socialSlice: requestsById[id].toUserId
  toUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  // Frontend socialSlice: requestsById[id].status
  // pending → waiting, accepted → moved to Followers, rejected → declined
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
  },

}, {
  tableName: 'FollowRequests',
  timestamps: true,
});

module.exports = FollowRequest;

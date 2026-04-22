'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

// ACTIVITY FEED — what happened related to current user
// Frontend: NotificationsPage reads from here
const Notification = sequelize.define('Notification', {

  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  // WHO receives this notification (logged-in user sees their own)
  recipientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  // WHO triggered it (john liked, sara followed)
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  // WHAT happened
  // like           → someone liked your post
  // comment        → someone commented on your post
  // follow         → someone followed you
  // follow_request → someone requested to follow you
  type: {
    type: DataTypes.ENUM('like', 'comment', 'follow', 'follow_request'),
    allowNull: false,
  },

  // WHICH post triggered it (null for follow notifications)
  postId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  // HAS user seen this notification
  // Frontend: used to show unread badge count
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },

}, {
  tableName: 'Notifications',
  timestamps: true,
});

module.exports = Notification;

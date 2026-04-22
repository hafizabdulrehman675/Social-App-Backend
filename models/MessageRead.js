'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

// TRACKS READ CURSOR — where each user last read in a thread
// Frontend: thread.lastReadMessageIdByUserId
// Frontend: thread.unreadCountByUserId is COMPUTED from this
const MessageRead = sequelize.define('MessageRead', {

  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  // Frontend: thread.id
  threadId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  // WHICH user's read position we are tracking
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  // LAST message this user has seen in this thread
  // Frontend: lastReadMessageIdByUserId[userId]
  // unreadCount = messages created AFTER this id
  lastReadMessageId: {
    type: DataTypes.INTEGER,
    allowNull: true, // null = user never read anything in this thread
  },

}, {
  tableName: 'MessageReads',
  timestamps: true,
});

module.exports = MessageRead;

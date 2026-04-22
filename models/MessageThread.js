'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

// CONVERSATION CONTAINER
// Frontend messagesSlice: threadsById[id]
// Who is IN the thread is tracked by ThreadParticipant model
const MessageThread = sequelize.define('MessageThread', {

  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

}, {
  tableName: 'MessageThreads',
  timestamps: true,
});

module.exports = MessageThread;

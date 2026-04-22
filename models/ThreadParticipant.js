'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

// JUNCTION TABLE — who is in which thread
// Frontend messagesSlice: thread.participantIds array maps to rows here
// e.g. participantIds: [1, 2] → two rows with same threadId
const ThreadParticipant = sequelize.define('ThreadParticipant', {

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

  // Frontend: thread.participantIds contains this userId
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

}, {
  tableName: 'ThreadParticipants',
  timestamps: true,
});

module.exports = ThreadParticipant;

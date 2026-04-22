'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

const Message = sequelize.define('Message', {

  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  // Frontend: message.threadId
  threadId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  // Frontend: message.senderId
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  // Frontend: message.text
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },

  // Frontend: message.deliveryStatus
  // sending → optimistic (frontend only)
  // sent    → saved in DB
  // delivered → recipient device got it (via WebSocket)
  // seen    → recipient opened chat (via WebSocket)
  deliveryStatus: {
    type: DataTypes.ENUM('sending', 'sent', 'delivered', 'seen', 'failed'),
    allowNull: false,
    defaultValue: 'sent',
  },

  // Frontend: message.reacted (emoji string)
  reacted: {
    type: DataTypes.STRING,
    allowNull: true,
  },

}, {
  tableName: 'Messages',
  timestamps: true,
});

module.exports = Message;

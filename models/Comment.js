'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

const Comment = sequelize.define('Comment', {

  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  // WHICH post this comment is on
  // Frontend: comment belongs to a post
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  // WHO wrote this comment
  // Frontend: comment.username → we JOIN Users to get this
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  // NESTED REPLIES — null means top-level comment
  // Frontend: comment.parentId
  // e.g. parentId: 5 means "reply to comment #5"
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  // Frontend: comment.text
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },

}, {
  tableName: 'Comments',
  timestamps: true,
});

module.exports = Comment;

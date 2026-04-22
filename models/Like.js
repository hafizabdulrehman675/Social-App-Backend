'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

const Like = sequelize.define('Like', {

  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  // WHICH post was liked
  // Frontend: post.isLiked computed by checking if current user's
  // like exists in this table for this postId
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  // WHO liked it
  // Frontend: toggleLike({ postId }) → adds or removes row here
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

}, {
  tableName: 'Likes',
  timestamps: true,
});

module.exports = Like;

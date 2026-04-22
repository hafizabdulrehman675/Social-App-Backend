'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

const SavedPost = sequelize.define('SavedPost', {

  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  // WHICH post was saved
  // Frontend: post.isSaved computed by checking if row exists here
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  // WHO saved it
  // Frontend: toggleSave({ postId }) → adds or removes row here
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

}, {
  tableName: 'SavedPosts',
  timestamps: true,
});

module.exports = SavedPost;

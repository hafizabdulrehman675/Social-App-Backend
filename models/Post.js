'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

const Post = sequelize.define('Post', {

  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  // Foreign key → links to Users table
  // Frontend: post.authorId maps to this
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  caption: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // URL string now → Cloudinary URL later
  // Frontend: post.imageUrl
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  // Frontend: post.location
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  // NOTE: likesCount and commentsCount are NOT here
  // They are computed dynamically from Likes and Comments tables
  // Frontend gets them as numbers in API response

}, {
  tableName: 'Posts',
  timestamps: true,
});

module.exports = Post;

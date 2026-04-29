'use strict';

const { SavedPost, Post } = require('../models');
const AppError = require('../utils/appError');

const savePost = async ({ postId, userId }) => {
  const post = await Post.findByPk(postId);
  if (!post) throw new AppError('Post not found', 404);

  const existing = await SavedPost.findOne({
    where: { postId, userId },
  });
  if (existing) throw new AppError('Post already saved', 400);

  await SavedPost.create({ postId, userId });
  return { isSaved: true };
};

const unsavePost = async ({ postId, userId }) => {
  const saved = await SavedPost.findOne({
    where: { postId, userId },
  });
  if (!saved) throw new AppError('Post not saved', 400);

  await saved.destroy();
  return { isSaved: false };
};

module.exports = {
  savePost,
  unsavePost,
};


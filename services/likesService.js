'use strict';

const { Like, Post, Notification } = require('../models');
const AppError = require('../utils/appError');

const likePost = async ({ postId, userId }) => {
  const post = await Post.findByPk(postId);
  if (!post) throw new AppError('Post not found', 404);

  const existing = await Like.findOne({
    where: { postId, userId },
  });
  if (existing) throw new AppError('You already liked this post', 400);

  await Like.create({ postId, userId });

  // Notify post owner — skip if liking your own post
  if (post.userId !== userId) {
    await Notification.create({
      recipientId: post.userId,
      senderId: userId,
      type: 'like',
      postId: post.id,
    });
  }

  const likesCount = await Like.count({ where: { postId } });
  return { likesCount, isLiked: true };
};

const unlikePost = async ({ postId, userId }) => {
  const like = await Like.findOne({
    where: { postId, userId },
  });
  if (!like) throw new AppError('You have not liked this post', 400);

  await like.destroy();

  const likesCount = await Like.count({ where: { postId } });
  return { likesCount, isLiked: false };
};

module.exports = {
  likePost,
  unlikePost,
};


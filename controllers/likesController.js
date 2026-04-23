'use strict';

const { Like, Post, Notification } = require('../models');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// ─── LIKE POST ────────────────────────────────────────────────────────────────
// Route:   POST /api/posts/:postId/like
// Access:  Protected
exports.likePost = catchAsync(async (req, res, next) => {
  const post = await Post.findByPk(req.params.postId);
  if (!post) return next(new AppError('Post not found', 404));

  const existing = await Like.findOne({
    where: { postId: req.params.postId, userId: req.user.id },
  });
  if (existing) return next(new AppError('You already liked this post', 400));

  await Like.create({ postId: req.params.postId, userId: req.user.id });

  // Notify post owner — skip if liking your own post
  if (post.userId !== req.user.id) {
    await Notification.create({
      recipientId: post.userId,
      senderId: req.user.id,
      type: 'like',
      postId: post.id,
    });
  }

  const likesCount = await Like.count({ where: { postId: req.params.postId } });

  res.status(200).json({
    status: 'success',
    data: { likesCount, isLiked: true },
  });
});

// ─── UNLIKE POST ──────────────────────────────────────────────────────────────
// Route:   DELETE /api/posts/:postId/like
// Access:  Protected
exports.unlikePost = catchAsync(async (req, res, next) => {
  const like = await Like.findOne({
    where: { postId: req.params.postId, userId: req.user.id },
  });
  if (!like) return next(new AppError('You have not liked this post', 400));

  await like.destroy();

  const likesCount = await Like.count({ where: { postId: req.params.postId } });

  res.status(200).json({
    status: 'success',
    data: { likesCount, isLiked: false },
  });
});

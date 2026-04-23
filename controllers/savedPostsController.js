'use strict';

const { SavedPost, Post } = require('../models');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// ─── SAVE POST ────────────────────────────────────────────────────────────────
// Route:   POST /api/posts/:postId/save
// Access:  Protected
exports.savePost = catchAsync(async (req, res, next) => {
  const post = await Post.findByPk(req.params.postId);
  if (!post) return next(new AppError('Post not found', 404));

  const existing = await SavedPost.findOne({
    where: { postId: req.params.postId, userId: req.user.id },
  });
  if (existing) return next(new AppError('Post already saved', 400));

  await SavedPost.create({ postId: req.params.postId, userId: req.user.id });

  res.status(200).json({
    status: 'success',
    data: { isSaved: true },
  });
});

// ─── UNSAVE POST ──────────────────────────────────────────────────────────────
// Route:   DELETE /api/posts/:postId/save
// Access:  Protected
exports.unsavePost = catchAsync(async (req, res, next) => {
  const saved = await SavedPost.findOne({
    where: { postId: req.params.postId, userId: req.user.id },
  });
  if (!saved) return next(new AppError('Post not saved', 400));

  await saved.destroy();

  res.status(200).json({
    status: 'success',
    data: { isSaved: false },
  });
});

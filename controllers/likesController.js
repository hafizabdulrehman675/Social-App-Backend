'use strict';

const catchAsync = require('../utils/catchAsync');
const likesService = require('../services/likesService');

// ─── LIKE POST ────────────────────────────────────────────────────────────────
// Route:   POST /api/posts/:postId/like
// Access:  Protected
exports.likePost = catchAsync(async (req, res, next) => {
  const data = await likesService.likePost({
    postId: req.params.postId,
    userId: req.user.id,
  });

  res.status(200).json({
    status: 'success',
    data,
  });
});

// ─── UNLIKE POST ──────────────────────────────────────────────────────────────
// Route:   DELETE /api/posts/:postId/like
// Access:  Protected
exports.unlikePost = catchAsync(async (req, res, next) => {
  const data = await likesService.unlikePost({
    postId: req.params.postId,
    userId: req.user.id,
  });

  res.status(200).json({
    status: 'success',
    data,
  });
});

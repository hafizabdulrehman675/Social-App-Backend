'use strict';

const catchAsync = require('../utils/catchAsync');
const savedPostsService = require('../services/savedPostsService');

// ─── SAVE POST ────────────────────────────────────────────────────────────────
// Route:   POST /api/posts/:postId/save
// Access:  Protected
exports.savePost = catchAsync(async (req, res, next) => {
  const data = await savedPostsService.savePost({
    postId: req.params.postId,
    userId: req.user.id,
  });

  res.status(200).json({
    status: 'success',
    data,
  });
});

// ─── UNSAVE POST ──────────────────────────────────────────────────────────────
// Route:   DELETE /api/posts/:postId/save
// Access:  Protected
exports.unsavePost = catchAsync(async (req, res, next) => {
  const data = await savedPostsService.unsavePost({
    postId: req.params.postId,
    userId: req.user.id,
  });

  res.status(200).json({
    status: 'success',
    data,
  });
});

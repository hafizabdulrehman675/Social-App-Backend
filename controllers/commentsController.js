'use strict';

const catchAsync = require('../utils/catchAsync');
const commentsService = require('../services/commentsService');

// ─── GET COMMENTS ─────────────────────────────────────────────────────────────
// Route:   GET /api/posts/:postId/comments
// Access:  Public
// Returns: all top-level comments for a post with author info
exports.getComments = catchAsync(async (req, res, next) => {
  const data = await commentsService.getComments(req.params.postId);

  res.status(200).json({
    status: 'success',
    data,
  });
});

// ─── GET REPLIES ──────────────────────────────────────────────────────────────
// Route:   GET /api/posts/:postId/comments/:commentId/replies
// Access:  Public
// User clicks "View replies" under a comment → loads replies for that comment
exports.getReplies = catchAsync(async (req, res, next) => {
  const data = await commentsService.getReplies(req.params.commentId);

  res.status(200).json({
    status: 'success',
    data,
  });
});

// ─── ADD COMMENT ──────────────────────────────────────────────────────────────
// Route:   POST /api/posts/:postId/comments
// Access:  Protected
// Body:    { text, parentId? }
// parentId is optional — if provided, this comment is a reply to another comment
exports.addComment = catchAsync(async (req, res, next) => {
  const data = await commentsService.addComment({
    postId: req.params.postId,
    userId: req.user.id,
    text: req.body.text,
    parentId: req.body.parentId,
  });

  res.status(201).json({
    status: 'success',
    data,
  });
});

// ─── DELETE COMMENT ───────────────────────────────────────────────────────────
// Route:   DELETE /api/posts/:postId/comments/:commentId
// Access:  Protected (only comment owner)
exports.deleteComment = catchAsync(async (req, res, next) => {
  await commentsService.deleteComment({
    postId: req.params.postId,
    commentId: req.params.commentId,
    userId: req.user.id,
  });

  res.status(200).json({
    status: 'success',
    message: 'Comment deleted',
  });
});

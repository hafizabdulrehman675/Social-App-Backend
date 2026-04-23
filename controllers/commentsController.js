'use strict';

const { Comment, User, Post } = require('../models');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// ─── GET COMMENTS ─────────────────────────────────────────────────────────────
// Route:   GET /api/posts/:postId/comments
// Access:  Public
// Returns: all top-level comments for a post with author info
exports.getComments = catchAsync(async (req, res, next) => {
  const post = await Post.findByPk(req.params.postId);
  if (!post) return next(new AppError('Post not found', 404));

  const comments = await Comment.findAll({
    where: { postId: req.params.postId, parentId: null }, // top-level only
    include: [
      { model: User, as: 'author', attributes: ['id', 'username', 'avatarUrl'] },
    ],
    order: [['createdAt', 'ASC']],
  });

  res.status(200).json({
    status: 'success',
    data: {
      comments: comments.map((c) => ({
        id: c.id,
        text: c.text,
        createdAt: c.createdAt,
        authorId: c.author.id,
        username: c.author.username,
        avatarUrl: c.author.avatarUrl,
      })),
    },
  });
});

// ─── GET REPLIES ──────────────────────────────────────────────────────────────
// Route:   GET /api/posts/:postId/comments/:commentId/replies
// Access:  Public
// User clicks "View replies" under a comment → loads replies for that comment
exports.getReplies = catchAsync(async (req, res, next) => {
  const parentComment = await Comment.findByPk(req.params.commentId);
  if (!parentComment) return next(new AppError('Comment not found', 404));

  const replies = await Comment.findAll({
    where: { parentId: req.params.commentId },
    include: [
      { model: User, as: 'author', attributes: ['id', 'username', 'avatarUrl'] },
    ],
    order: [['createdAt', 'ASC']],
  });

  res.status(200).json({
    status: 'success',
    data: {
      replies: replies.map((c) => ({
        id: c.id,
        text: c.text,
        createdAt: c.createdAt,
        parentId: c.parentId,
        authorId: c.author.id,
        username: c.author.username,
        avatarUrl: c.author.avatarUrl,
      })),
    },
  });
});

// ─── ADD COMMENT ──────────────────────────────────────────────────────────────
// Route:   POST /api/posts/:postId/comments
// Access:  Protected
// Body:    { text, parentId? }
// parentId is optional — if provided, this comment is a reply to another comment
exports.addComment = catchAsync(async (req, res, next) => {
  const { text, parentId } = req.body;

  if (!text || !text.trim()) {
    return next(new AppError('Comment text is required', 400));
  }

  const post = await Post.findByPk(req.params.postId);
  if (!post) return next(new AppError('Post not found', 404));

  const comment = await Comment.create({
    postId: req.params.postId,
    userId: req.user.id,
    text: text.trim(),
    parentId: parentId || null,
  });

  // Fetch with author info so frontend can display immediately
  const full = await Comment.findByPk(comment.id, {
    include: [
      { model: User, as: 'author', attributes: ['id', 'username', 'avatarUrl'] },
    ],
  });

  res.status(201).json({
    status: 'success',
    data: {
      comment: {
        id: full.id,
        text: full.text,
        createdAt: full.createdAt,
        parentId: full.parentId,
        authorId: full.author.id,
        username: full.author.username,
        avatarUrl: full.author.avatarUrl,
      },
    },
  });
});

// ─── DELETE COMMENT ───────────────────────────────────────────────────────────
// Route:   DELETE /api/posts/:postId/comments/:commentId
// Access:  Protected (only comment owner)
exports.deleteComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findByPk(req.params.commentId);

  if (!comment) return next(new AppError('Comment not found', 404));

  // Make sure comment belongs to this post
  if (comment.postId !== parseInt(req.params.postId)) {
    return next(new AppError('Comment does not belong to this post', 400));
  }

  // Only the comment author can delete it
  if (comment.userId !== req.user.id) {
    return next(new AppError('You can only delete your own comments', 403));
  }

  await comment.destroy();

  res.status(200).json({
    status: 'success',
    message: 'Comment deleted',
  });
});

'use strict';

const { Comment, User, Post } = require('../models');
const AppError = require('../utils/appError');

const getComments = async (postId) => {
  const post = await Post.findByPk(postId);
  if (!post) throw new AppError('Post not found', 404);

  const comments = await Comment.findAll({
    where: { postId, parentId: null },
    include: [{ model: User, as: 'author', attributes: ['id', 'username', 'avatarUrl'] }],
    order: [['createdAt', 'ASC']],
  });

  return {
    comments: comments.map((c) => ({
      id: c.id,
      text: c.text,
      createdAt: c.createdAt,
      authorId: c.author.id,
      username: c.author.username,
      avatarUrl: c.author.avatarUrl,
    })),
  };
};

const getReplies = async (commentId) => {
  const parentComment = await Comment.findByPk(commentId);
  if (!parentComment) throw new AppError('Comment not found', 404);

  const replies = await Comment.findAll({
    where: { parentId: commentId },
    include: [{ model: User, as: 'author', attributes: ['id', 'username', 'avatarUrl'] }],
    order: [['createdAt', 'ASC']],
  });

  return {
    replies: replies.map((c) => ({
      id: c.id,
      text: c.text,
      createdAt: c.createdAt,
      parentId: c.parentId,
      authorId: c.author.id,
      username: c.author.username,
      avatarUrl: c.author.avatarUrl,
    })),
  };
};

const addComment = async ({ postId, userId, text, parentId }) => {
  if (!text || !text.trim()) {
    throw new AppError('Comment text is required', 400);
  }

  const post = await Post.findByPk(postId);
  if (!post) throw new AppError('Post not found', 404);

  const comment = await Comment.create({
    postId,
    userId,
    text: text.trim(),
    parentId: parentId || null,
  });

  // Fetch with author so frontend can display immediately
  const full = await Comment.findByPk(comment.id, {
    include: [{ model: User, as: 'author', attributes: ['id', 'username', 'avatarUrl'] }],
  });

  return {
    comment: {
      id: full.id,
      text: full.text,
      createdAt: full.createdAt,
      parentId: full.parentId,
      authorId: full.author.id,
      username: full.author.username,
      avatarUrl: full.author.avatarUrl,
    },
  };
};

const deleteComment = async ({ postId, commentId, userId }) => {
  const comment = await Comment.findByPk(commentId);
  if (!comment) throw new AppError('Comment not found', 404);

  // Ensure comment belongs to the given post
  if (comment.postId !== parseInt(postId)) {
    throw new AppError('Comment does not belong to this post', 400);
  }

  if (comment.userId !== userId) {
    throw new AppError('You can only delete your own comments', 403);
  }

  await comment.destroy();
};

module.exports = {
  getComments,
  getReplies,
  addComment,
  deleteComment,
};


'use strict';

const { User, Post, Like, SavedPost, Comment, Follower } = require('../models');
const AppError = require('../utils/appError');

const postInclude = [
  { model: User, as: 'author', attributes: ['id', 'username', 'avatarUrl'] },
  { model: Like, as: 'likes', attributes: ['userId'] },
  { model: SavedPost, as: 'saves', attributes: ['userId'] },
  {
    model: Comment,
    as: 'comments',
    attributes: ['id', 'text', 'parentId', 'createdAt'],
    include: [{ model: User, as: 'author', attributes: ['username', 'avatarUrl'] }],
  },
];

const formatPost = (post, requestUserId, includeComments = false) => ({
  id: post.id,
  caption: post.caption,
  imageUrl: post.imageUrl,
  location: post.location,
  createdAt: post.createdAt,
  authorId: post.author.id,
  username: post.author.username,
  avatarUrl: post.author.avatarUrl,
  likesCount: post.likes.length,
  commentsCount: post.comments.length,
  comments: includeComments
    ? post.comments.map((c) => ({
        id: c.id,
        text: c.text,
        parentId: c.parentId,
        createdAt: c.createdAt,
        username: c.author.username,
        avatarUrl: c.author.avatarUrl,
      }))
    : post.comments.slice(-2).map((c) => ({
        id: c.id,
        text: c.text,
        parentId: c.parentId,
        createdAt: c.createdAt,
        username: c.author.username,
        avatarUrl: c.author.avatarUrl,
      })),
  isLiked: requestUserId ? post.likes.some((l) => l.userId === requestUserId) : false,
  isSaved: requestUserId ? post.saves.some((s) => s.userId === requestUserId) : false,
});

const createPost = async (currentUserId, payload) => {
  const { imageUrl, caption, location } = payload;

  if (!imageUrl) {
    throw new AppError('imageUrl is required', 400);
  }

  const post = await Post.create({
    userId: currentUserId,
    imageUrl,
    caption: caption || null,
    location: location || null,
  });

  return { post };
};

const getFeed = async (currentUserId) => {
  const following = await Follower.findAll({
    where: { followerId: currentUserId },
    attributes: ['followingId'],
  });

  const followingIds = following.map((f) => f.followingId);
  followingIds.push(currentUserId);

  const posts = await Post.findAll({
    where: { userId: followingIds },
    include: postInclude,
    order: [['createdAt', 'DESC']],
  });

  return {
    posts: posts.map((p) => formatPost(p, currentUserId, false)),
  };
};

const getPostById = async (postId, requestUserId = null) => {
  const post = await Post.findByPk(postId, { include: postInclude });

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  return {
    post: formatPost(post, requestUserId, true),
  };
};

const deletePost = async (postId, currentUserId) => {
  const post = await Post.findByPk(postId);

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  if (post.userId !== currentUserId) {
    throw new AppError('You can only delete your own posts', 403);
  }

  await post.destroy();
};

module.exports = {
  createPost,
  getFeed,
  getPostById,
  deletePost,
};


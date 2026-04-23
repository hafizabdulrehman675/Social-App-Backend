'use strict';

const { User, Post, Like, SavedPost, Comment } = require('../models');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// ─── Helper: format a single post for frontend ────────────────────────────────
// Attaches: author info, likesCount, commentsCount, isLiked, isSaved
// requestUserId = the logged-in user's id (to compute isLiked / isSaved)
const formatPost = (post, requestUserId) => ({
  id: post.id,
  caption: post.caption,
  imageUrl: post.imageUrl,
  location: post.location,
  createdAt: post.createdAt,
  // author fields (joined via include)
  authorId: post.author.id,
  username: post.author.username,
  avatarUrl: post.author.avatarUrl,
  // computed counts
  likesCount: post.likes.length,
  commentsCount: post.comments.length,
  // did the requesting user like / save this post?
  isLiked: requestUserId
    ? post.likes.some((l) => l.userId === requestUserId)
    : false,
  isSaved: requestUserId
    ? post.saves.some((s) => s.userId === requestUserId)
    : false,
});

// ─── CREATE POST ──────────────────────────────────────────────────────────────
// Route:   POST /api/posts
// Access:  Protected
// Body:    { imageUrl, caption?, location? }
exports.createPost = catchAsync(async (req, res, next) => {
  const { imageUrl, caption, location } = req.body;

  if (!imageUrl) {
    return next(new AppError('imageUrl is required', 400));
  }

  const post = await Post.create({
    userId: req.user.id,
    imageUrl,
    caption: caption || null,
    location: location || null,
  });

  res.status(201).json({
    status: 'success',
    data: { post },
  });
});

// ─── GET FEED ─────────────────────────────────────────────────────────────────
// Route:   GET /api/posts/feed
// Access:  Protected
// Returns: posts from people the logged-in user follows, newest first
exports.getFeed = catchAsync(async (req, res, next) => {
  // 1) Find all userIds that req.user follows
  const { Follower } = require('../models');
  const following = await Follower.findAll({
    where: { followerId: req.user.id },
    attributes: ['followingId'],
  });

  // Extract ids + include own posts in feed
  const followingIds = following.map((f) => f.followingId);
  followingIds.push(req.user.id);

  // 2) Fetch posts from those users with all needed data in one query
  const posts = await Post.findAll({
    where: { userId: followingIds },
    include: [
      { model: User,    as: 'author',   attributes: ['id', 'username', 'avatarUrl'] },
      { model: Like,    as: 'likes',    attributes: ['userId'] },
      { model: SavedPost, as: 'saves',  attributes: ['userId'] },
      { model: Comment, as: 'comments', attributes: ['id'] },
    ],
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    status: 'success',
    data: {
      posts: posts.map((p) => formatPost(p, req.user.id)),
    },
  });
});

// ─── GET SINGLE POST ──────────────────────────────────────────────────────────
// Route:   GET /api/posts/:postId
// Access:  Public
exports.getPost = catchAsync(async (req, res, next) => {
  const post = await Post.findByPk(req.params.postId, {
    include: [
      { model: User,    as: 'author',   attributes: ['id', 'username', 'avatarUrl'] },
      { model: Like,    as: 'likes',    attributes: ['userId'] },
      { model: SavedPost, as: 'saves',  attributes: ['userId'] },
      { model: Comment, as: 'comments', attributes: ['id'] },
    ],
  });

  if (!post) {
    return next(new AppError('Post not found', 404));
  }

  // req.user may be undefined on public access — pass null so isLiked/isSaved = false
  const requestUserId = req.user ? req.user.id : null;

  res.status(200).json({
    status: 'success',
    data: { post: formatPost(post, requestUserId) },
  });
});

// ─── DELETE POST ──────────────────────────────────────────────────────────────
// Route:   DELETE /api/posts/:postId
// Access:  Protected (only post owner)
exports.deletePost = catchAsync(async (req, res, next) => {
  const post = await Post.findByPk(req.params.postId);

  if (!post) {
    return next(new AppError('Post not found', 404));
  }

  // Only the owner can delete their post
  if (post.userId !== req.user.id) {
    return next(new AppError('You can only delete your own posts', 403));
  }

  await post.destroy();

  res.status(200).json({
    status: 'success',
    message: 'Post deleted',
  });
});

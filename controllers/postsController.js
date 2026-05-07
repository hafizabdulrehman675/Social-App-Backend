'use strict';

const catchAsync = require('../utils/catchAsync');
const postsService = require('../services/postsService');
const { resolveUploadedImageUrl } = require('../utils/mediaStorage');

exports.createPost = catchAsync(async (req, res, next) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const imageUrlFromFile = await resolveUploadedImageUrl(req.file, {
    baseUrl,
    localSubdir: 'posts',
    cloudinaryFolder: 'social-app/posts',
    publicIdPrefix: 'post',
  });
  const data = await postsService.createPost(req.user.id, req.body, imageUrlFromFile);

  res.status(201).json({
    status: 'success',
    data,
  });
});

exports.getFeed = catchAsync(async (req, res, next) => {
  const data = await postsService.getFeed(req.user.id);

  res.status(200).json({
    status: 'success',
    data,
  });
});

exports.getPost = catchAsync(async (req, res, next) => {
  const requestUserId = req.user ? req.user.id : null;
  const data = await postsService.getPostById(req.params.postId, requestUserId);

  res.status(200).json({
    status: 'success',
    data,
  });
});

exports.deletePost = catchAsync(async (req, res, next) => {
  await postsService.deletePost(req.params.postId, req.user.id);

  res.status(200).json({
    status: 'success',
    message: 'Post deleted',
  });
});

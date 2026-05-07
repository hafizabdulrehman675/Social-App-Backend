'use strict';

const catchAsync = require('../utils/catchAsync');
const usersService = require('../services/usersService');

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const data = await usersService.getAllUsers(req.user.id);

  res.status(200).json({
    status: 'success',
    data,
  });
});

exports.getProfile = catchAsync(async (req, res, next) => {
  const data = await usersService.getProfileByUsername(req.params.username);

  res.status(200).json({
    status: 'success',
    data,
  });
});

exports.updateProfile = catchAsync(async (req, res, next) => {
  const data = await usersService.updateMyProfile(req.user.id, req.body);

  res.status(200).json({
    status: 'success',
    data,
  });
});

exports.updateAvatar = catchAsync(async (req, res, next) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const data = await usersService.updateMyAvatar(req.user.id, req.file, baseUrl);

  res.status(200).json({
    status: 'success',
    data,
  });
});

exports.searchUsers = catchAsync(async (req, res, next) => {
  const data = await usersService.searchUsers(req.query.q);

  res.status(200).json({
    status: 'success',
    data,
  });
});

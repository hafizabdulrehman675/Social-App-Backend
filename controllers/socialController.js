'use strict';

const catchAsync = require('../utils/catchAsync');
const socialService = require('../services/socialService');

// ─── SEND FOLLOW REQUEST ──────────────────────────────────────────────────────
// Route:   POST /api/social/follow/:userId
// Access:  Protected
// Frontend: sendFollowRequest({ fromUserId, toUserId })
exports.sendFollowRequest = catchAsync(async (req, res, next) => {
  const toUserId = parseInt(req.params.userId);
  const data = await socialService.sendFollowRequest({
    fromUserId: req.user.id,
    toUserId,
  });

  res.status(201).json({
    status: 'success',
    data,
  });
});

// ─── CANCEL REQUEST OR UNFOLLOW ───────────────────────────────────────────────
// Route:   DELETE /api/social/follow/:userId
// Access:  Protected
// Frontend: cancelFollowRequest OR unfollow — both use same endpoint
// Backend checks: pending request exists? cancel it. Following? unfollow.
exports.cancelOrUnfollow = catchAsync(async (req, res, next) => {
  const toUserId = parseInt(req.params.userId);
  const result = await socialService.cancelOrUnfollow({
    fromUserId: req.user.id,
    toUserId,
  });

  return res.status(200).json({
    status: 'success',
    message: result.message,
  });
});

// ─── GET PENDING REQUESTS (received) ──────────────────────────────────────────
// Route:   GET /api/social/follow-requests
// Access:  Protected
// Returns: all pending requests sent TO the logged-in user
exports.getFollowRequests = catchAsync(async (req, res, next) => {
  const data = await socialService.getFollowRequests({ toUserId: req.user.id });

  res.status(200).json({
    status: 'success',
    data: {
      requests: data.requests,
    },
  });
});

// ─── ACCEPT OR REJECT REQUEST ─────────────────────────────────────────────────
// Route:   PATCH /api/social/follow-requests/:requestId
// Access:  Protected
// Body:    { action: 'accept' | 'reject' }
// Frontend: acceptFollowRequest or rejectFollowRequest
exports.respondToRequest = catchAsync(async (req, res, next) => {
  const { action } = req.body;
  const data = await socialService.respondToRequest({
    requestId: req.params.requestId,
    action,
    recipientUserId: req.user.id,
  });

  res.status(200).json({
    status: 'success',
    message: data.message,
  });
});

// ─── GET FOLLOWERS LIST ───────────────────────────────────────────────────────
// Route:   GET /api/users/:username/followers
// Access:  Public
exports.getFollowers = catchAsync(async (req, res, next) => {
  const data = await socialService.getFollowers({ username: req.params.username });

  res.status(200).json({
    status: 'success',
    data,
  });
});

// ─── GET FOLLOWING LIST ───────────────────────────────────────────────────────
// Route:   GET /api/users/:username/following
// Access:  Public
exports.getFollowing = catchAsync(async (req, res, next) => {
  const data = await socialService.getFollowing({ username: req.params.username });

  res.status(200).json({
    status: 'success',
    data,
  });
});

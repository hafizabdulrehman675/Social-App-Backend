'use strict';

const { Follower, FollowRequest, User, Notification } = require('../models');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// ─── SEND FOLLOW REQUEST ──────────────────────────────────────────────────────
// Route:   POST /api/social/follow/:userId
// Access:  Protected
// Frontend: sendFollowRequest({ fromUserId, toUserId })
exports.sendFollowRequest = catchAsync(async (req, res, next) => {
  const toUserId = parseInt(req.params.userId);

  if (req.user.id === toUserId) {
    return next(new AppError('You cannot follow yourself', 400));
  }

  const targetUser = await User.findByPk(toUserId);
  if (!targetUser) return next(new AppError('User not found', 404));

  // Check already following
  const alreadyFollowing = await Follower.findOne({
    where: { followerId: req.user.id, followingId: toUserId },
  });
  if (alreadyFollowing) return next(new AppError('You already follow this user', 400));

  // Check already has pending request
  const existingRequest = await FollowRequest.findOne({
    where: { fromUserId: req.user.id, toUserId, status: 'pending' },
  });
  if (existingRequest) return next(new AppError('Follow request already sent', 400));

  const request = await FollowRequest.create({
    fromUserId: req.user.id,
    toUserId,
    status: 'pending',
  });

  // Notify the target user
  await Notification.create({
    recipientId: toUserId,
    senderId: req.user.id,
    type: 'follow_request',
    postId: null,
  });

  res.status(201).json({
    status: 'success',
    data: { requestId: request.id, status: 'pending' },
  });
});

// ─── CANCEL REQUEST OR UNFOLLOW ───────────────────────────────────────────────
// Route:   DELETE /api/social/follow/:userId
// Access:  Protected
// Frontend: cancelFollowRequest OR unfollow — both use same endpoint
// Backend checks: pending request exists? cancel it. Following? unfollow.
exports.cancelOrUnfollow = catchAsync(async (req, res, next) => {
  const toUserId = parseInt(req.params.userId);

  // Case 1: cancel a pending follow request
  const pendingRequest = await FollowRequest.findOne({
    where: { fromUserId: req.user.id, toUserId, status: 'pending' },
  });
  if (pendingRequest) {
    await pendingRequest.destroy();
    return res.status(200).json({
      status: 'success',
      message: 'Follow request cancelled',
    });
  }

  // Case 2: unfollow
  const follow = await Follower.findOne({
    where: { followerId: req.user.id, followingId: toUserId },
  });
  if (follow) {
    await follow.destroy();
    return res.status(200).json({
      status: 'success',
      message: 'Unfollowed successfully',
    });
  }

  return next(new AppError('No follow relationship found', 404));
});

// ─── GET PENDING REQUESTS (received) ──────────────────────────────────────────
// Route:   GET /api/social/follow-requests
// Access:  Protected
// Returns: all pending requests sent TO the logged-in user
exports.getFollowRequests = catchAsync(async (req, res, next) => {
  const requests = await FollowRequest.findAll({
    where: { toUserId: req.user.id, status: 'pending' },
    include: [
      { model: User, as: 'sender', attributes: ['id', 'username', 'fullName', 'avatarUrl'] },
    ],
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    status: 'success',
    data: {
      requests: requests.map((r) => ({
        id: r.id,
        fromUserId: r.fromUserId,
        toUserId: r.toUserId,
        status: r.status,
        createdAt: r.createdAt,
        sender: r.sender,
      })),
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

  if (!['accept', 'reject'].includes(action)) {
    return next(new AppError('action must be accept or reject', 400));
  }

  const request = await FollowRequest.findByPk(req.params.requestId);
  if (!request) return next(new AppError('Follow request not found', 404));

  // Only the recipient can accept/reject
  if (request.toUserId !== req.user.id) {
    return next(new AppError('Not authorized', 403));
  }

  if (request.status !== 'pending') {
    return next(new AppError('Request already handled', 400));
  }

  if (action === 'accept') {
    // Create the actual follow relationship
    await Follower.create({
      followerId: request.fromUserId,
      followingId: request.toUserId,
    });

    // Notify sender that their request was accepted
    await Notification.create({
      recipientId: request.fromUserId,
      senderId: req.user.id,
      type: 'follow',
      postId: null,
    });
  }

  // Delete request whether accepted or rejected
  await request.destroy();

  res.status(200).json({
    status: 'success',
    message: action === 'accept' ? 'Request accepted' : 'Request rejected',
  });
});

// ─── GET FOLLOWERS LIST ───────────────────────────────────────────────────────
// Route:   GET /api/users/:username/followers
// Access:  Public
exports.getFollowers = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ where: { username: req.params.username } });
  if (!user) return next(new AppError('User not found', 404));

  const followers = await Follower.findAll({
    where: { followingId: user.id },
    include: [
      { model: User, as: 'follower', attributes: ['id', 'username', 'fullName', 'avatarUrl'] },
    ],
  });

  res.status(200).json({
    status: 'success',
    data: {
      followers: followers.map((f) => f.follower),
    },
  });
});

// ─── GET FOLLOWING LIST ───────────────────────────────────────────────────────
// Route:   GET /api/users/:username/following
// Access:  Public
exports.getFollowing = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ where: { username: req.params.username } });
  if (!user) return next(new AppError('User not found', 404));

  const following = await Follower.findAll({
    where: { followerId: user.id },
    include: [
      { model: User, as: 'following', attributes: ['id', 'username', 'fullName', 'avatarUrl'] },
    ],
  });

  res.status(200).json({
    status: 'success',
    data: {
      following: following.map((f) => f.following),
    },
  });
});

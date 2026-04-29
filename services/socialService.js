'use strict';

const { Follower, FollowRequest, User, Notification } = require('../models');
const AppError = require('../utils/appError');

const getMySocialState = async ({ myUserId }) => {
  const follows = await Follower.findAll({
    attributes: ['followerId', 'followingId'],
  });

  const followingByUserId = {};
  for (const row of follows) {
    const followerId = String(row.followerId);
    const followingId = String(row.followingId);
    if (!followingByUserId[followerId]) {
      followingByUserId[followerId] = [];
    }
    followingByUserId[followerId].push(followingId);
  }

  const requests = await FollowRequest.findAll({
    where: {
      status: 'pending',
    },
  });

  const requestsById = {};
  for (const req of requests) {
    if (req.fromUserId !== myUserId && req.toUserId !== myUserId) continue;
    requestsById[String(req.id)] = {
      id: String(req.id),
      fromUserId: String(req.fromUserId),
      toUserId: String(req.toUserId),
      status: req.status,
    };
  }

  return {
    followingByUserId,
    requestsById,
  };
};

const sendFollowRequest = async ({ fromUserId, toUserId }) => {
  if (fromUserId === toUserId) {
    throw new AppError('You cannot follow yourself', 400);
  }

  const targetUser = await User.findByPk(toUserId);
  if (!targetUser) throw new AppError('User not found', 404);

  const alreadyFollowing = await Follower.findOne({
    where: { followerId: fromUserId, followingId: toUserId },
  });
  if (alreadyFollowing) throw new AppError('You already follow this user', 400);

  const existingRequest = await FollowRequest.findOne({
    where: { fromUserId, toUserId, status: 'pending' },
  });
  if (existingRequest) throw new AppError('Follow request already sent', 400);

  const request = await FollowRequest.create({
    fromUserId,
    toUserId,
    status: 'pending',
  });

  await Notification.create({
    recipientId: toUserId,
    senderId: fromUserId,
    type: 'follow_request',
    postId: null,
  });

  return { requestId: request.id, status: 'pending' };
};

const cancelOrUnfollow = async ({ fromUserId, toUserId }) => {
  // Case 1: cancel a pending follow request
  const pendingRequest = await FollowRequest.findOne({
    where: { fromUserId, toUserId, status: 'pending' },
  });

  if (pendingRequest) {
    await pendingRequest.destroy();
    return { action: 'cancel', message: 'Follow request cancelled' };
  }

  // Case 2: unfollow
  const follow = await Follower.findOne({
    where: { followerId: fromUserId, followingId: toUserId },
  });

  if (follow) {
    await follow.destroy();
    return { action: 'unfollow', message: 'Unfollowed successfully' };
  }

  throw new AppError('No follow relationship found', 404);
};

const getFollowRequests = async ({ toUserId }) => {
  const requests = await FollowRequest.findAll({
    where: { toUserId, status: 'pending' },
    include: [{ model: User, as: 'sender', attributes: ['id', 'username', 'fullName', 'avatarUrl'] }],
    order: [['createdAt', 'DESC']],
  });

  return {
    requests: requests.map((r) => ({
      id: r.id,
      fromUserId: r.fromUserId,
      toUserId: r.toUserId,
      status: r.status,
      createdAt: r.createdAt,
      sender: r.sender,
    })),
  };
};

const respondToRequest = async ({ requestId, action, recipientUserId }) => {
  if (!['accept', 'reject'].includes(action)) {
    throw new AppError('action must be accept or reject', 400);
  }

  const request = await FollowRequest.findByPk(requestId);
  if (!request) throw new AppError('Follow request not found', 404);

  if (request.toUserId !== recipientUserId) {
    throw new AppError('Not authorized', 403);
  }

  if (request.status !== 'pending') {
    throw new AppError('Request already handled', 400);
  }

  if (action === 'accept') {
    await Follower.create({
      followerId: request.fromUserId,
      followingId: request.toUserId,
    });

    await Notification.create({
      recipientId: request.fromUserId,
      senderId: recipientUserId,
      type: 'follow',
      postId: null,
    });
  }

  await request.destroy();

  return {
    message: action === 'accept' ? 'Request accepted' : 'Request rejected',
  };
};

const getFollowers = async ({ username }) => {
  const user = await User.findOne({ where: { username } });
  if (!user) throw new AppError('User not found', 404);

  const followers = await Follower.findAll({
    where: { followingId: user.id },
    include: [{ model: User, as: 'follower', attributes: ['id', 'username', 'fullName', 'avatarUrl'] }],
  });

  return { followers: followers.map((f) => f.follower) };
};

const getFollowing = async ({ username }) => {
  const user = await User.findOne({ where: { username } });
  if (!user) throw new AppError('User not found', 404);

  const following = await Follower.findAll({
    where: { followerId: user.id },
    include: [{ model: User, as: 'following', attributes: ['id', 'username', 'fullName', 'avatarUrl'] }],
  });

  return { following: following.map((f) => f.following) };
};

module.exports = {
  getMySocialState,
  sendFollowRequest,
  cancelOrUnfollow,
  getFollowRequests,
  respondToRequest,
  getFollowers,
  getFollowing,
};


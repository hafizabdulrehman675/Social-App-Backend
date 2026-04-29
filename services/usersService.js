'use strict';

const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { User, Post, Follower } = require('../models');
const AppError = require('../utils/appError');

const formatUser = (user) => ({
  id: user.id,
  username: user.username,
  fullName: user.fullName,
  email: user.email,
  avatarUrl: user.avatarUrl,
  bio: user.bio,
});

const getAllUsers = async (currentUserId) => {
  const users = await User.findAll({
    where: { id: { [Op.ne]: currentUserId } },
    attributes: ['id', 'username', 'fullName', 'avatarUrl', 'bio'],
    order: [['createdAt', 'DESC']],
  });

  return { users };
};

const getProfileByUsername = async (username) => {
  const user = await User.findOne({ where: { username } });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const [postsCount, followersCount, followingCount] = await Promise.all([
    Post.count({ where: { userId: user.id } }),
    Follower.count({ where: { followingId: user.id } }),
    Follower.count({ where: { followerId: user.id } }),
  ]);

  return {
    user: {
      ...formatUser(user),
      postsCount,
      followersCount,
      followingCount,
    },
  };
};

const updateMyProfile = async (currentUserId, payload) => {
  const { fullName, username, email, bio, currentPassword, newPassword } = payload;

  if (!fullName || !username || !email) {
    throw new AppError('fullName, username and email are required', 400);
  }

  if (!currentPassword) {
    throw new AppError('Current password is required to save changes', 400);
  }

  const user = await User.findByPk(currentUserId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isCorrect = await bcrypt.compare(currentPassword, user.password);
  if (!isCorrect) {
    throw new AppError('Current password is incorrect', 401);
  }

  const takenUsername = await User.findOne({
    where: { username, id: { [Op.ne]: user.id } },
  });
  if (takenUsername) {
    throw new AppError('Username already taken', 400);
  }

  const takenEmail = await User.findOne({
    where: { email, id: { [Op.ne]: user.id } },
  });
  if (takenEmail) {
    throw new AppError('Email already in use', 400);
  }

  user.fullName = fullName.trim();
  user.username = username.trim();
  user.email = email.trim();

  if (bio !== undefined) {
    user.bio = bio.trim();
  }

  if (newPassword) {
    if (newPassword.length < 6) {
      throw new AppError('New password must be at least 6 characters', 400);
    }
    user.password = await bcrypt.hash(newPassword, 12);
  }

  await user.save();

  return { user: formatUser(user) };
};

const searchUsers = async (query) => {
  const q = (query || '').trim();

  if (!q) {
    return { users: [] };
  }

  const users = await User.findAll({
    where: {
      [Op.or]: [
        { username: { [Op.iLike]: `%${q}%` } },
        { fullName: { [Op.iLike]: `%${q}%` } },
      ],
    },
    limit: 20,
    attributes: ['id', 'username', 'fullName', 'avatarUrl', 'bio'],
  });

  return {
    users: users.map((u) => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      avatarUrl: u.avatarUrl,
      bio: u.bio,
    })),
  };
};

module.exports = {
  getAllUsers,
  getProfileByUsername,
  updateMyProfile,
  searchUsers,
};

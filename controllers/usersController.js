'use strict';

const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { User, Post, Follower } = require('../models');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// ─── Helper: Format User for Frontend ─────────────────────────────────────────
// Same pattern as authController — strips password, shapes object for frontend
// Added `bio` field since ProfilePage and EditProfilePage both need it
const formatUser = (user) => ({
  id: user.id,
  username: user.username,
  fullName: user.fullName,
  email: user.email,
  avatarUrl: user.avatarUrl,
  bio: user.bio,
});

// ─── GET PROFILE ──────────────────────────────────────────────────────────────
// Route:   GET /api/users/:username
// Access:  Public (anyone can view a profile)
//
// ProfilePage needs: user fields + postsCount + followersCount + followingCount
// We run all 3 COUNT queries in parallel with Promise.all for speed
exports.getProfile = catchAsync(async (req, res, next) => {
  // Find user by username (from URL param e.g. /api/users/abdulrehman)
  const user = await User.findOne({ where: { username: req.params.username } });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Run 3 COUNT queries simultaneously instead of waiting for each one
  // Post.count = how many posts this user has created
  // Follower.count where followingId = user.id → people who follow THIS user
  // Follower.count where followerId = user.id → people THIS user follows
  const [postsCount, followersCount, followingCount] = await Promise.all([
    Post.count({ where: { userId: user.id } }),
    Follower.count({ where: { followingId: user.id } }),
    Follower.count({ where: { followerId: user.id } }),
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      user: {
        ...formatUser(user),
        postsCount,
        followersCount,
        followingCount,
      },
    },
  });
});

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────
// Route:   PUT /api/users/me
// Access:  Protected (req.user set by protect middleware)
//
// EditProfilePage sends: fullName, username, email, bio, currentPassword, newPassword(optional)
// Logic: verify current password → check uniqueness → save → return updated user
exports.updateProfile = catchAsync(async (req, res, next) => {
  const { fullName, username, email, bio, currentPassword, newPassword } = req.body;

  if (!fullName || !username || !email) {
    return next(new AppError('fullName, username and email are required', 400));
  }

  // currentPassword is always required — prevents someone who grabbed a token
  // from silently changing account details
  if (!currentPassword) {
    return next(new AppError('Current password is required to save changes', 400));
  }

  // Fetch the full user record (including password hash) from DB
  // req.user.id was set by the protect middleware after verifying the JWT
  const user = await User.findByPk(req.user.id);

  // bcrypt.compare: hashes the entered password and compares to stored hash
  const isCorrect = await bcrypt.compare(currentPassword, user.password);
  if (!isCorrect) {
    return next(new AppError('Current password is incorrect', 401));
  }

  // Op.ne = "not equal" — ensures we're only checking OTHER users, not ourselves
  // Without this, changing nothing would fail because "your own username is taken"
  const takenUsername = await User.findOne({
    where: { username, id: { [Op.ne]: user.id } },
  });
  if (takenUsername) {
    return next(new AppError('Username already taken', 400));
  }

  const takenEmail = await User.findOne({
    where: { email, id: { [Op.ne]: user.id } },
  });
  if (takenEmail) {
    return next(new AppError('Email already in use', 400));
  }

  // Apply changes to the user instance
  user.fullName = fullName.trim();
  user.username = username.trim();
  user.email = email.trim();
  // Only update bio if provided; keep existing value otherwise
  if (bio !== undefined) user.bio = bio.trim();

  // Only hash and update password if a new one was provided
  if (newPassword) {
    if (newPassword.length < 6) {
      return next(new AppError('New password must be at least 6 characters', 400));
    }
    user.password = await bcrypt.hash(newPassword, 12);
  }

  // user.save() runs an UPDATE SQL only for the fields that changed
  await user.save();

  res.status(200).json({
    status: 'success',
    data: {
      user: formatUser(user),
    },
  });
});

// ─── SEARCH USERS ─────────────────────────────────────────────────────────────
// Route:   GET /api/users/search?q=query
// Access:  Protected
//
// ExplorePage search bar — matches username OR fullName, case-insensitive
exports.searchUsers = catchAsync(async (req, res, next) => {
  const q = (req.query.q || '').trim();

  // Return empty array for blank query — no need to hit DB
  if (!q) {
    return res.status(200).json({ status: 'success', data: { users: [] } });
  }

  // Op.iLike = case-insensitive LIKE (PostgreSQL only)
  // `%${q}%` = matches query anywhere in the string (prefix, middle, suffix)
  // Op.or = username OR fullName must match
  // limit: 20 = cap results to avoid huge responses
  // attributes: only select fields we need — never expose password
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

  res.status(200).json({
    status: 'success',
    data: {
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        fullName: u.fullName,
        avatarUrl: u.avatarUrl,
        bio: u.bio,
      })),
    },
  });
});

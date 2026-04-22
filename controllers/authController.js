'use strict';

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// ─── Helper: Generate JWT Token ───────────────────────────────────────────────
// JWT = JSON Web Token — a string that proves who the user is
// Structure: header.payload.signature
// Payload contains userId — backend reads this to know who is making request
// Frontend stores this token and sends it with every request
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },                   // payload — what we store inside token
    process.env.JWT_SECRET,           // secret key — used to sign and verify
    { expiresIn: '30d' }              // token expires in 30 days
  );
};

// ─── Helper: Format User for Frontend ─────────────────────────────────────────
// Removes password from user object before sending to frontend
// Frontend authSlice.loginSuccess() expects exactly this shape:
// { id, username, fullName, email, avatarUrl }
const formatUser = (user) => ({
  id: user.id,
  username: user.username,
  fullName: user.fullName,
  email: user.email,
  avatarUrl: user.avatarUrl,
});

// ─── REGISTER ─────────────────────────────────────────────────────────────────
// Route:   POST /api/auth/register
// Access:  Public (no token needed)
//
// Frontend flow:
// SignupPage → formik submit → POST /api/auth/register
// → dispatch(loginSuccess(user)) → dispatch saves user to authSlice
// → saveSession({ userId }) → stored in localStorage
// → redirect to feed
exports.register = catchAsync(async (req, res, next) => {
  const { username, fullName, email, password } = req.body;

  // 1) Check all fields provided
  if (!username || !fullName || !email || !password) {
    return next(new AppError('Please provide username, fullName, email and password', 400));
  }

  // 2) Check if email or username already taken
  // Matches frontend Yup validation: "email already registered"
  const existingUser = await User.findOne({
    where: { email }
  });
  if (existingUser) {
    return next(new AppError('Email already registered. Please use another.', 400));
  }

  const existingUsername = await User.findOne({
    where: { username }
  });
  if (existingUsername) {
    return next(new AppError('Username already taken. Please choose another.', 400));
  }

  // 3) Hash password — NEVER store plain text password
  // bcrypt adds a random "salt" and hashes 12 times
  // Even if DB is hacked, passwords cannot be reversed
  const hashedPassword = await bcrypt.hash(password, 12);

  // 4) Create user in DB
  const user = await User.create({
    username,
    fullName,
    email,
    password: hashedPassword,
    avatarUrl: null,
    bio: null,
  });

  // 5) Generate JWT token with user's id inside
  const token = generateToken(user.id);

  // 6) Send response
  // Frontend: dispatch(loginSuccess(data.data.user))
  // Frontend: stores token for future requests
  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: formatUser(user),
    },
  });
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
// Route:   POST /api/auth/login
// Access:  Public
//
// Frontend flow:
// LoginPage → formik submit → POST /api/auth/login
// → dispatch(loginSuccess(user)) → user saved to authSlice.user
// → saveSession({ userId }) → userId saved to localStorage
// → ProtectedRoute now allows access → redirect to feed
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check fields provided
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 2) Find user by email
  // We explicitly select password because model doesn't return it by default
  const user = await User.findOne({ where: { email } });
  if (!user) {
    // Vague message on purpose — don't tell attacker if email exists
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) Compare entered password with hashed password in DB
  // bcrypt.compare hashes the entered password and compares
  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 4) Generate token
  const token = generateToken(user.id);

  // 5) Send response matching frontend authSlice shape
  res.status(200).json({
    status: 'success',
    token,
    data: {
      user: formatUser(user),
    },
  });
});

// ─── GET ME ───────────────────────────────────────────────────────────────────
// Route:   GET /api/auth/me
// Access:  Protected (requires token)
//
// Frontend flow:
// App starts → reads userId from localStorage session
// → calls GET /api/auth/me with token in header
// → dispatch(loginSuccess(user)) → restores auth state
// → user stays logged in after page refresh
exports.getMe = catchAsync(async (req, res, next) => {
  // req.user is set by the protect middleware (reads token → finds user)
  const user = await User.findByPk(req.user.id);

  if (!user) {
    return next(new AppError('User no longer exists', 401));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: formatUser(user),
    },
  });
});

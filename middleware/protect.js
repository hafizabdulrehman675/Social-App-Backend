'use strict';

const jwt = require('jsonwebtoken');
const { User } = require('../models');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// ─── PROTECT MIDDLEWARE ───────────────────────────────────────────────────────
// Runs BEFORE protected route controllers
// Checks if request has a valid JWT token
// If valid → attaches user to req.user → controller runs
// If invalid → sends 401 error → controller never runs
//
// Frontend sends token like this in every request:
// headers: { Authorization: 'Bearer eyJhbGci...' }
//
// Flow:
// Request hits route
//       ↓
// protect middleware runs first
//       ↓
// Valid token? → req.user = user → next() → controller runs
// Invalid?     → next(AppError 401) → errorHandler sends 401
//       ↓
// Frontend receives 401 → redirects to login page

module.exports = catchAsync(async (req, res, next) => {

  // 1) Get token from Authorization header
  // Frontend sends: Authorization: "Bearer <token>"
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to continue.', 401));
  }

  // 2) Verify token is valid and not tampered
  // jwt.verify throws error if token is invalid or expired
  // catchAsync catches those errors → errorHandler handles them
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  // decoded = { id: 1, iat: ..., exp: ... }

  // 3) Check if user still exists in DB
  // Token could be valid but user was deleted
  const currentUser = await User.findByPk(decoded.id);
  if (!currentUser) {
    return next(new AppError('User belonging to this token no longer exists.', 401));
  }

  // 4) Attach user to request object
  // Now every controller can access req.user to know who is logged in
  req.user = currentUser;

  next(); // go to the actual controller
});

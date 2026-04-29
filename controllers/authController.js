'use strict';

const catchAsync = require('../utils/catchAsync');
const authService = require('../services/authService');

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
  const data = await authService.register(req.body);

  res.status(201).json({
    status: 'success',
    token: data.token,
    data: { user: data.user },
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
  const data = await authService.login(req.body);

  res.status(200).json({
    status: 'success',
    token: data.token,
    data: { user: data.user },
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
  const data = await authService.getMe(req.user.id);
  res.status(200).json({
    status: 'success',
    data: {
      user: data.user,
    },
  });
});

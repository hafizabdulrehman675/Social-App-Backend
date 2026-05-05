'use strict';

const catchAsync = require('../utils/catchAsync');
const notificationsService = require('../services/notificationsService');

// ─── GET MY NOTIFICATIONS ─────────────────────────────────────────────────────
// Route:   GET /api/notifications
// Access:  Protected
// Returns: all notifications for the logged-in user, newest first
// Types:   like, comment, follow, follow_request
exports.getNotifications = catchAsync(async (req, res, next) => {
  const data = await notificationsService.getNotifications({ recipientId: req.user.id });

  res.status(200).json({
    status: 'success',
    data: {
      notifications: data.notifications,
    },
  });
});

// ─── MARK ONE AS READ ─────────────────────────────────────────────────────────
// Route:   PATCH /api/notifications/:id/read
// Access:  Protected
exports.markOneRead = catchAsync(async (req, res, next) => {
  const data = await notificationsService.markOneRead({
    notificationId: req.params.id,
    recipientId: req.user.id,
  });

  res.status(200).json({
    status: 'success',
    data,
  });
});

// ─── MARK ALL AS READ ─────────────────────────────────────────────────────────
// Route:   PATCH /api/notifications/read-all
// Access:  Protected
exports.markAllRead = catchAsync(async (req, res, next) => {
  const data = await notificationsService.markAllRead({ recipientId: req.user.id });

  res.status(200).json({
    status: 'success',
    message: data.message,
  });
});

// ─── DELETE ALL NOTIFICATIONS ──────────────────────────────────────────────────
// Route:   DELETE /api/notifications/all
// Access:  Protected
exports.deleteAll = catchAsync(async (req, res, next) => {
  const data = await notificationsService.deleteAll({ recipientId: req.user.id });

  res.status(200).json({
    status: 'success',
    message: data.message,
    data: {
      deletedCount: data.deletedCount,
    },
  });
});

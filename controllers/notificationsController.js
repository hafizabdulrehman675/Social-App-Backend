'use strict';

const { Notification, User, Post } = require('../models');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// ─── GET MY NOTIFICATIONS ─────────────────────────────────────────────────────
// Route:   GET /api/notifications
// Access:  Protected
// Returns: all notifications for the logged-in user, newest first
// Types:   like, comment, follow, follow_request
exports.getNotifications = catchAsync(async (req, res, next) => {
  const notifications = await Notification.findAll({
    where: { recipientId: req.user.id },
    include: [
      {
        model: User,
        as: 'sender',
        attributes: ['id', 'username', 'avatarUrl'],
      },
      {
        model: Post,
        as: 'post',
        attributes: ['id', 'imageUrl'],
        required: false, // left join — follow notifications have no post
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    status: 'success',
    data: {
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        isRead: n.isRead,
        createdAt: n.createdAt,
        sender: n.sender,
        post: n.post || null,
      })),
    },
  });
});

// ─── MARK ONE AS READ ─────────────────────────────────────────────────────────
// Route:   PATCH /api/notifications/:id/read
// Access:  Protected
exports.markOneRead = catchAsync(async (req, res, next) => {
  const notification = await Notification.findByPk(req.params.id);

  if (!notification) return next(new AppError('Notification not found', 404));

  // Only recipient can mark their own notification as read
  if (notification.recipientId !== req.user.id) {
    return next(new AppError('Not authorized', 403));
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({
    status: 'success',
    data: { id: notification.id, isRead: true },
  });
});

// ─── MARK ALL AS READ ─────────────────────────────────────────────────────────
// Route:   PATCH /api/notifications/read-all
// Access:  Protected
exports.markAllRead = catchAsync(async (req, res, next) => {
  await Notification.update(
    { isRead: true },
    { where: { recipientId: req.user.id, isRead: false } },
  );

  res.status(200).json({
    status: 'success',
    message: 'All notifications marked as read',
  });
});

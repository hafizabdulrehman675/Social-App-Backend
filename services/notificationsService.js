'use strict';

const { Notification, User, Post } = require('../models');
const AppError = require('../utils/appError');

const getNotifications = async ({ recipientId }) => {
  const notifications = await Notification.findAll({
    where: { recipientId },
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
        required: false, // follow notifications have no post
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  return {
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      isRead: n.isRead,
      createdAt: n.createdAt,
      sender: n.sender,
      post: n.post || null,
    })),
  };
};

const markOneRead = async ({ notificationId, recipientId }) => {
  const notification = await Notification.findByPk(notificationId);
  if (!notification) throw new AppError('Notification not found', 404);

  if (notification.recipientId !== recipientId) {
    throw new AppError('Not authorized', 403);
  }

  notification.isRead = true;
  await notification.save();

  return { id: notification.id, isRead: true };
};

const markAllRead = async ({ recipientId }) => {
  await Notification.update(
    { isRead: true },
    { where: { recipientId, isRead: false } },
  );

  return { message: 'All notifications marked as read' };
};

module.exports = {
  getNotifications,
  markOneRead,
  markAllRead,
};


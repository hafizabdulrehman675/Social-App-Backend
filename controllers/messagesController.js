'use strict';

const { Op } = require('sequelize');
const {
  MessageThread,
  ThreadParticipant,
  Message,
  MessageRead,
  User,
} = require('../models');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// ─── Helper: find thread shared between two users ─────────────────────────────
async function findThreadBetween(userAId, userBId) {
  // Get all threadIds for userA
  const aParticipations = await ThreadParticipant.findAll({
    where: { userId: userAId },
    attributes: ['threadId'],
  });
  const aThreadIds = aParticipations.map((p) => p.threadId);
  if (!aThreadIds.length) return null;

  // From those, find one where userB is also a participant
  const shared = await ThreadParticipant.findOne({
    where: { userId: userBId, threadId: { [Op.in]: aThreadIds } },
  });
  return shared ? shared.threadId : null;
}

// ─── Helper: format thread for frontend ───────────────────────────────────────
// Frontend ThreadEntity needs: id, peer, participantIds, messageIds,
// unreadCountByUserId, lastReadMessageIdByUserId
async function formatThread(thread, myUserId) {
  const participants = await ThreadParticipant.findAll({
    where: { threadId: thread.id },
    include: [{ model: User, as: 'user', attributes: ['id', 'username', 'fullName', 'avatarUrl'] }],
  });

  const participantIds = participants.map((p) => String(p.userId));

  // Peer = the other person in the thread (not me)
  const peerParticipant = participants.find((p) => p.userId !== myUserId);
  const peer = peerParticipant
    ? {
        id: String(peerParticipant.user.id),
        username: peerParticipant.user.username,
        fullName: peerParticipant.user.fullName,
        avatarUrl: peerParticipant.user.avatarUrl,
        isOnline: false,
      }
    : null;

  // Get messages for messageIds array
  const messages = await Message.findAll({
    where: { threadId: thread.id },
    attributes: ['id'],
    order: [['createdAt', 'ASC']],
  });
  const messageIds = messages.map((m) => String(m.id));

  // Get read cursors for unreadCount and lastReadMessageId
  const readCursors = await MessageRead.findAll({
    where: { threadId: thread.id },
  });

  const lastReadMessageIdByUserId = {};
  const unreadCountByUserId = {};

  for (const p of participants) {
    const cursor = readCursors.find((r) => r.userId === p.userId);
    const lastReadId = cursor?.lastReadMessageId ?? null;
    lastReadMessageIdByUserId[String(p.userId)] = lastReadId ? String(lastReadId) : null;

    // Unread = messages after the last read message
    if (!lastReadId) {
      unreadCountByUserId[String(p.userId)] = messageIds.length;
    } else {
      const lastReadIndex = messageIds.findIndex((id) => id === String(lastReadId));
      unreadCountByUserId[String(p.userId)] = lastReadIndex === -1
        ? 0
        : messageIds.length - lastReadIndex - 1;
    }
  }

  return {
    id: String(thread.id),
    peer,
    participantIds,
    messageIds,
    unreadCountByUserId,
    lastReadMessageIdByUserId,
  };
}

// ─── GET ALL THREADS ──────────────────────────────────────────────────────────
// Route:   GET /api/messages/threads
// Access:  Protected
// Returns: all conversation threads for the logged-in user
exports.getThreads = catchAsync(async (req, res, next) => {
  const participations = await ThreadParticipant.findAll({
    where: { userId: req.user.id },
    attributes: ['threadId'],
  });

  const threadIds = participations.map((p) => p.threadId);

  if (!threadIds.length) {
    return res.status(200).json({ status: 'success', data: { threads: [] } });
  }

  const threads = await MessageThread.findAll({
    where: { id: { [Op.in]: threadIds } },
    order: [['updatedAt', 'DESC']],
  });

  const formatted = await Promise.all(
    threads.map((t) => formatThread(t, req.user.id)),
  );

  res.status(200).json({
    status: 'success',
    data: { threads: formatted },
  });
});

// ─── START OR GET THREAD ──────────────────────────────────────────────────────
// Route:   POST /api/messages/threads
// Access:  Protected
// Body:    { userId } — the other person
// If thread already exists between these two users, return it (no duplicate)
exports.startThread = catchAsync(async (req, res, next) => {
  const { userId } = req.body;

  if (!userId) return next(new AppError('userId is required', 400));
  if (parseInt(userId) === req.user.id) {
    return next(new AppError('Cannot message yourself', 400));
  }

  const otherUser = await User.findByPk(userId);
  if (!otherUser) return next(new AppError('User not found', 404));

  // Check if thread already exists — return it instead of creating duplicate
  const existingThreadId = await findThreadBetween(req.user.id, parseInt(userId));
  if (existingThreadId) {
    const existing = await MessageThread.findByPk(existingThreadId);
    const formatted = await formatThread(existing, req.user.id);
    return res.status(200).json({ status: 'success', data: { thread: formatted } });
  }

  // Create new thread + add both users as participants
  const thread = await MessageThread.create({});
  await ThreadParticipant.bulkCreate([
    { threadId: thread.id, userId: req.user.id },
    { threadId: thread.id, userId: parseInt(userId) },
  ]);

  const formatted = await formatThread(thread, req.user.id);

  res.status(201).json({
    status: 'success',
    data: { thread: formatted },
  });
});

// ─── GET MESSAGES IN THREAD ───────────────────────────────────────────────────
// Route:   GET /api/messages/threads/:threadId
// Access:  Protected
exports.getMessages = catchAsync(async (req, res, next) => {
  // Verify user is a participant in this thread
  const participation = await ThreadParticipant.findOne({
    where: { threadId: req.params.threadId, userId: req.user.id },
  });
  if (!participation) return next(new AppError('Thread not found', 404));

  const messages = await Message.findAll({
    where: { threadId: req.params.threadId },
    order: [['createdAt', 'ASC']],
  });

  res.status(200).json({
    status: 'success',
    data: {
      messages: messages.map((m) => ({
        id: String(m.id),
        threadId: String(m.threadId),
        senderId: String(m.senderId),
        text: m.text,
        createdAt: m.createdAt,
        deliveryStatus: m.deliveryStatus,
        reacted: m.reacted || null,
      })),
    },
  });
});

// ─── SEND MESSAGE ─────────────────────────────────────────────────────────────
// Route:   POST /api/messages/threads/:threadId
// Access:  Protected
// Body:    { text, clientTempId? }
exports.sendMessage = catchAsync(async (req, res, next) => {
  const { text, clientTempId } = req.body;

  if (!text || !text.trim()) return next(new AppError('Message text is required', 400));

  // Verify user is a participant
  const participation = await ThreadParticipant.findOne({
    where: { threadId: req.params.threadId, userId: req.user.id },
  });
  if (!participation) return next(new AppError('Thread not found', 404));

  const message = await Message.create({
    threadId: req.params.threadId,
    senderId: req.user.id,
    text: text.trim(),
    deliveryStatus: 'sent',
  });

  // Bump thread updatedAt so it sorts first in thread list
  await MessageThread.update(
    { updatedAt: new Date() },
    { where: { id: req.params.threadId } },
  );

  res.status(201).json({
    status: 'success',
    data: {
      message: {
        id: String(message.id),
        threadId: String(message.threadId),
        senderId: String(message.senderId),
        text: message.text,
        createdAt: message.createdAt,
        deliveryStatus: message.deliveryStatus,
        clientTempId: clientTempId || null,
      },
    },
  });
});

// ─── MARK THREAD AS READ ──────────────────────────────────────────────────────
// Route:   PATCH /api/messages/threads/:threadId/read
// Access:  Protected
// Updates the read cursor to the last message in the thread
exports.markThreadRead = catchAsync(async (req, res, next) => {
  const participation = await ThreadParticipant.findOne({
    where: { threadId: req.params.threadId, userId: req.user.id },
  });
  if (!participation) return next(new AppError('Thread not found', 404));

  // Get last message in thread
  const lastMessage = await Message.findOne({
    where: { threadId: req.params.threadId },
    order: [['createdAt', 'DESC']],
  });

  // Upsert read cursor — create if not exists, update if exists
  await MessageRead.upsert({
    threadId: parseInt(req.params.threadId),
    userId: req.user.id,
    lastReadMessageId: lastMessage ? lastMessage.id : null,
  });

  res.status(200).json({
    status: 'success',
    data: {
      threadId: req.params.threadId,
      lastReadMessageId: lastMessage ? String(lastMessage.id) : null,
    },
  });
});

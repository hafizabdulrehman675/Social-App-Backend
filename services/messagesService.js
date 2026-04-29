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

// ─── Helper: find thread shared between two users ─────────────────────────────
async function findThreadBetween(userAId, userBId) {
  const aParticipations = await ThreadParticipant.findAll({
    where: { userId: userAId },
    attributes: ['threadId'],
  });
  const aThreadIds = aParticipations.map((p) => p.threadId);
  if (!aThreadIds.length) return null;

  const shared = await ThreadParticipant.findOne({
    where: { userId: userBId, threadId: { [Op.in]: aThreadIds } },
  });

  return shared ? shared.threadId : null;
}

// ─── Helper: format thread for frontend ───────────────────────────────────────
async function formatThread(thread, myUserId) {
  const participants = await ThreadParticipant.findAll({
    where: { threadId: thread.id },
    include: [{ model: User, as: 'user', attributes: ['id', 'username', 'fullName', 'avatarUrl'] }],
  });

  const participantIds = participants.map((p) => String(p.userId));

  // peer = the other person in thread (not me)
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

  // messages in the thread (for messageIds + unread counts)
  const messages = await Message.findAll({
    where: { threadId: thread.id },
    attributes: ['id'],
    order: [['createdAt', 'ASC']],
  });
  const messageIds = messages.map((m) => String(m.id));

  const readCursors = await MessageRead.findAll({
    where: { threadId: thread.id },
  });

  const lastReadMessageIdByUserId = {};
  const unreadCountByUserId = {};

  for (const p of participants) {
    const cursor = readCursors.find((r) => r.userId === p.userId);
    const lastReadId = cursor?.lastReadMessageId ?? null;
    lastReadMessageIdByUserId[String(p.userId)] = lastReadId ? String(lastReadId) : null;

    // Unread = messages after last read message
    if (!lastReadId) {
      unreadCountByUserId[String(p.userId)] = messageIds.length;
    } else {
      const lastReadIndex = messageIds.findIndex((id) => id === String(lastReadId));
      unreadCountByUserId[String(p.userId)] =
        lastReadIndex === -1 ? 0 : messageIds.length - lastReadIndex - 1;
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
const getThreads = async ({ myUserId }) => {
  const participations = await ThreadParticipant.findAll({
    where: { userId: myUserId },
    attributes: ['threadId'],
  });

  const threadIds = participations.map((p) => p.threadId);
  if (!threadIds.length) return { threads: [] };

  const threads = await MessageThread.findAll({
    where: { id: { [Op.in]: threadIds } },
    order: [['updatedAt', 'DESC']],
  });

  const formatted = await Promise.all(threads.map((t) => formatThread(t, myUserId)));
  return { threads: formatted };
};

// ─── START OR GET THREAD ──────────────────────────────────────────────────────
const startThread = async ({ myUserId, otherUserId }) => {
  if (!otherUserId) throw new AppError('userId is required', 400);
  const parsedOtherUserId = parseInt(otherUserId);

  if (parsedOtherUserId === myUserId) throw new AppError('Cannot message yourself', 400);

  const otherUser = await User.findByPk(parsedOtherUserId);
  if (!otherUser) throw new AppError('User not found', 404);

  const existingThreadId = await findThreadBetween(myUserId, parsedOtherUserId);
  if (existingThreadId) {
    const existing = await MessageThread.findByPk(existingThreadId);
    const formatted = await formatThread(existing, myUserId);
    return { thread: formatted, created: false };
  }

  const thread = await MessageThread.create({});
  await ThreadParticipant.bulkCreate([
    { threadId: thread.id, userId: myUserId },
    { threadId: thread.id, userId: parsedOtherUserId },
  ]);

  const formatted = await formatThread(thread, myUserId);
  return { thread: formatted, created: true };
};

// ─── GET MESSAGES IN THREAD ───────────────────────────────────────────────────
const getMessages = async ({ myUserId, threadId }) => {
  const participation = await ThreadParticipant.findOne({
    where: { threadId, userId: myUserId },
  });
  if (!participation) throw new AppError('Thread not found', 404);

  const messages = await Message.findAll({
    where: { threadId },
    order: [['createdAt', 'ASC']],
  });

  return {
    messages: messages.map((m) => ({
      id: String(m.id),
      threadId: String(m.threadId),
      senderId: String(m.senderId),
      text: m.text,
      createdAt: m.createdAt,
      deliveryStatus: m.deliveryStatus,
      reacted: m.reacted || null,
    })),
  };
};

// ─── SEND MESSAGE ─────────────────────────────────────────────────────────────
const sendMessage = async ({ myUserId, threadId, text, clientTempId }) => {
  if (!text || !text.trim()) throw new AppError('Message text is required', 400);

  const participation = await ThreadParticipant.findOne({
    where: { threadId, userId: myUserId },
  });
  if (!participation) throw new AppError('Thread not found', 404);

  const message = await Message.create({
    threadId,
    senderId: myUserId,
    text: text.trim(),
    deliveryStatus: 'sent',
  });

  // Bump thread updatedAt so it sorts first
  await MessageThread.update(
    { updatedAt: new Date() },
    { where: { id: threadId } },
  );

  return {
    message: {
      id: String(message.id),
      threadId: String(message.threadId),
      senderId: String(message.senderId),
      text: message.text,
      createdAt: message.createdAt,
      deliveryStatus: message.deliveryStatus,
      clientTempId: clientTempId || null,
    },
  };
};

// ─── MARK THREAD AS READ ──────────────────────────────────────────────────────
const markThreadRead = async ({ myUserId, threadId }) => {
  const participation = await ThreadParticipant.findOne({
    where: { threadId, userId: myUserId },
  });
  if (!participation) throw new AppError('Thread not found', 404);

  const lastMessage = await Message.findOne({
    where: { threadId },
    order: [['createdAt', 'DESC']],
  });

  await MessageRead.upsert({
    threadId: parseInt(threadId),
    userId: myUserId,
    lastReadMessageId: lastMessage ? lastMessage.id : null,
  });

  return {
    threadId,
    lastReadMessageId: lastMessage ? String(lastMessage.id) : null,
  };
};

module.exports = {
  getThreads,
  startThread,
  getMessages,
  sendMessage,
  markThreadRead,
};


'use strict';

const catchAsync = require('../utils/catchAsync');
const messagesService = require('../services/messagesService');

// ─── GET ALL THREADS ──────────────────────────────────────────────────────────
// Route:   GET /api/messages/threads
// Access:  Protected
// Returns: all conversation threads for the logged-in user
exports.getThreads = catchAsync(async (req, res, next) => {
  const data = await messagesService.getThreads({ myUserId: req.user.id });

  res.status(200).json({
    status: 'success',
    data: data,
  });
});

// ─── START OR GET THREAD ──────────────────────────────────────────────────────
// Route:   POST /api/messages/threads
// Access:  Protected
// Body:    { userId } — the other person
// If thread already exists between these two users, return it (no duplicate)
exports.startThread = catchAsync(async (req, res, next) => {
  const { thread, created } = await messagesService.startThread({
    myUserId: req.user.id,
    otherUserId: req.body.userId,
  });

  res.status(created ? 201 : 200).json({
    status: 'success',
    data: { thread },
  });
});

// ─── GET MESSAGES IN THREAD ───────────────────────────────────────────────────
// Route:   GET /api/messages/threads/:threadId
// Access:  Protected
exports.getMessages = catchAsync(async (req, res, next) => {
  const data = await messagesService.getMessages({
    myUserId: req.user.id,
    threadId: req.params.threadId,
  });

  res.status(200).json({
    status: 'success',
    data: {
      messages: data.messages,
    },
  });
});

// ─── SEND MESSAGE ─────────────────────────────────────────────────────────────
// Route:   POST /api/messages/threads/:threadId
// Access:  Protected
// Body:    { text, clientTempId? }
exports.sendMessage = catchAsync(async (req, res, next) => {
  const data = await messagesService.sendMessage({
    myUserId: req.user.id,
    threadId: req.params.threadId,
    text: req.body.text,
    clientTempId: req.body.clientTempId,
  });

  res.status(201).json({
    status: 'success',
    data: {
      message: data.message,
    },
  });
});

// ─── MARK THREAD AS READ ──────────────────────────────────────────────────────
// Route:   PATCH /api/messages/threads/:threadId/read
// Access:  Protected
// Updates the read cursor to the last message in the thread
exports.markThreadRead = catchAsync(async (req, res, next) => {
  const data = await messagesService.markThreadRead({
    myUserId: req.user.id,
    threadId: req.params.threadId,
  });

  res.status(200).json({
    status: 'success',
    data: {
      threadId: data.threadId,
      lastReadMessageId: data.lastReadMessageId,
    },
  });
});

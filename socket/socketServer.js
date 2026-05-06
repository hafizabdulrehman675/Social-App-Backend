'use strict';

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

let ioInstance = null;

function initSocketServer(httpServer) {
  if (ioInstance) return ioInstance;

  ioInstance = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  ioInstance.use(async (socket, next) => {
    try {
      const authHeader = socket.handshake.auth?.token || '';
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : authHeader;

      if (!token) {
        return next(new Error('Socket auth failed: token missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);
      if (!user) {
        return next(new Error('Socket auth failed: user not found'));
      }

      socket.user = { id: user.id };
      return next();
    } catch (_error) {
      return next(new Error('Socket auth failed: invalid token'));
    }
  });

  ioInstance.on('connection', (socket) => {
    const userId = String(socket.user.id);
    socket.join(`user:${userId}`);
    console.log(`[socket] connected user:${userId}`);

    socket.on('thread:join', (threadId) => {
      if (!threadId) return;
      socket.join(`thread:${String(threadId)}`);
    });

    socket.on('thread:leave', (threadId) => {
      if (!threadId) return;
      socket.leave(`thread:${String(threadId)}`);
    });

    socket.on('disconnect', () => {
      console.log(`[socket] disconnected user:${userId}`);
    });
  });

  return ioInstance;
}

function getSocketServer() {
  return ioInstance;
}

module.exports = {
  initSocketServer,
  getSocketServer,
};

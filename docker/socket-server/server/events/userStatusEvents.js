import { logger } from '../utils/logger.js';

const onlineUsers = new Map();

export const userStatusHandler = (io, socket) => {
  socket.on('user:online', (data) => {
    try {
      const { conversationIds = [] } = data;

      const userInfo = {
        userId: socket.userId,
        socketId: socket.id,
        lastSeen: new Date().toISOString(),
      };

      onlineUsers.set(socket.userId, userInfo);

      conversationIds.forEach((convId) => {
        socket.join(`conversation:${convId}`);
      });

      io.emit('user:status_changed', {
        userId: socket.userId,
        status: 'online',
        timestamp: new Date().toISOString(),
      });

      logger.info(`User ${socket.userId} is online`);
    } catch (error) {
      logger.error('Error setting user online:', error);
    }
  });

  socket.on('user:offline', () => {
    try {
      onlineUsers.delete(socket.userId);

      io.emit('user:status_changed', {
        userId: socket.userId,
        status: 'offline',
        lastSeen: new Date().toISOString(),
      });

      logger.info(`User ${socket.userId} is offline`);
    } catch (error) {
      logger.error('Error setting user offline:', error);
    }
  });

  socket.on('user:status', (data) => {
    try {
      const { status } = data;

      if (!status) {
        return;
      }

      const validStatuses = ['online', 'away', 'offline'];
      if (!validStatuses.includes(status)) {
        logger.warn(`Invalid status ${status} received from user ${socket.userId}`);
        return;
      }

      io.emit('user:status_changed', {
        userId: socket.userId,
        status,
        timestamp: new Date().toISOString(),
      });

      logger.info(`User ${socket.userId} status changed to ${status}`);
    } catch (error) {
      logger.error('Error updating user status:', error);
    }
  });

  socket.on('users:list', () => {
    try {
      const usersList = Array.from(onlineUsers.values());
      socket.emit('users:online', usersList);
      logger.info(`Sent online users list to user ${socket.userId}`);
    } catch (error) {
      logger.error('Error getting users list:', error);
    }
  });
};

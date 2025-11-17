import { logger } from '../utils/logger.js';

const typingTimeouts = new Map();

export const typingHandler = (io, socket) => {
  socket.on('typing:start', (data) => {
    try {
      const { conversationId } = data;

      if (!conversationId) {
        logger.warn('Missing conversationId for typing event');
        return;
      }

      io.to(`conversation:${conversationId}`).emit('typing:indicator', {
        userId: socket.userId,
        isTyping: true,
      });

      const timeoutKey = `${conversationId}:${socket.userId}`;
      const existingTimeout = typingTimeouts.get(timeoutKey);

      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const newTimeout = setTimeout(() => {
        io.to(`conversation:${conversationId}`).emit('typing:indicator', {
          userId: socket.userId,
          isTyping: false,
        });
        typingTimeouts.delete(timeoutKey);
      }, 5000);

      typingTimeouts.set(timeoutKey, newTimeout);

      logger.info(`User ${socket.userId} started typing in conversation ${conversationId}`);
    } catch (error) {
      logger.error('Error handling typing start:', error);
    }
  });

  socket.on('typing:stop', (data) => {
    try {
      const { conversationId } = data;

      if (!conversationId) {
        return;
      }

      const timeoutKey = `${conversationId}:${socket.userId}`;
      const existingTimeout = typingTimeouts.get(timeoutKey);

      if (existingTimeout) {
        clearTimeout(existingTimeout);
        typingTimeouts.delete(timeoutKey);
      }

      io.to(`conversation:${conversationId}`).emit('typing:indicator', {
        userId: socket.userId,
        isTyping: false,
      });

      logger.info(`User ${socket.userId} stopped typing in conversation ${conversationId}`);
    } catch (error) {
      logger.error('Error handling typing stop:', error);
    }
  });
};

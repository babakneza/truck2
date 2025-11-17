import { logger } from '../utils/logger.js';

export const reactionHandler = (io, socket) => {
  socket.on('reaction:add', (data) => {
    try {
      const { conversationId, messageId, emoji } = data;

      if (!messageId || !emoji) {
        logger.warn('Missing messageId or emoji for reaction');
        return;
      }

      io.to(`conversation:${conversationId}`).emit('reaction:added', {
        messageId,
        userId: socket.userId,
        emoji,
        timestamp: new Date().toISOString(),
      });

      logger.info(`User ${socket.userId} added reaction ${emoji} to message ${messageId}`);
    } catch (error) {
      logger.error('Error adding reaction:', error);
      socket.emit('reaction:error', { error: 'Failed to add reaction' });
    }
  });

  socket.on('reaction:remove', (data) => {
    try {
      const { conversationId, messageId, emoji } = data;

      if (!messageId || !emoji) {
        logger.warn('Missing messageId or emoji for reaction removal');
        return;
      }

      io.to(`conversation:${conversationId}`).emit('reaction:removed', {
        messageId,
        userId: socket.userId,
        emoji,
        timestamp: new Date().toISOString(),
      });

      logger.info(`User ${socket.userId} removed reaction ${emoji} from message ${messageId}`);
    } catch (error) {
      logger.error('Error removing reaction:', error);
      socket.emit('reaction:error', { error: 'Failed to remove reaction' });
    }
  });
};

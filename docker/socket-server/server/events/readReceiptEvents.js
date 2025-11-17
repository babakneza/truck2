import { logger } from '../utils/logger.js';

export const readReceiptHandler = (io, socket) => {
  socket.on('message:read', (data) => {
    try {
      const { conversationId, messageId } = data;

      if (!messageId) {
        logger.warn('Missing messageId for read receipt');
        return;
      }

      io.to(`conversation:${conversationId}`).emit('read:receipt', {
        messageId,
        userId: socket.userId,
        status: 'read',
        timestamp: new Date().toISOString(),
      });

      logger.info(`User ${socket.userId} marked message ${messageId} as read`);
    } catch (error) {
      logger.error('Error marking message as read:', error);
      socket.emit('read:error', { error: 'Failed to mark message as read' });
    }
  });

  socket.on('messages:read', (data) => {
    try {
      const { conversationId, messageIds } = data;

      if (!messageIds || !Array.isArray(messageIds)) {
        logger.warn('Invalid messageIds for bulk read receipt');
        return;
      }

      io.to(`conversation:${conversationId}`).emit('reads:receipt', {
        messageIds,
        userId: socket.userId,
        status: 'read',
        timestamp: new Date().toISOString(),
      });

      logger.info(`User ${socket.userId} marked ${messageIds.length} messages as read in conversation ${conversationId}`);
    } catch (error) {
      logger.error('Error marking messages as read:', error);
      socket.emit('read:error', { error: 'Failed to mark messages as read' });
    }
  });

  socket.on('message:delivered', (data) => {
    try {
      const { conversationId, messageId } = data;

      if (!messageId) {
        logger.warn('Missing messageId for delivery receipt');
        return;
      }

      io.to(`conversation:${conversationId}`).emit('delivery:receipt', {
        messageId,
        userId: socket.userId,
        status: 'delivered',
        timestamp: new Date().toISOString(),
      });

      logger.info(`Message ${messageId} delivered to user ${socket.userId}`);
    } catch (error) {
      logger.error('Error marking message as delivered:', error);
    }
  });
};

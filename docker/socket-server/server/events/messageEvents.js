import { logger } from '../utils/logger.js';

export const messageHandler = (io, socket) => {
  socket.on('message:send', async (data) => {
    try {
      const { conversationId, messageText, attachments } = data;

      if (!conversationId || !messageText) {
        logger.warn('Invalid message data received');
        socket.emit('message:error', { error: 'Missing required fields' });
        return;
      }

      const messageData = {
        conversationId,
        senderId: socket.userId,
        text: messageText,
        attachments: attachments || [],
        timestamp: new Date().toISOString(),
        status: 'sent',
      };

      io.to(`conversation:${conversationId}`).emit('message:received', messageData);

      logger.info(`Message sent in conversation ${conversationId} by user ${socket.userId}`);
    } catch (error) {
      logger.error('Error sending message:', error);
      socket.emit('message:error', { error: 'Failed to send message' });
    }
  });

  socket.on('message:edit', async (data) => {
    try {
      const { conversationId, messageId, newText } = data;

      if (!messageId || !newText) {
        socket.emit('message:error', { error: 'Missing required fields' });
        return;
      }

      io.to(`conversation:${conversationId}`).emit('message:updated', {
        messageId,
        newText,
        editedAt: new Date().toISOString(),
        editedBy: socket.userId,
      });

      logger.info(`Message ${messageId} edited by user ${socket.userId}`);
    } catch (error) {
      logger.error('Error editing message:', error);
      socket.emit('message:error', { error: 'Failed to edit message' });
    }
  });

  socket.on('message:delete', async (data) => {
    try {
      const { conversationId, messageId } = data;

      if (!messageId) {
        socket.emit('message:error', { error: 'Missing messageId' });
        return;
      }

      io.to(`conversation:${conversationId}`).emit('message:deleted', {
        messageId,
        deletedAt: new Date().toISOString(),
        deletedBy: socket.userId,
      });

      logger.info(`Message ${messageId} deleted by user ${socket.userId}`);
    } catch (error) {
      logger.error('Error deleting message:', error);
      socket.emit('message:error', { error: 'Failed to delete message' });
    }
  });
};

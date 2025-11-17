/* eslint-disable no-undef */
import http from 'http'
import { Server } from 'socket.io'
import axios from 'axios'
import { config as loadEnv } from 'dotenv'

loadEnv()

const PORT = process.env.SOCKET_PORT || 3001
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://admin.itboy.ir'

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

const users = new Map();
const typingTimeouts = new Map();
const conversationUsers = new Map();

const getDirectusHeaders = (token) => ({
  Authorization: token ? `Bearer ${token}` : '',
  'Content-Type': 'application/json',
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  socket.token = token;
  next();
});

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  socket.on('register_user', async () => {
    try {
      console.log(`🔍 Token exists: ${!!socket.token}, Token: ${socket.token?.substring(0, 20)}...`);
      console.log(`🔍 Attempting GET ${DIRECTUS_URL}/users/me`);
      const response = await axios.get(`${DIRECTUS_URL}/users/me`, {
        headers: getDirectusHeaders(socket.token),
      });
      const userId = response.data.data.id;
      users.set(userId, socket.id);
      socket.userId = userId;
      socket.broadcast.emit('user_online', { userId, socketId: socket.id });
      socket.emit('user_registered', { userId, socketId: socket.id });
      console.log(`👤 User registered: ${userId}`);
    } catch (error) {
      console.error('❌ Status:', error.response?.status);
      console.error('❌ Message:', error.message);
      console.error('❌ Response:', error.response?.data);
      socket.emit('error', { message: 'Failed to register user' });
    }
  });

  socket.on('join_conversation', (data) => {
    const { conversation_id } = data;
    socket.join(`conversation:${conversation_id}`);

    if (!conversationUsers.has(conversation_id)) {
      conversationUsers.set(conversation_id, new Set());
    }
    conversationUsers.get(conversation_id).add(socket.userId);

    io.to(`conversation:${conversation_id}`).emit('user_joined', {
      userId: socket.userId,
      socketId: socket.id,
    });

    console.log(`📢 User ${socket.userId} joined conversation ${conversation_id}`);
  });

  socket.on('leave_conversation', (data) => {
    const { conversation_id } = data;
    socket.leave(`conversation:${conversation_id}`);

    if (conversationUsers.has(conversation_id)) {
      conversationUsers.get(conversation_id).delete(socket.userId);
    }

    io.to(`conversation:${conversation_id}`).emit('user_left', {
      userId: socket.userId,
    });

    console.log(`🚪 User ${socket.userId} left conversation ${conversation_id}`);
  });

  socket.on('send_message', async (data) => {
    const { conversation_id, message_id, content, created_at } = data;

    try {
      io.to(`conversation:${conversation_id}`).emit('message_received', {
        id: message_id,
        conversation_id,
        content,
        sender_id: socket.userId,
        created_at,
      });

      console.log(`💬 Message broadcasted in conversation ${conversation_id}: ${message_id}`);
    } catch (error) {
      console.error('Message broadcast error:', error.message);
      socket.emit('error', { message: 'Failed to broadcast message' });
    }
  });

  socket.on('typing', (data) => {
    const { conversation_id } = data;

    if (typingTimeouts.has(socket.id)) {
      clearTimeout(typingTimeouts.get(socket.id));
    }

    io.to(`conversation:${conversation_id}`).emit('user_typing', {
      userId: socket.userId,
      socketId: socket.id,
    });

    const timeout = setTimeout(() => {
      io.to(`conversation:${conversation_id}`).emit('user_stopped_typing', {
        userId: socket.userId,
        socketId: socket.id,
      });
      typingTimeouts.delete(socket.id);
    }, 5000);

    typingTimeouts.set(socket.id, timeout);
  });

  socket.on('add_reaction', async (data) => {
    const { conversation_id, message_id, emoji } = data;

    try {
      const reactionData = {
        message_id,
        reaction_emoji: emoji,
        user_id: socket.userId,
      };

      await axios.post(
        `${DIRECTUS_URL}/items/message_reactions`,
        reactionData,
        { headers: getDirectusHeaders(socket.token) }
      );

      io.to(`conversation:${conversation_id}`).emit('reaction_added', {
        message_id,
        emoji,
        userId: socket.userId,
      });

      console.log(`😊 Reaction added to message ${message_id}`);
    } catch (error) {
      console.error('Reaction error:', error.message);
      console.error('Full error details:', error.response?.data || error);
      socket.emit('error', { message: 'Failed to add reaction' });
    }
  });

  socket.on('message_read', async (data) => {
    const { message_id, conversation_id } = data;

    try {
      await axios.post(
        `${DIRECTUS_URL}/items/message_reads`,
        {
          message_id,
          conversation_id,
          reader_id: socket.userId,
          status: 'READ',
          read_at: new Date().toISOString(),
        },
        { headers: getDirectusHeaders(socket.token) }
      );

      io.to(`conversation:${conversation_id}`).emit('message_marked_read', {
        message_id,
        userId: socket.userId,
      });

      console.log(`✅ Message ${message_id} marked as read by ${socket.userId}`);
    } catch (error) {
      console.error('Mark read error:', error.message);
      console.error('Full error details:', error.response?.data || error);
    }
  });

  socket.on('update_conversation', (data) => {
    const { conversation_id, total_message_count, last_message_id, last_message_at } = data;

    io.to(`conversation:${conversation_id}`).emit('conversation_updated', {
      conversation_id,
      total_message_count,
      last_message_id,
      last_message_at,
    });

    console.log(`📊 Conversation ${conversation_id} broadcasted updates`);
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      users.delete(socket.userId);
      socket.broadcast.emit('user_offline', { userId: socket.userId });
      console.log(`❌ User disconnected: ${socket.userId}`);
    }

    if (typingTimeouts.has(socket.id)) {
      clearTimeout(typingTimeouts.get(socket.id));
      typingTimeouts.delete(socket.id);
    }
  });

  socket.on('error', (error) => {
    console.error(`⚠️ Socket error for ${socket.id}:`, error);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Chat server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for connections`);
});
  

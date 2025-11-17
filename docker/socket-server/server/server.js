/* eslint-disable no-undef */
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';
import { messageHandler } from './events/messageEvents.js';
import { typingHandler } from './events/typingEvents.js';
import { reactionHandler } from './events/reactionEvents.js';
import { readReceiptHandler } from './events/readReceiptEvents.js';
import { userStatusHandler } from './events/userStatusEvents.js';
import { logger } from './utils/logger.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.SOCKET_PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5174', 'https://admin.itboy.ir'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 60000,
});

let redisClient;
let pubClient;

const initializeRedis = async () => {
  try {
    pubClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    redisClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), redisClient.connect()]);

    io.adapter(createAdapter(pubClient, redisClient));

    logger.info('Redis connected successfully');
  } catch (error) {
    logger.error('Redis connection failed:', error);
    if (NODE_ENV === 'development') {
      logger.warn('Continuing without Redis (development mode)');
    } else {
      process.exit(1);
    }
  }
};

const verifySocketToken = (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    next();
  } catch (error) {
    logger.error('Socket authentication failed:', error.message);
    next(new Error('Invalid token'));
  }
};

io.use(verifySocketToken);

io.on('connection', (socket) => {
  logger.info(`User ${socket.userId} connected with socket ID ${socket.id}`);

  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation:${conversationId}`);
    logger.info(`User ${socket.userId} joined conversation ${conversationId}`);
  });

  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
    logger.info(`User ${socket.userId} left conversation ${conversationId}`);
  });

  messageHandler(io, socket);
  typingHandler(io, socket);
  reactionHandler(io, socket);
  readReceiptHandler(io, socket);
  userStatusHandler(io, socket);

  socket.on('disconnect', () => {
    logger.info(`User ${socket.userId} disconnected with socket ID ${socket.id}`);
    io.to('online_users').emit('user_offline', {
      userId: socket.userId,
      timestamp: new Date(),
    });
  });

  socket.on('error', (error) => {
    logger.error(`Socket error for user ${socket.userId}:`, error);
  });
});

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.get('/stats', (req, res) => {
  res.json({
    connectedUsers: io.engine.clientsCount,
    activeRooms: io.sockets.adapter.rooms.size,
  });
});

app.post('/broadcast', (req, res) => {
  const { eventName, data } = req.body;
  if (!eventName) {
    return res.status(400).json({ error: 'eventName required' });
  }
  io.emit(eventName, data);
  res.json({ success: true, sent: true });
});

const start = async () => {
  await initializeRedis();

  httpServer.listen(PORT, '0.0.0.0', () => {
    logger.info(`Socket.io server running on port ${PORT} (${NODE_ENV})`);
  });
};

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  if (pubClient) await pubClient.quit();
  if (redisClient) await redisClient.quit();
  process.exit(0);
});

start().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

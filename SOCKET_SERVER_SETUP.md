# Socket.io Chat Server Setup

## Overview
A real-time WebSocket server for the chat system using Socket.io has been created and configured.

## Files Created/Modified

### Server Files
- **`server/socket-server.js`** - Main Socket.io server (Node.js)
- **`.env.local`** - Environment configuration
- **`package.json`** - Updated with socket.io and scripts

### Updated Client Files
- **`src/services/chatSocket.js`** - Updated to use VITE_SOCKET_URL
- **`ChatWindow.jsx`** - Initializes socket connection

## Quick Start

### Option 1: Run Both Dev Server & Socket Server (Recommended)
```bash
npm run dev:all
```
This will start:
- React dev server on `http://localhost:5174`
- Socket.io server on `http://localhost:3001`

### Option 2: Run Separately
```bash
# Terminal 1 - React dev server
npm run dev

# Terminal 2 - Socket server
npm run socket
```

## Configuration

### Environment Variables (`.env.local`)
```env
VITE_SOCKET_URL=http://localhost:3001
VITE_API_URL=http://localhost:5174/api
SOCKET_PORT=3001
DIRECTUS_URL=https://admin.itboy.ir
```

## Socket Server Features

### Real-Time Events
- **Message sending** - Instant message delivery to all participants
- **Typing indicators** - Shows who's typing (5-second timeout)
- **User presence** - Online/offline status tracking
- **Message reactions** - Emoji reactions broadcast in real-time
- **Read receipts** - Track message read status

### Event Handlers
```javascript
// Server listens for:
- register_user          // Register authenticated user
- join_conversation      // Join a chat room
- leave_conversation     // Leave a chat room
- send_message          // Send message to room
- typing                // Broadcast typing indicator
- add_reaction          // Add emoji reaction
- message_read          // Mark message as read

// Server broadcasts:
- message_received      // New message in room
- user_typing          // User is typing
- user_stopped_typing  // User stopped typing
- user_online          // User came online
- user_offline         // User went offline
- reaction_added       // New reaction on message
- message_marked_read  // Message marked as read
```

## Connection Flow

1. **User Authentication**
   - Client connects with auth token in `socket.handshake.auth`
   - Server validates token with Directus

2. **User Registration**
   - Client emits `register_user` event
   - Server verifies with Directus API
   - User ID mapped to socket ID

3. **Join Conversation**
   - Client emits `join_conversation` with conversation_id
   - Socket joins room: `conversation:{id}`
   - Other users notified of presence

4. **Real-Time Messaging**
   - Client emits `send_message`
   - Server saves to Directus
   - Broadcasts to all in room

## Testing the Socket Server

### Using Browser Console (After Logging In)
```javascript
// Check socket connection
console.log(localStorage.getItem('auth_token'));

// Open DevTools → Console tab and observe socket events
// When you send a message, you should see console logs

// Monitor WebSocket in DevTools → Network → WS tab
```

### Testing Messages
1. Login as a user in your app
2. Navigate to the chat interface
3. Open DevTools (F12)
4. Go to Network tab → Filter by "WS"
5. Send a message - you should see the socket event
6. Check Application tab → Console for socket logs

## Port Configuration

**Default Ports:**
- React Dev Server: `5174`
- Socket Server: `3001`
- Directus API: `https://admin.itboy.ir`

**Change Socket Port:**
```bash
SOCKET_PORT=3002 npm run socket
```

## Troubleshooting

### Socket Connection Fails
- Ensure socket server is running: `npm run socket`
- Check browser console for connection errors
- Verify auth token: `localStorage.getItem('auth_token')`
- Check CORS settings in `server/socket-server.js`

### Messages Not Broadcasting
- Check Directus API connection
- Verify auth token is valid
- Check browser console for errors
- Ensure user is in conversation room

### Typing Indicators Not Working
- Typing timeout is set to 5 seconds
- Check DevTools Network tab for WS messages
- Verify socket connection is active

## Production Deployment

For production deployment:

1. **Update CORS Origins**
   ```javascript
   // In server/socket-server.js
   cors: {
     origin: ['https://yourdomain.com'],
     methods: ['GET', 'POST'],
   }
   ```

2. **Use Environment Variables**
   ```bash
   DIRECTUS_URL=https://admin.itboy.ir
   SOCKET_PORT=3001
   NODE_ENV=production
   ```

3. **Run with Process Manager**
   ```bash
   pm2 start server/socket-server.js --name "chat-server"
   ```

## Next Steps

1. ✅ Socket server created and configured
2. ✅ Client libraries installed (socket.io-client)
3. ✅ Environment variables set up
4. ✅ Real-time events implemented

### Ready to Test:
- Start dev server: `npm run dev:all`
- Login to the app
- Open chat interface
- Send messages and watch real-time delivery
- Monitor DevTools WebSocket tab

## Additional Resources

- **Socket.io Docs:** https://socket.io/docs/
- **Directus API Docs:** https://docs.directus.io/
- **Event Broadcasting:** Messages are automatically persisted to Directus while being broadcast in real-time

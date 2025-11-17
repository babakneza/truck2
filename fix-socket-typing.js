import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Update chatSocket.js to emit the correct event names
const socketPath = path.join(__dirname, 'src', 'services', 'chatSocket.js');
let socketContent = fs.readFileSync(socketPath, 'utf8');

// Change the emit call from 'typing' to 'typing:start' or 'typing:stop'
socketContent = socketContent.replace(
  /socket\.emit\('typing',\s*\{\s*conversation_id: conversationId,\s*is_typing: isTyping\s*\}\)/,
  `if (isTyping) {
    socket.emit('typing:start', { conversationId })
  } else {
    socket.emit('typing:stop', { conversationId })
  }`
);

fs.writeFileSync(socketPath, socketContent, 'utf8');
console.log('Updated chatSocket.js to emit typing:start and typing:stop events');

// Now we need to update how the socket receives 'typing:indicator' events
// The server emits typing:indicator with { userId, isTyping }
// We should map this to update typingUsers state

// In chatSocket.js, we're listening for 'user_typing' and 'user_stopped_typing'
// But the server (typingEvents.js) is emitting 'typing:indicator'
// We need to add listeners for the typing:indicator event

const updatedSocket = socketContent.replace(
  /socket\.on\('user_typing',.*?\n.*?\}\)/s,
  `socket.on('typing:indicator', (data) => {
        if (callbacks.onUserTyping) callbacks.onUserTyping(data)
      })`
);

fs.writeFileSync(socketPath, updatedSocket, 'utf8');
console.log('Updated chatSocket.js to listen for typing:indicator event');

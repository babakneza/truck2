import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, 'server/socket-server.js');
let content = fs.readFileSync(file, 'utf8');

const oldCode = `  socket.on('send_message', async (data) => {
    const { conversation_id, content, timestamp } = data;

    try {
      const messageData = {
        conversation_id,
        message_text: content,
        sender_id: socket.userId,
        created_at: timestamp || new Date().toISOString(),
      };

      const response = await axios.post(
        \`\${DIRECTUS_URL}/items/messages\`,
        messageData,
        { headers: getDirectusHeaders(socket.token) }
      );

      const message = response.data.data;

      io.to(\`conversation:\${conversation_id}\`).emit('message_received', {
        id: message.id,
        conversation_id,
        content,
        sender_id: socket.userId,
        created_at: message.created_at,
      });

      console.log(\`💬 Message sent in conversation \${conversation_id}\`);
    } catch (error) {
      console.error('Message sending error:', error.message);
      console.error('Full error details:', error.response?.data || error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });`;

const newCode = `  socket.on('send_message', async (data) => {
    const { conversation_id, message_id, content, created_at } = data;

    try {
      io.to(\`conversation:\${conversation_id}\`).emit('message_received', {
        id: message_id,
        conversation_id,
        content,
        sender_id: socket.userId,
        created_at,
      });

      console.log(\`💬 Message broadcasted in conversation \${conversation_id}: \${message_id}\`);
    } catch (error) {
      console.error('Message broadcast error:', error.message);
      socket.emit('error', { message: 'Failed to broadcast message' });
    }
  });`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync(file, content, 'utf8');
  console.log('✅ Updated socket-server.js');
} else {
  console.log('❌ Old code pattern not found');
}

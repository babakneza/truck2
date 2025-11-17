import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'src', 'services', 'chatAPI.js');
let content = fs.readFileSync(filePath, 'utf8');

// Find the last }
const lastBraceIndex = content.lastIndexOf('}');

// Insert before the last brace
const newMethods = `,

  messageReads: {
    getForMessage: async (messageId) => {
      const params = new URLSearchParams()
      params.append('filter', JSON.stringify({ message_id: { _eq: messageId } }))
      params.append('fields', 'id,status,delivered_at,read_at,conversation_id,message_id,reader_id')
      const data = await makeRequest('GET', \`/items/message_reads?\${params}\`)
      return data.data || []
    },

    markAsDelivered: async (conversationId, messageId) => {
      const data = await makeRequest('POST', '/items/message_reads', {
        conversation_id: conversationId,
        message_id: messageId,
        status: 'delivered',
        delivered_at: new Date().toISOString()
      })
      return data.data
    },

    markAsRead: async (conversationId, messageId) => {
      const params = new URLSearchParams()
      params.append('filter', JSON.stringify({ 
        message_id: { _eq: messageId },
        reader_id: { _eq: localStorage.getItem('user_id') }
      }))
      const readRecords = await makeRequest('GET', \`/items/message_reads?\${params}\`)
      
      if (readRecords.data?.[0]) {
        const record = readRecords.data[0]
        await makeRequest('PATCH', \`/items/message_reads/\${record.id}\`, {
          status: 'read',
          read_at: new Date().toISOString()
        })
      } else {
        await makeRequest('POST', '/items/message_reads', {
          conversation_id: conversationId,
          message_id: messageId,
          reader_id: localStorage.getItem('user_id'),
          status: 'read',
          read_at: new Date().toISOString(),
          delivered_at: new Date().toISOString()
        })
      }
    }
  },

  typingIndicators: {
    getActive: async (conversationId) => {
      const now = new Date().toISOString()
      const params = new URLSearchParams()
      params.append('filter', JSON.stringify({ 
        conversation_id: { _eq: conversationId },
        expires_at: { _gt: now }
      }))
      params.append('fields', 'id,user_id,started_at,expires_at,conversation_id')
      const data = await makeRequest('GET', \`/items/typing_indicators?\${params}\`)
      return data.data || []
    },

    start: async (conversationId) => {
      const expiresAt = new Date(Date.now() + 5000).toISOString()
      const data = await makeRequest('POST', '/items/typing_indicators', {
        conversation_id: conversationId,
        user_id: localStorage.getItem('user_id'),
        started_at: new Date().toISOString(),
        expires_at: expiresAt
      })
      return data.data
    },

    stop: async (conversationId) => {
      const userId = localStorage.getItem('user_id')
      const params = new URLSearchParams()
      params.append('filter', JSON.stringify({
        conversation_id: { _eq: conversationId },
        user_id: { _eq: userId }
      }))
      const indicators = await makeRequest('GET', \`/items/typing_indicators?\${params}\`)
      
      for (const indicator of indicators.data || []) {
        await makeRequest('DELETE', \`/items/typing_indicators/\${indicator.id}\`)
      }
    }
  }
`;

// Remove the last closing brace temporarily, add new methods, then re-add it
const contentWithoutLastBrace = content.substring(0, lastBraceIndex);
const updatedContent = contentWithoutLastBrace + newMethods + '\n}';

fs.writeFileSync(filePath, updatedContent, 'utf8');
console.log('Methods added successfully to chatAPI.js');

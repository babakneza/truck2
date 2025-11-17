import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'src', 'context', 'ChatContext.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find the place to insert the enrichMessageWithReadStatus function
// It should go after the imports and before the ChatProvider function

const enrichFunction = `
const enrichMessageWithReadStatus = async (message) => {
  try {
    const token = localStorage.getItem('auth_token')
    if (!token || !message.id) return message

    const params = new URLSearchParams()
    params.append('filter', JSON.stringify({ message_id: { _eq: message.id } }))
    params.append('fields', 'id,status,delivered_at,read_at,conversation_id,message_id,reader_id')
    
    const response = await fetch(\`/api/items/message_reads?\${params}\`, {
      headers: { 'Authorization': \`Bearer \${token}\` }
    })
    
    if (!response.ok) return message
    
    const data = await response.json()
    const readRecords = data.data || []
    
    // Check if the message has been read or delivered by anyone
    const hasRead = readRecords.some(r => r.read_at && r.reader_id !== message.created_by_id)
    const hasDelivered = readRecords.some(r => r.delivered_at && r.reader_id !== message.created_by_id)
    
    return {
      ...message,
      is_read: hasRead,
      is_delivered: hasDelivered || hasRead || true
    }
  } catch (err) {
    console.error('Failed to enrich message with read status:', err)
    return message
  }
}
`;

// Find a good place to insert this - after the normalizeMessage function
const normalizeMessageEnd = content.indexOf('const makeRequest = async');
if (normalizeMessageEnd > -1) {
  content = content.substring(0, normalizeMessageEnd) + enrichFunction + '\n\n' + content.substring(normalizeMessageEnd);
}

// Now we need to update the fetchMessages call to apply read status
// Find where messages are being processed in fetchMessages
const fetchMessagesPattern = 'const messages = (data.data || []).map(normalizeMessage)';
const fetchMessagesIndex = content.indexOf(fetchMessagesPattern);

if (fetchMessagesIndex > -1) {
  const replacement = `const messages = await Promise.all(
      (data.data || [])
        .map(normalizeMessage)
        .filter(msg => msg)
        .map(msg => enrichMessageWithReadStatus(msg))
    )`;
  
  content = content.substring(0, fetchMessagesIndex) + replacement + content.substring(fetchMessagesIndex + fetchMessagesPattern.length);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('ChatContext updated with message read status enrichment');

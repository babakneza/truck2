import fs from 'fs';

const filePath = 'src/services/chatAPI.js';
let content = fs.readFileSync(filePath, 'utf-8');

content = content.replace(
  "params.append('fields', 'id,message_id,conversation_id,sender_id,message_text,content,message_type,edited_at,edit_count,is_deleted,deleted_at,reaction_count,created_at,updated_at')",
  "params.append('fields', 'id,message_id,conversation_id,sender_id,message_text,message_type,edited_at,edit_count,is_deleted,deleted_at,reaction_count,created_at,updated_at')"
);

content = content.replace(
  "const content = message.message_text || message.content",
  "const content = message.message_text"
);

content = content.replace(
  "        content: messageText,\n        message_text: messageText,",
  "        message_text: messageText,"
);

content = content.replace(
  "        content: newText,\n        message_text: newText",
  "        message_text: newText"
);

fs.writeFileSync(filePath, content);
console.log('✅ Fixed content field references');

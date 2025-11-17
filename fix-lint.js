import fs from 'fs';

let content = fs.readFileSync('src/services/chatAPI.js', 'utf8');

content = content.replace(/list: async \(conversationId, limit = 30, offset = 0\) => {\s+const userId = localStorage\.getItem\('user_id'\)\s+/,
  'list: async (conversationId, limit = 30, offset = 0) => {\n      ');

content = content.replace(/list: async \(messageIds\)/,
  'list: async ()');

content = content.replace(/\s*\/\/ eslint-disable-next-line no-unused-vars\s+/,
  '');

fs.writeFileSync('src/services/chatAPI.js', content);
console.log('Fixed chatAPI.js');

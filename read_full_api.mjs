import fs from 'fs';
const content = fs.readFileSync('src/services/chatAPI.js', 'utf8');
console.log(content);

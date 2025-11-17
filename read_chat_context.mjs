import fs from 'fs';
const content = fs.readFileSync('src/context/ChatContext.jsx', 'utf8');
const lines = content.split('\n');
console.log('Lines related to fetchMessages:');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('fetchMessages') || lines[i].includes('messages.list') || (i > 0 && lines[i-1].includes('async') && lines[i].includes('conversationId'))) {
    for (let j = Math.max(0, i-2); j < Math.min(lines.length, i+10); j++) {
      console.log((j+1) + ': ' + lines[j]);
    }
    console.log('---');
  }
}

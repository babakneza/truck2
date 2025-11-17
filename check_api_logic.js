import fs from 'fs';

const content = fs.readFileSync('src/services/chatAPI.js', 'utf8');
const lines = content.split('\n');

console.log('=== Checking messages.list() function ===\n');
for (let i = 140; i <= 170; i++) {
  console.log(`${i}: ${lines[i-1]}`);
}

console.log('\n=== Checking getForConversation() function ===\n');
for (let i = 287; i <= 302; i++) {
  if (lines[i-1]) {
    console.log(`${i}: ${lines[i-1]}`);
  }
}

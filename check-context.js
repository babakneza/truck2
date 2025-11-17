import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'src', 'context', 'ChatContext.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Find setTypingUsers calls
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('setTypingUsers')) {
    console.log(`Line ${i + 1}:`);
    for (let j = Math.max(0, i - 2); j < Math.min(lines.length, i + 8); j++) {
      console.log(`  ${j + 1}: ${lines[j]}`);
    }
    console.log('---');
  }
}

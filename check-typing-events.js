import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'src', 'services', 'chatSocket.js');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('=== TYPING RELATED CODE IN chatSocket.js ===\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].toLowerCase().includes('typing') || lines[i].includes('user_typing') || lines[i].includes('user_stopped')) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
  }
}

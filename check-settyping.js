import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'src', 'context', 'ChatContext.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Find setTyping definition
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const setTyping = useCallback')) {
    console.log('Found setTyping at line ' + (i + 1));
    for (let j = i; j < Math.min(lines.length, i + 10); j++) {
      console.log(lines[j]);
    }
    break;
  }
}

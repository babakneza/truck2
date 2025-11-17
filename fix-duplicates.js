import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'src', 'services', 'chatAPI.js');
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log(`Total lines: ${lines.length}`);

// Find the first and second occurrence of messageReads
let firstMessageReads = -1;
let secondMessageReads = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('messageReads:')) {
    if (firstMessageReads === -1) {
      firstMessageReads = i;
    } else if (secondMessageReads === -1) {
      secondMessageReads = i;
      break;
    }
  }
}

console.log(`First messageReads at line ${firstMessageReads + 1}`);
console.log(`Second messageReads at line ${secondMessageReads + 1}`);

// Find the end of the file and the last closing brace
let lastClosingBrace = -1;
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].trim() === '}') {
    lastClosingBrace = i;
    break;
  }
}

console.log(`Last closing brace at line ${lastClosingBrace + 1}`);

// Remove the duplicate section (from second messageReads to last closing brace - 1)
if (secondMessageReads > -1 && lastClosingBrace > secondMessageReads) {
  // Keep lines up to (but not including) secondMessageReads
  // Then add back the final closing brace
  const newLines = [
    ...lines.slice(0, secondMessageReads - 1), // Remove the comma before the duplicate
    '}' // Add the final closing brace
  ];
  
  const newContent = newLines.join('\n');
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`Removed duplicate section from line ${secondMessageReads + 1} to line ${lastClosingBrace + 1}`);
  console.log(`New file has ${newLines.length} lines`);
} else {
  console.log('Could not find duplicates to remove');
}

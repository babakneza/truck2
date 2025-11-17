import fs from 'fs';

const lines = fs.readFileSync('src/services/chatAPI.js', 'utf-8').split('\n');

console.log('=== Line 16 (normalizeMessage) ===');
console.log(lines[15]);

console.log('\n=== Line 131 (fields list) ===');
console.log(lines[130]);

console.log('\n=== Lines 173-176 (send method) ===');
lines.slice(172, 176).forEach((l, i) => console.log(`${173+i}: ${l}`));

console.log('\n=== Lines 188-191 (edit method) ===');
lines.slice(187, 191).forEach((l, i) => console.log(`${188+i}: ${l}`));

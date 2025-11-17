import fs from 'fs';
const lines = fs.readFileSync('src/context/ChatContext.jsx', 'utf8').split('\n');
console.log(lines.slice(240, 270).join('\n'));

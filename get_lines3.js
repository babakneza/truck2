import fs from 'fs';
const lines = fs.readFileSync('src/context/ChatContext.jsx', 'utf8').split('\n');
lines.slice(274, 295).forEach((l, i) => console.log((275+i) + ': ' + l));

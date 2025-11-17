import fs from 'fs';
const lines = fs.readFileSync('src/services/chatAPI.js', 'utf8').split('\n');
lines.slice(255, 270).forEach((line, i) => {
  console.log((256 + i) + ': ' + line);
});

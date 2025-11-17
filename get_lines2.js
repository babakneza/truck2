import fs from 'fs';
const lines = fs.readFileSync('src/services/chatAPI.js', 'utf8').split('\n');
lines.slice(142, 172).forEach((line, i) => {
  console.log((143 + i) + ': ' + line);
});

import fs from 'fs';

const content = fs.readFileSync('src/components/BiddingSystemModern.jsx', 'utf8');
const lines = content.split('\n');
const startIdx = lines.findIndex(l => l.includes('const loadMyBids'));
console.log('Lines from loadMyBids:');
lines.slice(startIdx, startIdx + 25).forEach((line, i) => {
  console.log(`${startIdx + i + 1}: ${line}`);
});

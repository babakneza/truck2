import fs from 'fs';

const content = fs.readFileSync('src/components/BiddingSystemModern.jsx', 'utf8');
const lines = content.split('\n');
console.log('Lines 20-40:');
lines.slice(19, 40).forEach((line, i) => {
  console.log(`${20 + i}: ${line}`);
});

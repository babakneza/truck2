import fs from 'fs';

const content = fs.readFileSync('src/components/BiddingSystemModern.jsx', 'utf8');
const lines = content.split('\n');

// Find the section around line 800
console.log('Lines 795-825 (vehicle dropdown options):');
lines.slice(794, 825).forEach((line, i) => {
  console.log(`${795 + i}: ${line}`);
});

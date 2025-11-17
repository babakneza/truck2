import fs from 'fs';

const content = fs.readFileSync('src/components/BiddingSystemModern.jsx', 'utf8');
const lines = content.split('\n');
const secondBidDataIdx = lines.findIndex((l, i) => i > 200 && l.includes('const bidData = {'));
console.log('Second bidData location (around line ' + (secondBidDataIdx + 1) + '):');
lines.slice(secondBidDataIdx, secondBidDataIdx + 10).forEach((line, i) => {
  console.log(`${secondBidDataIdx + 1 + i}: ${line}`);
});

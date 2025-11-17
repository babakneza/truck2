import fs from 'fs';
const content = fs.readFileSync('tests/e2e/message-delivery-read-status.spec.ts', 'utf8');
console.log(content.substring(0, 2000));

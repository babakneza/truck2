import fs from 'fs';

const file = fs.readFileSync('src/services/chatAPI.js', 'utf8');
const oldCode = `          if (isSentByUs) {
            const allRead = msgReadRecords.every(r => r.status === 'READ')
            const anyDelivered = msgReadRecords.some(r => r.status !== 'READ')
            return { ...msg, status: allRead ? 'READ' : 'DELIVERED' }`;

const newCode = `          if (isSentByUs) {
            const allRead = msgReadRecords.every(r => r.status === 'READ')
            return { ...msg, status: allRead ? 'READ' : 'DELIVERED' }`;

const updated = file.replace(oldCode, newCode);
fs.writeFileSync('src/services/chatAPI.js', updated);
console.log('Fixed lint error!');

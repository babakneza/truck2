import fs from 'fs';

const content = fs.readFileSync('src/context/ChatContext.jsx', 'utf8');
const start = content.indexOf('const fetchMessages = useCallback');
const end = content.indexOf('setMessages', start + 300) + 200;
const section = content.substring(start, end);

console.log(section);

import fs from 'fs';

const file = fs.readFileSync('src/services/chatAPI.js', 'utf8');

const oldCode = `      try {
        const currentUserId = localStorage.getItem('user_id')
        const messageReads = await chatAPI.messageReads.getForConversation(conversationId)
        
        return normalizedMessages.map(msg => {
          const readRecord = messageReads.find(r => r.message_id === msg.id && r.reader_id === currentUserId)
          if (readRecord) {
            return {
              ...msg,
              status: readRecord.status,
              delivered_at: readRecord.delivered_at,
              read_at: readRecord.read_at
            }
          }
          return msg
        })
      } catch (error) {
        console.error('Failed to merge read status:', error)
        return normalizedMessages
      }`;

const newCode = `      try {
        const currentUserId = localStorage.getItem('user_id')
        const messageReads = await chatAPI.messageReads.getForConversation(conversationId)
        
        return normalizedMessages.map(msg => {
          const msgReadRecords = messageReads.filter(r => r.message_id === msg.id)
          if (!msgReadRecords.length) return msg
          
          const isSentByUs = msg.created_by_id === currentUserId
          
          if (isSentByUs) {
            const allRead = msgReadRecords.every(r => r.status === 'READ')
            const anyDelivered = msgReadRecords.some(r => r.status !== 'READ')
            return { ...msg, status: allRead ? 'READ' : 'DELIVERED' }
          } else {
            const ourRecord = msgReadRecords.find(r => r.reader_id === currentUserId)
            if (ourRecord) {
              return { ...msg, status: ourRecord.status, delivered_at: ourRecord.delivered_at, read_at: ourRecord.read_at }
            }
            return msg
          }
        })
      } catch (error) {
        console.error('Failed to merge read status:', error)
        return normalizedMessages
      }`;

const updated = file.replace(oldCode, newCode);
fs.writeFileSync('src/services/chatAPI.js', updated);
console.log('Fixed!');

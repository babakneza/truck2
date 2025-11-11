# Chat System API Quick Reference

## Collection Endpoints

### Conversations
```
GET    /items/conversations
POST   /items/conversations
GET    /items/conversations/:id
PATCH  /items/conversations/:id
DELETE /items/conversations/:id
```

### Messages
```
GET    /items/messages
POST   /items/messages
GET    /items/messages/:id
PATCH  /items/messages/:id
DELETE /items/messages/:id
```

### Message Reads
```
GET    /items/message_reads
POST   /items/message_reads
GET    /items/message_reads/:id
PATCH  /items/message_reads/:id
```

### Message Attachments
```
GET    /items/message_attachments
POST   /items/message_attachments
GET    /items/message_attachments/:id
DELETE /items/message_attachments/:id
```

### Message Reactions
```
GET    /items/message_reactions
POST   /items/message_reactions
GET    /items/message_reactions/:id
DELETE /items/message_reactions/:id
```

### Chat Participants
```
GET    /items/chat_participants
POST   /items/chat_participants
GET    /items/chat_participants/:id
PATCH  /items/chat_participants/:id
DELETE /items/chat_participants/:id
```

### Typing Indicators
```
GET    /items/typing_indicators
POST   /items/typing_indicators
DELETE /items/typing_indicators/:id
```

### Conversation Settings
```
GET    /items/conversation_settings
POST   /items/conversation_settings
PATCH  /items/conversation_settings/:id
```

### Chat Notifications
```
GET    /items/chat_notifications
POST   /items/chat_notifications
PATCH  /items/chat_notifications/:id
```

---

## Common Filter Examples

### Get User Conversations
```javascript
GET /items/conversations?filter[initiator_id][_eq]=$CURRENT_USER,receiver_id[_eq]=$CURRENT_USER&sort=-last_message_at
```

### Get Unread Conversations
```javascript
GET /items/chat_participants?filter[user_id][_eq]=$CURRENT_USER&filter[unread_count][_gt]=0
```

### Get Conversation Messages
```javascript
GET /items/messages?filter[conversation_id][_eq]=1&sort=-created_at&limit=30
```

### Get Unread Messages
```javascript
GET /items/message_reads?filter[reader_id][_eq]=$CURRENT_USER&filter[status][_neq]=READ
```

### Get User Reactions
```javascript
GET /items/message_reactions?filter[user_id][_eq]=$CURRENT_USER
```

### Get Active Typers
```javascript
GET /items/typing_indicators?filter[conversation_id][_eq]=1&filter[expires_at][_gt]=NOW()
```

---

## Common Mutations

### Create Conversation
```javascript
POST /items/conversations
{
  "conversation_id": "uuid-here",
  "shipment_id": 1,
  "initiator_id": $CURRENT_USER,
  "receiver_id": 2,
  "conversation_type": "SHIPMENT"
}
```

### Send Message
```javascript
POST /items/messages
{
  "message_id": "uuid-here",
  "conversation_id": 1,
  "sender_id": $CURRENT_USER,
  "message_text": "Hello!",
  "message_type": "TEXT"
}
```

### Mark Message Read
```javascript
POST /items/message_reads
{
  "message_id": 5,
  "conversation_id": 1,
  "reader_id": $CURRENT_USER,
  "status": "READ",
  "read_at": "2025-11-10T13:45:00Z"
}
```

### Upload Attachment
```javascript
POST /items/message_attachments
{
  "message_id": 5,
  "file_name": "document.pdf",
  "file_url": "https://cdn.example.com/file.pdf",
  "file_size": 1048576,
  "file_type": "application/pdf",
  "file_extension": "pdf",
  "category": "DOCUMENT",
  "uploaded_by_id": $CURRENT_USER
}
```

### Add Reaction
```javascript
POST /items/message_reactions
{
  "message_id": 5,
  "user_id": $CURRENT_USER,
  "reaction_emoji": "👍",
  "reaction_type": "LIKE"
}
```

### Update Typing Status
```javascript
POST /items/typing_indicators
{
  "conversation_id": 1,
  "user_id": $CURRENT_USER,
  "started_at": "2025-11-10T13:45:00Z",
  "expires_at": "2025-11-10T13:45:05Z"
}
```

### Update Participant Unread
```javascript
PATCH /items/chat_participants/:id
{
  "unread_count": 0,
  "last_read_at": "2025-11-10T13:45:00Z"
}
```

### Update Conversation Settings
```javascript
PATCH /items/conversation_settings/:id
{
  "is_starred": true,
  "color_tag": "BLUE",
  "notifications_enabled": false,
  "notification_type": "MENTIONS_ONLY"
}
```

### Archive Conversation
```javascript
PATCH /items/conversations/:id
{
  "initiator_archived": true
}
```

### Close Conversation
```javascript
PATCH /items/conversations/:id
{
  "is_closed": true,
  "closed_reason": "SHIPMENT_COMPLETED",
  "closed_at": "2025-11-10T13:45:00Z"
}
```

---

## WebSocket Events

### Client → Server Events

#### message:send
```javascript
socket.emit('message:send', {
  conversation_id: 1,
  message_text: 'Hello!',
  message_type: 'TEXT'
})
```

#### typing:start
```javascript
socket.emit('typing:start', {
  conversation_id: 1
})
```

#### typing:stop
```javascript
socket.emit('typing:stop', {
  conversation_id: 1
})
```

#### message:read
```javascript
socket.emit('message:read', {
  conversation_id: 1,
  message_id: 5
})
```

#### conversation:open
```javascript
socket.emit('conversation:open', {
  conversation_id: 1
})
```

#### conversation:close
```javascript
socket.emit('conversation:close', {
  conversation_id: 1
})
```

### Server → Client Events

#### message:received
```javascript
socket.on('message:received', (message) => {
  // New message in conversation
  console.log(message)
})
```

#### message:delivered
```javascript
socket.on('message:delivered', (message) => {
  // Message confirmed delivered to server
})
```

#### message:read
```javascript
socket.on('message:read', (data) => {
  // User read a message
  console.log(data.message_id, data.reader_id)
})
```

#### user:typing
```javascript
socket.on('user:typing', (data) => {
  // User started typing
  console.log(data.user_id, data.conversation_id)
})
```

#### user:online
```javascript
socket.on('user:online', (user) => {
  // User came online
})
```

#### user:offline
```javascript
socket.on('user:offline', (user) => {
  // User went offline
})
```

---

## Field Enums

### message_type
- TEXT
- IMAGE
- FILE
- LOCATION
- SYSTEM

### system_message_type
- USER_JOINED
- USER_LEFT
- CONVERSATION_CREATED
- SHIPMENT_ACCEPTED
- DELIVERY_COMPLETED

### message_read_status
- SENT
- DELIVERED
- READ

### conversation_type
- SHIPMENT
- GENERAL
- SUPPORT

### closed_reason
- SHIPMENT_COMPLETED
- MANUAL_CLOSE
- BLOCKED_USER
- INACTIVE_30_DAYS

### deleted_reason
- USER_REQUEST
- MODERATION
- ABUSE
- SPAM

### attachment_category
- IMAGE
- DOCUMENT
- VIDEO
- AUDIO
- OTHER

### reaction_type
- LIKE
- LOVE
- LAUGH
- SAD
- ANGRY
- WOW
- CUSTOM

### participant_role
- INITIATOR
- RECEIVER
- ADMIN

### participant_status
- ACTIVE
- INACTIVE
- ARCHIVED
- BLOCKED

### notification_type
- MESSAGE
- MENTION
- SYSTEM

### delivery_status
- PENDING
- SENT
- FAILED
- BOUNCED

### notification_level
- ALL
- MENTIONS_ONLY
- NONE

### color_tag
- RED
- ORANGE
- YELLOW
- GREEN
- BLUE
- PURPLE

---

## Common Query Patterns

### Paginate Messages
```javascript
GET /items/messages?filter[conversation_id][_eq]=1&sort=-created_at&limit=30&offset=0
```

### Search Messages
```javascript
GET /items/messages?filter[conversation_id][_eq]=1&filter[message_text][_contains]=search&sort=-created_at
```

### Get Conversation With Participants
```javascript
GET /items/conversations/1?fields=*,initiator.*,receiver.*,chat_participants.*,messages(limit:5,sort:-created_at)
```

### Get Message With Reactions
```javascript
GET /items/messages/5?fields=*,message_reactions.*,message_attachments.*,message_reads.*
```

### Get User Stats
```javascript
GET /items/chat_participants?filter[user_id][_eq]=$CURRENT_USER&fields=*,conversation.*
```

### Get Notification History
```javascript
GET /items/chat_notifications?filter[recipient_id][_eq]=$CURRENT_USER&sort=-created_at&limit=20
```

---

## Error Handling

### Typical Error Responses

#### 401 Unauthorized
```json
{
  "errors": [
    {
      "message": "Invalid token",
      "extensions": {
        "code": "INVALID_TOKEN"
      }
    }
  ]
}
```

#### 403 Forbidden
```json
{
  "errors": [
    {
      "message": "You don't have permission to access this.",
      "extensions": {
        "code": "FORBIDDEN"
      }
    }
  ]
}
```

#### 422 Validation Error
```json
{
  "errors": [
    {
      "message": "One or more of the following required fields are missing: initiator_id",
      "extensions": {
        "code": "INVALID_PAYLOAD"
      }
    }
  ]
}
```

---

## Response Examples

### Message Object
```javascript
{
  "id": 5,
  "message_id": "uuid-123",
  "conversation_id": 1,
  "sender_id": 1,
  "message_text": "Hello!",
  "message_type": "TEXT",
  "system_message_type": null,
  "edited_at": null,
  "edit_count": 0,
  "edit_history": null,
  "is_deleted": false,
  "deleted_reason": null,
  "deleted_by_id": null,
  "deleted_at": null,
  "reaction_count": 2,
  "has_attachments": false,
  "attachment_count": 0,
  "metadata": null,
  "created_at": "2025-11-10T13:45:00.000Z",
  "updated_at": "2025-11-10T13:45:00.000Z"
}
```

### Conversation Object
```javascript
{
  "id": 1,
  "conversation_id": "uuid-456",
  "shipment_id": 10,
  "bid_id": null,
  "initiator_id": 1,
  "receiver_id": 2,
  "conversation_type": "SHIPMENT",
  "is_active": true,
  "total_message_count": 5,
  "last_message_id": 5,
  "last_message_at": "2025-11-10T13:45:00.000Z",
  "initiator_archived": false,
  "receiver_archived": false,
  "is_closed": false,
  "closed_reason": null,
  "closed_at": null,
  "created_at": "2025-11-10T12:00:00.000Z",
  "updated_at": "2025-11-10T13:45:00.000Z"
}
```

---

## Rate Limiting & Throttling

Recommended client-side throttling:
- **Message Send**: 1 per second
- **Typing Indicator**: 1 per second (debounced)
- **Message Read**: Batch every 5 seconds
- **Reactions**: No limit (instant)

---

## Performance Best Practices

1. **Use select parameter**: Only fetch needed fields
   ```javascript
   GET /items/messages?select=id,message_text,sender_id,created_at
   ```

2. **Pagination**: Always use limit + offset
   ```javascript
   GET /items/messages?limit=30&offset=0
   ```

3. **Sorting**: Use indexes
   ```javascript
   GET /items/messages?sort=-created_at
   ```

4. **Caching**: Cache conversation list (invalidate on new message)
5. **Batching**: Combine read receipts (batch every 5 sec)

---

## Authentication

All endpoints require Bearer token:
```
Authorization: Bearer <token>
```

Obtain token via:
```javascript
POST /auth/login
{
  "email": "user@example.com",
  "password": "password"
}
```

---

*Quick reference for Chat System API - For detailed field specifications see CHAT_COLLECTIONS_DOCUMENTATION.md*

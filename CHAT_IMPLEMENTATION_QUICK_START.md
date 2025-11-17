# Chat System Implementation - Quick Start

## Pre-Implementation Checklist

### ✓ Verified
- [x] 9 Directus collections created
- [x] All relationships configured
- [x] API endpoints available
- [x] Permissions defined
- [x] Authentication working

### Install Dependencies
```bash
npm install socket.io-client emoji-picker-react react-window clsx
```

---

## Project File Structure

Create new directory in your project:

```bash
mkdir -p src/components/ChatSystem
mkdir -p src/services
mkdir -p src/hooks
mkdir -p src/styles/chat
```

---

## Implementation Order (Week 1-3)

### Week 1: Core Components & API

**Day 1-2: API Service Layer**
- [ ] Create `src/services/chatAPI.js` (Directus REST calls)
- [ ] Create `src/services/chatSocket.js` (WebSocket setup)
- [ ] Create `src/hooks/useChatStore.js` (State management)
- [ ] Test API calls with mock data

**Day 3-4: Container Components**
- [ ] Create `ChatWindow.jsx` (Main container)
- [ ] Create `ChatList.jsx` (Sidebar)
- [ ] Create `ChatHeader.jsx` (Header with user info)
- [ ] Connect components with React Router

**Day 5: Message Components**
- [ ] Create `MessageBubble.jsx` (Individual message)
- [ ] Create `MessageList.jsx` (Scrollable list)
- [ ] Create `MessageInput.jsx` (Input with file upload)
- [ ] Test message flow

### Week 2: Real-Time & Features

**Day 1-2: Real-Time Features**
- [ ] Set up WebSocket connection
- [ ] Implement `TypingIndicator.jsx`
- [ ] Add real-time message updates
- [ ] Test with 2 browser windows

**Day 3-4: Advanced Features**
- [ ] Create `MessageReactions.jsx` (Emoji reactions)
- [ ] Create `ReactionPicker.jsx` (Emoji selector)
- [ ] Create `AttachmentPreview.jsx` (File display)
- [ ] Implement file upload

**Day 5: Settings & Notifications**
- [ ] Create `ConversationSettings.jsx` (User preferences)
- [ ] Create `NotificationCenter.jsx` (Notifications)
- [ ] Implement mute/archive/block
- [ ] Add notification badges

### Week 3: Polish & Testing

**Day 1-2: UI/UX Polish**
- [ ] Add CSS animations
- [ ] Responsive mobile design
- [ ] Dark mode support
- [ ] Loading states

**Day 3-4: Testing & Performance**
- [ ] Unit tests for components
- [ ] Integration tests for API calls
- [ ] Performance optimization
- [ ] Pagination for old messages

**Day 5: Deployment**
- [ ] Production build
- [ ] WebSocket server setup
- [ ] Error monitoring
- [ ] Performance monitoring

---

## Directory Tree (Complete)

```
src/
├── components/
│   └── ChatSystem/
│       ├── ChatWindow.jsx             # Main chat interface
│       ├── ChatList.jsx               # Conversations sidebar
│       ├── ChatHeader.jsx             # Header component
│       ├── MessageBubble.jsx          # Individual message
│       ├── MessageList.jsx            # Message container
│       ├── MessageInput.jsx           # Input & upload
│       ├── TypingIndicator.jsx        # Real-time typing
│       ├── MessageReactions.jsx       # Emoji reactions
│       ├── ReactionPicker.jsx         # Emoji selector
│       ├── AttachmentPreview.jsx      # File display
│       ├── ConversationSettings.jsx   # User settings
│       ├── NotificationCenter.jsx     # Notifications
│       ├── MessageContextMenu.jsx     # Right-click menu
│       ├── ChatSearch.jsx             # Message search
│       ├── ReadReceipt.jsx            # Delivery status
│       ├── FileUploadArea.jsx         # Drag & drop
│       └── ChatSystem.jsx             # Main component (router)
│
├── services/
│   ├── chatAPI.js                     # REST API calls
│   ├── chatSocket.js                  # WebSocket handler
│   └── fileUpload.js                  # File upload logic
│
├── hooks/
│   ├── useChatStore.js                # Zustand store
│   ├── useMessages.js                 # Message logic
│   ├── useConversations.js            # Conversation logic
│   ├── useNotifications.js            # Notification logic
│   └── useWebSocket.js                # WebSocket hook
│
├── styles/
│   └── chat/
│       ├── ChatWindow.css
│       ├── ChatList.css
│       ├── MessageBubble.css
│       ├── MessageInput.css
│       ├── Notifications.css
│       └── responsive.css
│
└── App.jsx (add route: /chat)
```

---

## Module-by-Module Checklist

### 1. chatAPI.js ✓ TEMPLATE PROVIDED

**Exports**:
- `getConversations(filter, limit, offset)`
- `createConversation(data)`
- `getMessages(conversationId, limit)`
- `sendMessage(conversationId, text, attachments)`
- `markAsRead(messageId, conversationId)`
- `uploadAttachment(file)`
- `addReaction(messageId, emoji)`
- `removeReaction(reactionId)`
- `sendTyping(conversationId)`
- `getTypingUsers(conversationId)`
- `updateParticipant(participantId, data)`
- `updateSettings(settingsId, settings)`
- `getNotifications(limit)`

**Tests**:
```bash
# Test in browser console
await chatAPI.getConversations({}, 10)
await chatAPI.createConversation({ receiverId: 2 })
```

### 2. chatSocket.js ✓ TEMPLATE PROVIDED

**Exports**:
- `connect(token)` - Initialize connection
- `emit(event, data)` - Send to server
- `on(event, callback)` - Listen for events
- `disconnect()` - Close connection

**WebSocket Events**:
- Receive: message:received, message:read, user:typing
- Send: message:send, typing:start, message:read

### 3. ChatWindow.jsx ✓ TEMPLATE PROVIDED

**Props**: `conversationId`
**State**:
- messages (array)
- conversation (object)
- typingUsers (array)
- loading (bool)
- error (string)

**Features**:
- Load messages on mount
- Real-time message updates
- Auto-scroll to bottom
- Mark messages as read on visibility
- Error handling

### 4. ChatList.jsx ✓ TEMPLATE PROVIDED

**State**:
- conversations (array)
- searchTerm (string)
- filter (all/unread/archived)
- loading (bool)

**Features**:
- Load conversations
- Search/filter
- Show unread badges
- Unread count per conversation

### 5. MessageBubble.jsx ✓ TEMPLATE PROVIDED

**Props**:
- message (object)
- isOwn (bool)
- onReact (callback)
- onDelete (callback)

**Features**:
- Message content display
- Attachments preview
- Reactions display
- Read receipt indicator
- Timestamp
- Actions menu (hover)

### 6. MessageInput.jsx ✓ TEMPLATE PROVIDED

**State**:
- message (string)
- attachments (array)
- showEmoji (bool)
- sending (bool)

**Features**:
- Auto-expanding textarea
- Emoji picker
- File upload (drag & drop)
- Attachment preview
- Send button with loading state
- Keyboard shortcut (Enter to send)

---

## API Endpoint Quick Reference

### Core Endpoints

```javascript
// Get conversations
GET /api/items/conversations
  ?filter={"_or":[{"initiator_id":{"_eq":USER}},{"receiver_id":{"_eq":USER}}]}
  &sort=-last_message_at
  &fields=*,initiator_id.*,receiver_id.*

// Get messages
GET /api/items/messages
  ?filter={"conversation_id":{"_eq":CONV_ID}}
  &sort=-created_at
  &limit=30

// Send message
POST /api/items/messages
{
  "message_id": "uuid",
  "conversation_id": ID,
  "sender_id": USER_ID,
  "message_text": "Hello!",
  "message_type": "TEXT"
}

// Mark as read
POST /api/items/message_reads
{
  "message_id": ID,
  "conversation_id": CONV_ID,
  "reader_id": USER_ID,
  "status": "READ",
  "read_at": "ISO_DATE"
}

// Add reaction
POST /api/items/message_reactions
{
  "message_id": ID,
  "user_id": USER_ID,
  "reaction_emoji": "👍",
  "reaction_type": "LIKE"
}
```

---

## Environment Variables

Create `.env` file:
```
VITE_API_URL=https://admin.itboy.ir/api
VITE_WEBSOCKET_URL=https://admin.itboy.ir
VITE_AUTH_TOKEN=your_token_here
```

---

## Testing Commands

```bash
# Start dev server
npm run dev

# Lint code
npm run lint

# Run tests
npm test

# Build for production
npm run build
```

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari 14+, Chrome Mobile)

---

## Performance Targets

| Metric | Target | Tool |
|--------|--------|------|
| Initial load | < 2s | Lighthouse |
| Message render | < 100ms | React DevTools |
| WebSocket latency | < 200ms | Browser DevTools |
| Memory usage | < 100MB | Task Manager |
| Bundle size | < 500KB | Webpack Bundle Analyzer |

---

## Common Issues & Solutions

### WebSocket Connection Failed
```javascript
// Check:
1. Token is valid: localStorage.getItem('auth_token')
2. Server is running
3. CORS is configured
4. Connection URL is correct
```

### Messages Not Appearing
```javascript
// Debug:
1. Check browser console for errors
2. Verify filter in API call
3. Check user permissions
4. Verify conversation_id exists
```

### Read Receipts Not Updating
```javascript
// Check:
1. message_reads records are being created
2. IntersectionObserver is working
3. WebSocket is receiving read events
4. UI is subscribing to updates
```

### File Upload Failing
```javascript
// Debug:
1. Check file size (< 50MB)
2. Check file type
3. Check auth token
4. Check network in DevTools
```

---

## Next Session Commands

```bash
# Check latest changes
git status

# Start dev server
npm run dev

# If needed: reinstall dependencies
npm install
```

---

## Success Metrics

By end of implementation you should have:

- [ ] ✓ 15+ React components
- [ ] ✓ Real-time messaging (< 200ms latency)
- [ ] ✓ File attachments (max 50MB)
- [ ] ✓ Emoji reactions
- [ ] ✓ Typing indicators
- [ ] ✓ Read receipts
- [ ] ✓ Push notifications
- [ ] ✓ Conversation search
- [ ] ✓ Message pagination
- [ ] ✓ User preferences (mute, color, label)
- [ ] ✓ Mobile responsive
- [ ] ✓ Error handling
- [ ] ✓ Performance optimized
- [ ] ✓ Full test coverage
- [ ] ✓ Production ready

---

## Resources

- Directus REST API: https://docs.directus.io/reference/rest-api
- Socket.io Docs: https://socket.io/docs/v4/
- React Docs: https://react.dev
- Emoji Picker: https://www.npmjs.com/package/emoji-picker-react

---

**Start Date**: [TODAY]
**Estimated Completion**: 3 weeks (full-time) or 6 weeks (part-time)
**Difficulty**: Medium → Hard
**Team Size**: 1-2 developers

*Good luck! You've got all the collections and templates. Now build the UI! 🚀*

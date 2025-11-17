# TODO

## Chat System Implementation - Full Functional Build
**Target**: Freelancer.com-like chat system with real-time messaging, file attachments, read receipts, and notifications
**Architecture**: Windows dev + Docker (Directus + Socket server on VPS)

---

## PHASE 1: Backend Setup & Configuration (Week 1)

### Socket.io Server Setup (Docker)
- [ ] Create `docker/socket-server/Dockerfile` with Node.js base
- [ ] Create `docker/socket-server/package.json` with socket.io, cors, redis, dotenv
- [ ] Create `docker/socket-server/src/server.js` with:
  - [ ] Socket.io initialization on port 3001
  - [ ] CORS configuration for Windows dev client
  - [ ] Redis connection for message persistence
  - [ ] Event handlers: message, typing, read-receipt, reaction
- [ ] Create `docker/socket-server/.env.example` template
- [ ] Create `docker/socket-server/.env.production` for VPS deployment
- [ ] Add volume mounts in docker-compose for socket server logs
- [ ] Test socket server locally before Docker build

### Docker Compose Updates
- [ ] Add `socket-server` service to main `docker-compose.yml`
- [ ] Configure Redis container (if not existing)
- [ ] Set up networking between Directus, Socket server, and frontend
- [ ] Configure port mappings: Directus (8055), Socket (3001), Frontend proxy
- [ ] Add health checks for all services
- [ ] Create separate `.env.docker` and `.env.local` for different environments

### Windows Development Environment Setup
- [ ] Create `.env.development` for Windows with:
  - [ ] `VITE_API_URL=https://admin.itboy.ir/api`
  - [ ] `VITE_SOCKET_URL=http://localhost:3001` (for local dev)
  - [ ] `VITE_SOCKET_URL_VPS=wss://admin.itboy.ir:3001` (for testing against VPS)
- [ ] Install socket.io-client: `npm install socket.io-client`
- [ ] Configure Vite proxy for development
- [ ] Set up auth token persistence in localStorage
- [ ] Create network bridge script for Windows to access Docker services

### API Service Layer
- [ ] Create `src/services/chatAPI.js` with Directus REST calls:
  - [ ] `fetchConversations()`
  - [ ] `fetchMessages(conversationId, limit, offset)`
  - [ ] `sendMessage(conversationId, messageData)`
  - [ ] `markMessageAsRead(messageId)`
  - [ ] `uploadAttachment(file)`
  - [ ] `addReaction(messageId, emoji)`
  - [ ] `updateTypingIndicator(conversationId, isTyping)`
  - [ ] `createConversation(participantIds)`
  - [ ] `archiveConversation(conversationId)`
  - [ ] `blockUser(userId)`
  - [ ] Error handling and retry logic
  - [ ] Request/response interceptors for auth tokens

### Socket Service Layer
- [ ] Create `src/services/chatSocket.js` with Socket.io events:
  - [ ] Connect/disconnect handlers
  - [ ] Event: `message:send` - broadcast new message
  - [ ] Event: `message:read` - update read receipts
  - [ ] Event: `typing:start` / `typing:stop`
  - [ ] Event: `reaction:add` / `reaction:remove`
  - [ ] Event: `notification:send`
  - [ ] Event: `user:online` / `user:offline`
  - [ ] Reconnection logic with exponential backoff
  - [ ] Queue offline messages (IndexedDB)

### Chat State Management
- [ ] Create `src/context/ChatContext.jsx` with:
  - [ ] `conversations` state
  - [ ] `activeConversation` state
  - [ ] `messages` state
  - [ ] `participants` state (for current conversation)
  - [ ] `typingUsers` state
  - [ ] `unreadCounts` state
  - [ ] `onlineUsers` state
  - [ ] Actions: send message, mark read, type indicator, etc.
- [ ] Integrate with Directus sync
- [ ] Add persistence to localStorage for draft messages

---

## PHASE 2: Frontend Component Development (Week 2)

### Core Chat Components
- [ ] **ChatWindow.jsx** (Main container)
  - [ ] Layout: header + message list + input area
  - [ ] Auto-scroll to latest message
  - [ ] Virtual scrolling for performance (react-window)
  - [ ] Responsive: mobile/tablet/desktop

- [ ] **ChatList.jsx** (Conversations sidebar)
  - [ ] List all conversations with last message preview
  - [ ] Unread badge/indicator
  - [ ] Search conversations
  - [ ] Pinned conversations
  - [ ] Archive/mute icons
  - [ ] Click to open conversation

- [ ] **ChatHeader.jsx** (Conversation header)
  - [ ] Participant names/avatars
  - [ ] Online status indicator
  - [ ] Menu (archive, mute, block, settings)
  - [ ] Call/video icons (placeholder)

- [ ] **MessageList.jsx** (Message stream)
  - [ ] Render messages with MessageBubble
  - [ ] Group messages by user/time
  - [ ] Load previous messages on scroll up
  - [ ] Show loading skeleton while fetching
  - [ ] Pagination (30 messages per load)

- [ ] **MessageBubble.jsx** (Single message)
  - [ ] Display message text
  - [ ] Show sender avatar
  - [ ] Timestamp (hover to show full date)
  - [ ] Read receipt status (sent/delivered/read) with checkmarks
  - [ ] Show reactions with emoji
  - [ ] Long-press context menu (Windows: right-click)
  - [ ] Edit indicator if message was edited
  - [ ] Media/file attachments inline

- [ ] **MessageInput.jsx** (Message composer)
  - [ ] Text input with auto-expand
  - [ ] Send button (or Ctrl+Enter)
  - [ ] Emoji picker integration
  - [ ] File attachment button
  - [ ] Mention autocomplete (@username)
  - [ ] Typing indicator triggers
  - [ ] Draft message recovery
  - [ ] Character counter (if applicable)

- [ ] **TypingIndicator.jsx**
  - [ ] Show "User is typing..." with animation
  - [ ] Multiple users typing
  - [ ] Hide after 5 seconds of inactivity

### Feature Components
- [ ] **Reactions.jsx** (Emoji reactions)
  - [ ] Add/remove emoji reactions to messages
  - [ ] Show reaction counts and who reacted
  - [ ] Emoji picker modal (emoji-picker-react)

- [ ] **FileAttachments.jsx**
  - [ ] Display attached files in message
  - [ ] Download/preview capability
  - [ ] File icons based on type
  - [ ] Size display
  - [ ] Progress bar for uploads

- [ ] **ReadReceipt.jsx**
  - [ ] Show delivery status per message
  - [ ] Show read status with timestamp
  - [ ] List of users who read message

- [ ] **UserStatus.jsx**
  - [ ] Online/offline indicator
  - [ ] Last seen timestamp
  - [ ] Active conversation highlight

- [ ] **ContextMenu.jsx** (Message actions)
  - [ ] React with emoji
  - [ ] Reply to message
  - [ ] Edit message (if own)
  - [ ] Delete message (if own, soft delete)
  - [ ] Forward message
  - [ ] Copy to clipboard
  - [ ] Report message

- [ ] **SearchMessages.jsx**
  - [ ] Search within conversation
  - [ ] Filter by user/date
  - [ ] Highlight search results
  - [ ] Navigation through results

- [ ] **ConversationSettings.jsx**
  - [ ] Mute notifications
  - [ ] Archive conversation
  - [ ] Block user
  - [ ] Clear chat history
  - [ ] Export conversation (optional)

### Styling & Responsive Design
- [ ] Create `src/styles/chat/index.css` main stylesheet
- [ ] Implement **mobile-first responsive** (< 640px):
  - [ ] Stack layout (list on top, chat below on selection)
  - [ ] Full-width message bubbles
  - [ ] Touch-friendly buttons (48px min)
  - [ ] Hamburger menu for conversation list
  
- [ ] Implement **tablet layout** (640px - 1024px):
  - [ ] Side-by-side with narrow list
  - [ ] Adjustable splitter
  - [ ] Compact message bubbles
  
- [ ] Implement **desktop layout** (1024px+):
  - [ ] Fixed sidebar (280px)
  - [ ] Full chat area
  - [ ] Optimize for mouse interactions

- [ ] Dark mode support
- [ ] Animations: message fade-in, typing indicator, reactions
- [ ] Accessibility: ARIA labels, keyboard navigation

---

## PHASE 3: Integration & Real-Time Testing (Week 2.5)

### Socket.io Event Testing
- [ ] Test **message flow**: send message on Windows → receive on VPS socket server → broadcast to other clients
- [ ] Test **read receipts**: mark message as read → update in Directus → broadcast to sender
- [ ] Test **typing indicators**: emit typing start → show on other client → timeout
- [ ] Test **reactions**: add emoji → persist to database → real-time sync
- [ ] Test **online status**: connect → broadcast online → disconnect → broadcast offline
- [ ] Test **reconnection**: disconnect intentionally → auto-reconnect → sync missed messages

### Cross-Environment Testing
- [ ] Windows dev to Docker Directus API (HTTPS)
- [ ] Windows dev to Docker Socket server (WebSocket)
- [ ] Multiple browser tabs (same user) - sync state across tabs
- [ ] Multiple users in same conversation
- [ ] Browser offline → queue messages → reconnect → flush queue
- [ ] Long message load (scroll up, pagination)

### Authentication & Security
- [ ] Verify JWT token in socket handshake
- [ ] Verify user permissions per conversation
- [ ] Validate file uploads (size, type, virus scan if applicable)
- [ ] Rate limiting on message send
- [ ] XSS prevention in message rendering
- [ ] CORS validation between services

---

## PHASE 4: Testing & Quality Assurance (Week 3)

### Functional Testing
- [ ] **Message sending**: Create, send, receive, persist
- [ ] **File attachments**: Upload, download, delete
- [ ] **Read receipts**: Sent → Delivered → Read workflow
- [ ] **Reactions**: Add, remove, count display
- [ ] **Typing indicators**: Show/hide properly
- [ ] **Message search**: Find old messages
- [ ] **Conversation archiving**: Hide/restore
- [ ] **User blocking**: Cannot receive messages
- [ ] **Notifications**: Push notification on new message
- [ ] **Pagination**: Load 30 messages per page correctly

### Performance Testing
- [ ] Load 1000 messages - verify scroll performance (60fps)
- [ ] Test with 10+ participants in conversation
- [ ] Message send latency < 200ms
- [ ] Typing indicator latency < 100ms
- [ ] File upload (50MB) with progress
- [ ] Network throttling test (3G simulation)

### Responsive Testing
- [ ] iPhone 12/13/14 (390px width)
- [ ] iPad (768px width)
- [ ] Desktop (1920px width)
- [ ] Touch interactions (mobile)
- [ ] Landscape/portrait orientation

### Cross-Browser Testing
- [ ] Chrome/Chromium (Windows)
- [ ] Firefox (Windows)
- [ ] Edge (Windows)
- [ ] Safari (if Mac available)
- [ ] Mobile browsers (Chrome mobile)

### Stress Testing
- [ ] Simulate 50 concurrent users
- [ ] Rapid message sends (10 messages/second)
- [ ] Large file uploads while chatting
- [ ] Socket reconnection storms
- [ ] Memory leak detection (DevTools)

---

## PHASE 5: Docker Build & Deployment (Week 3.5)

### Frontend Docker Build (Windows → Server)
- [ ] Create `docker/frontend/Dockerfile`:
  - [ ] Build React app with Vite
  - [ ] Optimize bundle size
  - [ ] Serve with Nginx
  - [ ] Production environment variables

- [ ] Create `docker/frontend/.dockerignore`
- [ ] Build image: `docker build -t truck2-frontend:v1 .`
- [ ] Test image locally: `docker run -p 5174:80 truck2-frontend:v1`

### Socket Server Docker Build
- [ ] Create production socket server image
- [ ] Include Redis client
- [ ] Add health check endpoint
- [ ] Optimize for production

### Update Production docker-compose.yml
- [ ] Add frontend service (Nginx)
- [ ] Add socket server service
- [ ] Ensure Directus integration
- [ ] SSL/TLS certificates (Let's Encrypt)
- [ ] Volume mounts for logs and data
- [ ] Environment configuration

### VPS Deployment
- [ ] SSH into VPS
- [ ] Pull latest images
- [ ] Update `.env.production` on server
- [ ] Run `docker-compose up -d`
- [ ] Verify all services running
- [ ] Check logs for errors
- [ ] Test endpoint accessibility

### Production Testing
- [ ] Test chat from production frontend
- [ ] Verify socket server connectivity
- [ ] Test file uploads to production
- [ ] Monitor resource usage (CPU, memory)
- [ ] Set up log aggregation
- [ ] Test SSL certificate validity

---

## PHASE 6: Monitoring & Documentation (Ongoing)

### Monitoring Setup
- [ ] Error tracking (Sentry or similar)
- [ ] Performance monitoring (PageSpeed)
- [ ] Socket.io connection metrics
- [ ] Database query monitoring
- [ ] Uptime monitoring (UptimeRobot)
- [ ] Log rotation for docker containers

### Documentation
- [ ] API documentation (Postman/Swagger)
- [ ] Socket.io event documentation
- [ ] Deployment guide
- [ ] Troubleshooting guide
- [ ] Environment setup guide
- [ ] Code comments and JSDoc

### Backup & Recovery
- [ ] Database backup strategy
- [ ] Message export/import
- [ ] Disaster recovery plan
- [ ] Data retention policy

---

## Development Workflow Commands

### Windows Development (Local)
```bash
# Terminal 1 - React app (watches for changes)
npm run dev

# Terminal 2 - Connect to VPS Socket server
# (Socket server running in Docker on VPS automatically)

# Testing
npm run lint
npm run build
npm run test
```

### Docker Management (VPS)
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f socket-server
docker-compose logs -f directus

# Stop services
docker-compose down
```

---

## Files to Create/Modify

### New Directories
```
docker/
├── socket-server/
│   ├── Dockerfile
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── server.js
│       ├── events/
│       ├── middleware/
│       └── utils/
└── frontend/
    ├── Dockerfile
    └── nginx.conf

src/
├── components/ChatSystem/
│   ├── ChatWindow.jsx
│   ├── ChatList.jsx
│   ├── ChatHeader.jsx
│   ├── MessageList.jsx
│   ├── MessageBubble.jsx
│   ├── MessageInput.jsx
│   ├── TypingIndicator.jsx
│   ├── Reactions.jsx
│   ├── FileAttachments.jsx
│   ├── ReadReceipt.jsx
│   ├── ContextMenu.jsx
│   └── [more components]
├── context/
│   └── ChatContext.jsx
├── services/
│   ├── chatAPI.js
│   ├── chatSocket.js
│   └── fileUpload.js
└── styles/chat/
    ├── index.css
    ├── responsive.css
    └── animations.css
```

---

## Success Criteria
- ✅ Messages send/receive in real-time (< 200ms latency)
- ✅ File uploads work with progress indicator
- ✅ Read receipts update automatically
- ✅ Works on mobile (responsive)
- ✅ Socket reconnection handling
- ✅ Offline message queue
- ✅ Performance: 60fps scrolling with 1000 messages
- ✅ Docker deployment to VPS successful
- ✅ All tests passing
- ✅ Feature parity with Freelancer.com chat

---

## Dependencies Reference
```json
{
  "socket.io-client": "^4.x",
  "emoji-picker-react": "^4.x",
  "react-window": "^1.8.x",
  "clsx": "^2.x",
  "axios": "^1.x"
}
```

---

## Completed Tasks
- [x] Verified all 9 chat collections in Directus
- [x] Fixed collection endpoint (`/collections` not `/api/collections`)
- [x] Created verification scripts

---

**Last Updated**: 2025-11-14

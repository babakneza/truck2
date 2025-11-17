# Chat System Quick Start Guide

Get the chat system running in 5 minutes!

## Prerequisites

- Node.js 22+ installed
- Docker & Docker Compose installed
- Git repository cloned

## Option 1: Local Development (Fastest)

### 1. Install Dependencies
```bash
cd c:\projects\truck2
npm install
```

### 2. Start Development Server
```bash
npm run dev
# Frontend will be available at http://localhost:5174
```

### 3. Start Socket Server in Docker (Optional, for real-time features)
```bash
# In a new terminal
docker-compose up -d socket-server redis
# Socket server will be at ws://localhost:3001
```

### 4. Access the Chat
Open http://localhost:5174 and navigate to the Chat System feature.

---

## Option 2: Full Docker Setup

### 1. Build All Services
```bash
cd c:\projects\truck2
docker-compose build
```

### 2. Start All Services
```bash
docker-compose up -d
```

### 3. Access Services
- **Frontend**: http://localhost
- **API**: Proxied through frontend to https://admin.itboy.ir/api
- **Socket Server**: ws://localhost:3001

### 4. View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f socket-server
docker-compose logs -f frontend
docker-compose logs -f redis
```

### 5. Stop Services
```bash
docker-compose down
```

---

## Testing Chat Features

### 1. Connect to Chat
```bash
# Open browser console
localStorage.setItem('auth_token', 'your-jwt-token')
localStorage.setItem('user_id', 'your-user-id')
```

### 2. Test Features

**Send Message**:
```javascript
// In browser console after connecting
import { chatAPI } from './services/chatAPI'
await chatAPI.messages.send(conversationId, 'Hello!')
```

**Check Connection**:
```javascript
// In browser console
import { chatSocket } from './services/chatSocket'
console.log(chatSocket.isConnected())
```

**View Conversations**:
```javascript
// In browser console
import { chatAPI } from './services/chatAPI'
const convs = await chatAPI.conversations.list()
console.log(convs)
```

---

## Development Workflow

### File Structure
```
src/
├── components/ChatSystem/     # UI Components
├── services/
│   ├── chatAPI.js            # Directus REST API
│   └── chatSocket.js         # Socket.io client
├── context/ChatContext.jsx    # State management
└── styles/chat/              # Styling
```

### Making Changes

1. **Edit components** → Live reload in browser
2. **Edit Socket server** → Rebuild Docker container: `docker-compose up -d --build socket-server`
3. **Edit API service** → No rebuild needed, just refresh browser

### Common Commands

```bash
npm run dev           # Start dev server
npm run lint          # Check code quality
npm run build         # Production build
npm run test          # Run tests

docker-compose logs   # View all logs
docker-compose exec socket-server npm run dev  # Watch socket server (if running in Docker)
```

---

## Connecting to Real Backend

By default, the chat system connects to:
- **API**: https://admin.itboy.ir/api
- **Socket Server**: ws://localhost:3001 (dev) or wss://admin.itboy.ir:3001 (production)

### Switch to VPS Socket Server
```javascript
// In browser console
localStorage.setItem('USE_VPS_SOCKET', 'true')
// Then reload the page
```

### Using Custom Backend
Edit `.env.development`:
```env
VITE_API_URL=https://your-api.com/api
VITE_SOCKET_URL=ws://your-socket.com:3001
```

---

## Debugging

### Check Socket Connection
```bash
# View Socket.io server logs
docker-compose logs -f socket-server

# Check connected clients
docker-compose exec socket-server curl http://localhost:3001/stats
```

### Check API Connection
```bash
# Test API directly
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://admin.itboy.ir/api/items/conversations
```

### Check Redis
```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli

# Check stored messages
redis-cli KEYS '*'
redis-cli GET key-name
```

### Browser DevTools
```javascript
// In browser console to enable debug logging
localStorage.setItem('DEBUG', 'socket.io*')
// Reload page and check console
```

---

## Troubleshooting

### Socket Server Won't Connect
1. Check if running: `docker-compose ps`
2. Check logs: `docker-compose logs socket-server`
3. Check port: `telnet localhost 3001`
4. Restart: `docker-compose restart socket-server`

### Messages Not Sending
1. Check auth token is valid
2. Check conversation ID exists
3. Check browser console for errors
4. Check API endpoint is accessible

### Frontend Not Loading
1. Check Nginx is running: `docker-compose ps`
2. Check logs: `docker-compose logs frontend`
3. Rebuild: `docker-compose up -d --build frontend`

### Redis Connection Issues
1. Check Redis is running: `docker-compose ps`
2. Check connection string in socket server env
3. Restart Redis: `docker-compose restart redis`

---

## Environment Setup

### Generate JWT Secret
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object {Get-Random -Maximum 256}))
```

### Create Local .env Files
```bash
# Socket server
cp docker/socket-server/.env.example docker/socket-server/.env.development

# Frontend
cp .env.development .env.development
```

---

## Performance Tips

1. **Use Virtual Scrolling**: Enabled by default for 1000+ messages
2. **Pagination**: Messages loaded 30 at a time
3. **Lazy Loading**: Socket connects only when needed
4. **Offline Support**: Messages queued when offline

---

## Next Steps

1. ✅ Get chat running locally
2. ✅ Test message sending/receiving
3. ✅ Check typing indicators work
4. ✅ Test file attachments
5. ✅ Test read receipts
6. ✅ Deploy to staging
7. ✅ Load test with multiple users
8. ✅ Deploy to production

---

## Resources

- **Chat System Progress**: [CHAT_SYSTEM_DEVELOPMENT_PROGRESS.md](./CHAT_SYSTEM_DEVELOPMENT_PROGRESS.md)
- **Deployment Guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Architecture Docs**: [MODERN_CHAT_SYSTEM_COMPLETE_GUIDE.md](./MODERN_CHAT_SYSTEM_COMPLETE_GUIDE.md)
- **Socket.io Docs**: https://socket.io/docs/
- **Directus Docs**: https://docs.directus.io/

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review logs: `docker-compose logs`
3. Check browser console for errors
4. Refer to architecture documentation

---

**Last Updated**: November 15, 2025

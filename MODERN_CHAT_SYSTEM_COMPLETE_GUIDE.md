# Modern Chat System - Complete Implementation Guide
## Freelancer.com Style with Real-Time Notifications

**Status**: Ready to Implement
**Total Collections**: 9 (Already Created)
**Estimated Components**: 15-20
**Real-Time Tech**: WebSocket (Socket.io) or WebSub

---

## Table of Contents
1. [System Architecture](#architecture)
2. [Component Structure](#component-structure)
3. [Real-Time Implementation](#real-time)
4. [API Integration Patterns](#api-patterns)
5. [UI/UX Features](#ui-features)
6. [Step-by-Step Implementation](#implementation)
7. [Database Query Patterns](#query-patterns)
8. [Testing Strategy](#testing)

---

## Architecture

### System Overview
```
┌─────────────────────────────────────────────────────────────────┐
│                      TRUCK2 CHAT SYSTEM                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           React Frontend Components                       │   │
│  │  ┌────────────────┐    ┌────────────────────────┐        │   │
│  │  │ ChatList       │    │ ChatWindow             │        │   │
│  │  │ - Conversations│    │ - Message Display      │        │   │
│  │  │ - Search/Filter│    │ - Input Area           │        │   │
│  │  │ - Unread Badge │    │ - Typing Indicator     │        │   │
│  │  │ - Archive      │    │ - Read Receipts        │        │   │
│  │  └────────────────┘    └────────────────────────┘        │   │
│  │         │                       │                         │   │
│  │         └───────────┬───────────┘                         │   │
│  │                     │                                      │   │
│  │  ┌──────────────────────────────────────────────┐        │   │
│  │  │  WebSocket Connection (Socket.io)            │        │   │
│  │  │  - Real-time messages                        │        │   │
│  │  │  - Typing indicators                         │        │   │
│  │  │  - Online status                             │        │   │
│  │  │  - Notifications                             │        │   │
│  │  └──────────────────────────────────────────────┘        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         REST API (Directus REST)                         │   │
│  │  GET  /items/conversations                               │   │
│  │  POST /items/messages                                    │   │
│  │  POST /items/message_reads                               │   │
│  │  POST /items/message_attachments                         │   │
│  │  POST /items/message_reactions                           │   │
│  │  POST /items/typing_indicators                           │   │
│  │  PATCH /items/chat_participants                          │   │
│  │  GET  /items/chat_notifications                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         DIRECTUS DATABASE BACKEND                        │   │
│  │  ├─ conversations (Core chat rooms)                      │   │
│  │  ├─ messages (Message content)                           │   │
│  │  ├─ message_reads (Delivery/read status)                 │   │
│  │  ├─ message_attachments (File uploads)                   │   │
│  │  ├─ message_reactions (Emoji reactions)                  │   │
│  │  ├─ chat_participants (Participant tracking)             │   │
│  │  ├─ typing_indicators (Real-time typing)                 │   │
│  │  ├─ conversation_settings (User preferences)             │   │
│  │  └─ chat_notifications (Notification queue)              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow

**Sending Message**:
```
User types message
    ↓
User clicks Send
    ↓
WebSocket: message:send event
    ↓
Create message via REST API (POST /messages)
    ↓
WebSocket broadcasts to recipient
    ↓
Create message_reads record (status: SENT)
    ↓
Update conversation.last_message_at
    ↓
Update chat_participants.unread_count
    ↓
Create chat_notification if user is offline
    ↓
Optimistic UI update locally
```

**Receiving Notification**:
```
Message sent to recipient
    ↓
Create chat_notification record
    ↓
WebSocket: notification:new event
    ↓
Browser shows push notification (if enabled)
    ↓
In-app notification badge updates
    ↓
Sound plays (if enabled)
    ↓
User sees unread indicator
```

**Reading Message**:
```
User opens chat/scrolls to message
    ↓
Message becomes visible
    ↓
Intersection Observer detects visibility
    ↓
WebSocket: message:read event
    ↓
Update message_reads.status = READ
    ↓
Update chat_participants.unread_count
    ↓
WebSocket broadcasts read status to sender
    ↓
Sender sees "Read" timestamp
```

---

## Component Structure

### Directory Layout
```
src/components/ChatSystem/
├── ChatWindow.jsx                    # Main chat interface
├── ChatList.jsx                      # Conversations sidebar
├── ChatHeader.jsx                    # Chat room header
├── MessageBubble.jsx                 # Individual message
├── MessageInput.jsx                  # Message composition
├── TypingIndicator.jsx               # "X is typing..."
├── ReadReceipt.jsx                   # Delivery/read status
├── ReactionPicker.jsx                # Emoji reaction menu
├── AttachmentPreview.jsx             # File preview
├── FileUploadArea.jsx                # Drag & drop upload
├── MessageReactions.jsx              # Reaction display
├── ConversationSearch.jsx            # Search/filter
├── ConversationSettings.jsx          # Mute, color, label
├── NotificationCenter.jsx            # Notification panel
├── VideoCall.jsx                     # (Optional) Video calling
└── ChatMenu.jsx                      # (Optional) Context menu
```

### Component Hierarchy
```
ChatWindow (Container)
├── ChatHeader
│   ├── UserProfile
│   ├── OnlineStatus
│   └── Settings Menu
├── ChatMessages (Scrollable)
│   └── MessageBubble[] (with lazy loading)
│       ├── MessageContent
│       ├── MessageReactions
│       ├── AttachmentPreview
│       └── ReadReceipt
├── TypingIndicator
├── MessageInput
│   ├── Textarea (auto-expand)
│   ├── EmojiPicker (inline)
│   ├── FileUploadArea (drag-drop)
│   ├── AttachmentPreview
│   └── SendButton
└── ChatList (Sidebar)
    ├── SearchBar
    ├── ConversationItem[] (infinite scroll)
    │   ├── Avatar
    │   ├── Name & Last Message
    │   ├── UnreadBadge
    │   └── ContextMenu
    └── FilterTabs (All, Unread, Archived)
```

---

## Real-Time Implementation

### WebSocket Setup (Socket.io)

**Installation**:
```bash
npm install socket.io-client
```

**Service**: `src/services/chatSocket.js`
```javascript
import io from 'socket.io-client';

class ChatSocket {
  constructor() {
    this.socket = null;
    this.handlers = {};
  }

  connect(token) {
    this.socket = io('https://admin.itboy.ir', {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.setupListeners();
  }

  setupListeners() {
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.emit('user:online', { userId: this.getCurrentUserId() });
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('message:received', (message) => {
      this.triggerHandler('message:received', message);
    });

    this.socket.on('message:read', (data) => {
      this.triggerHandler('message:read', data);
    });

    this.socket.on('user:typing', (data) => {
      this.triggerHandler('user:typing', data);
    });

    this.socket.on('notification:new', (notification) => {
      this.triggerHandler('notification:new', notification);
    });
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  on(event, callback) {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    this.handlers[event].push(callback);
  }

  off(event, callback) {
    if (this.handlers[event]) {
      this.handlers[event] = this.handlers[event].filter(h => h !== callback);
    }
  }

  triggerHandler(event, data) {
    if (this.handlers[event]) {
      this.handlers[event].forEach(callback => callback(data));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export default new ChatSocket();
```

### Real-Time Events

**Client → Server**:
| Event | Payload | Purpose |
|-------|---------|---------|
| `message:send` | `{conversationId, text, attachments}` | Send message |
| `typing:start` | `{conversationId}` | User started typing |
| `typing:stop` | `{conversationId}` | User stopped typing |
| `message:read` | `{conversationId, messageId}` | Mark message as read |
| `conversation:open` | `{conversationId}` | User opened chat |
| `user:online` | `{userId}` | User came online |
| `user:offline` | `{userId}` | User went offline |

**Server → Client**:
| Event | Payload | Purpose |
|-------|---------|---------|
| `message:received` | `{id, conversationId, sender, text, timestamp}` | New message arrived |
| `message:delivered` | `{messageId, deliveredAt}` | Message confirmed delivered |
| `message:read` | `{messageId, readBy, readAt}` | Message marked as read |
| `user:typing` | `{userId, conversationId, typingUser}` | User is typing |
| `user:online` | `{userId, timestamp}` | User came online |
| `user:offline` | `{userId, timestamp}` | User went offline |
| `notification:new` | `{id, type, title, body}` | New notification |

---

## API Integration Patterns

### Authentication
```javascript
// Get auth token on login
const token = localStorage.getItem('auth_token');

// Include in all API calls
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

### Service Layer: `src/services/chatAPI.js`

```javascript
const API_BASE = 'https://admin.itboy.ir/api';
const getHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
  'Content-Type': 'application/json'
});

export const chatAPI = {
  // Conversations
  getConversations: async (filter = {}, limit = 50, offset = 0) => {
    const query = new URLSearchParams({
      fields: ['*', 'initiator_id.*', 'receiver_id.*', 'last_message_id.*'],
      sort: '-last_message_at',
      limit,
      offset
    });
    
    const filterStr = JSON.stringify(filter);
    if (Object.keys(filter).length) {
      query.append('filter', filterStr);
    }

    const res = await fetch(`${API_BASE}/items/conversations?${query}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  createConversation: async (data) => {
    const res = await fetch(`${API_BASE}/items/conversations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        conversation_id: generateUUID(),
        initiator_id: getCurrentUserId(),
        receiver_id: data.receiverId,
        conversation_type: data.type || 'GENERAL',
        shipment_id: data.shipmentId || null,
        bid_id: data.bidId || null
      })
    });
    return res.json();
  },

  // Messages
  getMessages: async (conversationId, limit = 30) => {
    const query = new URLSearchParams({
      fields: ['*', 'sender_id.*', 'message_attachments.*', 'message_reactions.*'],
      filter: JSON.stringify({ conversation_id: { _eq: conversationId } }),
      sort: '-created_at',
      limit
    });

    const res = await fetch(`${API_BASE}/items/messages?${query}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  sendMessage: async (conversationId, messageText, attachments = []) => {
    const res = await fetch(`${API_BASE}/items/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        message_id: generateUUID(),
        conversation_id: conversationId,
        sender_id: getCurrentUserId(),
        message_text: messageText,
        message_type: 'TEXT',
        has_attachments: attachments.length > 0,
        attachment_count: attachments.length
      })
    });
    return res.json();
  },

  // Message Reads
  markAsRead: async (messageId, conversationId) => {
    const res = await fetch(`${API_BASE}/items/message_reads`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        message_id: messageId,
        conversation_id: conversationId,
        reader_id: getCurrentUserId(),
        status: 'READ',
        read_at: new Date().toISOString()
      })
    });
    return res.json();
  },

  getUnreadCount: async (conversationId) => {
    const query = new URLSearchParams({
      filter: JSON.stringify({
        conversation_id: { _eq: conversationId },
        reader_id: { _eq: getCurrentUserId() },
        status: { _neq: 'READ' }
      })
    });

    const res = await fetch(`${API_BASE}/items/message_reads?${query}`, {
      headers: getHeaders()
    });
    const data = await res.json();
    return data.data.length;
  },

  // Attachments
  uploadAttachment: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/files`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      body: formData
    });
    return res.json();
  },

  attachFileToMessage: async (messageId, fileId, fileName, fileSize) => {
    const res = await fetch(`${API_BASE}/items/message_attachments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        message_id: messageId,
        file_name: fileName,
        file_url: `/files/${fileId}`,
        file_size: fileSize,
        file_type: getFileType(fileName),
        file_extension: getFileExtension(fileName),
        category: getFileCategory(fileName),
        uploaded_by_id: getCurrentUserId()
      })
    });
    return res.json();
  },

  // Reactions
  addReaction: async (messageId, emoji, reactionType) => {
    const res = await fetch(`${API_BASE}/items/message_reactions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        message_id: messageId,
        user_id: getCurrentUserId(),
        reaction_emoji: emoji,
        reaction_type: reactionType
      })
    });
    return res.json();
  },

  removeReaction: async (reactionId) => {
    const res = await fetch(`${API_BASE}/items/message_reactions/${reactionId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.ok;
  },

  // Typing Indicators
  sendTyping: async (conversationId) => {
    const res = await fetch(`${API_BASE}/items/typing_indicators`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        conversation_id: conversationId,
        user_id: getCurrentUserId(),
        started_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 5000).toISOString()
      })
    });
    return res.json();
  },

  getTypingUsers: async (conversationId) => {
    const query = new URLSearchParams({
      fields: ['user_id.*'],
      filter: JSON.stringify({
        conversation_id: { _eq: conversationId },
        expires_at: { _gt: 'NOW()' }
      })
    });

    const res = await fetch(`${API_BASE}/items/typing_indicators?${query}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  // Chat Participants
  updateParticipantUnread: async (participantId, unreadCount) => {
    const res = await fetch(`${API_BASE}/items/chat_participants/${participantId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ unread_count: unreadCount })
    });
    return res.json();
  },

  // Conversation Settings
  updateSettings: async (settingsId, settings) => {
    const res = await fetch(`${API_BASE}/items/conversation_settings/${settingsId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(settings)
    });
    return res.json();
  },

  // Notifications
  getNotifications: async (limit = 20) => {
    const query = new URLSearchParams({
      fields: ['*', 'sender_id.*', 'message_id.*'],
      filter: JSON.stringify({
        recipient_id: { _eq: getCurrentUserId() },
        is_read: { _eq: false }
      }),
      sort: '-created_at',
      limit
    });

    const res = await fetch(`${API_BASE}/items/chat_notifications?${query}`, {
      headers: getHeaders()
    });
    return res.json();
  }
};

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getCurrentUserId() {
  return localStorage.getItem('user_id');
}

function getFileType(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'image';
  if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) return 'document';
  if (['mp4', 'avi', 'mov'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio';
  return 'other';
}

function getFileExtension(fileName) {
  return fileName.split('.').pop();
}

function getFileCategory(fileName) {
  return getFileType(fileName).toUpperCase();
}
```

---

## UI/UX Features

### 1. Conversation List
- **Unread Badge**: Red badge showing count
- **Last Message Preview**: Truncated with "..." for long messages
- **Timestamp**: Relative time (e.g., "2 min ago")
- **Online Status**: Green dot for online users
- **Hover Actions**: Archive, mute, pin, delete
- **Search**: Real-time filter by name/message content
- **Tabs**: All, Unread, Archived, Starred

### 2. Message Display
```
┌─────────────────────────────────┐
│ You, 2:34 PM ✓✓                │  ← Sender name, time, read receipt
├─────────────────────────────────┤
│ Hello! How are you?             │  ← Message content
│                                 │
│ 👍 😂                           │  ← Message reactions
├─────────────────────────────────┤
│ [PDF File.pdf] [Image.jpg]      │  ← Attachments
├─────────────────────────────────┤
│           📎 😊 ⋯               │  ← Quick actions (hover)
└─────────────────────────────────┘

Other
┌─────────────────────────────────┐
│ John Doe, 2:35 PM              │
├─────────────────────────────────┤
│ Great! Let's schedule a call    │
└─────────────────────────────────┘

System Message
┌─────────────────────────────────┐
│ Shipment #123 was accepted     │  ← System-generated event
└─────────────────────────────────┘
```

### 3. Read Receipts
- **✓**: Message sent
- **✓✓**: Message delivered to server
- **✓✓** (Blue): Message read by recipient
- Timestamp tooltip: "Read at 2:34 PM"

### 4. Typing Indicator
```
"John Doe is typing..."    ← While user types
"John Doe and 2 others are typing..."  ← Group chat
```

### 5. Notifications
- **Badge**: Unread count on chat icon
- **Toast**: Brief notification when new message arrives (if app is open)
- **Push**: Browser notification (if user enabled)
- **Sound**: Optional notification sound
- **Details**: Sender name, message preview, conversation

### 6. Message Input
```
┌────────────────────────────────────────┐
│ 📎 😊  │ Type a message...    │ [Send] │
│        ├──────────────────────┤        │
│        │ Auto-expands height  │        │
│        │ as you type more...  │        │
└────────────────────────────────────────┘

Auto-scroll textarea:
- Minimum: 1 line (40px)
- Maximum: 5 lines (200px)
- Grows as user types
```

### 7. File Attachments
```
Drag and drop area:
┌─────────────────────────────────┐
│    📁 Drag files here or       │
│       click to browse           │
│  Max 50MB | PDF, JPG, PNG, etc │
└─────────────────────────────────┘

File preview before send:
[PDF File.pdf] [Remove] ✕
[Image.jpg] [Remove] ✕
```

### 8. Emoji & Reactions
```
Quick emoji reactions on message:
👍 😂 ❤️ 😢 😡 🤩 + (show picker)

Reaction counter:
👍 2  😂 1  ❤️ 1
(Click to add/remove)
```

### 9. Context Menu (Right-click on message)
```
┌─────────────────────┐
│ ✎ Edit              │
│ ⊕ Reply             │
│ 👍 Add Reaction     │
│ 📌 Pin              │
│ ✓ Mark as Read      │
│ 🔗 Copy Link        │
│ ⋯ More Options      │
│ ✕ Delete            │
└─────────────────────┘
```

### 10. Conversation Settings Panel
```
Notification Settings:
○ All messages
○ Mentions only
○ None

□ Desktop notifications
□ Mobile notifications
□ Sound enabled

Color Tag: [Blue v]
☆ Star conversation
Custom Label: [____________________]

🔇 Mute until: [Tomorrow v]
🚫 Block user
📦 Archive
```

---

## Step-by-Step Implementation

### Phase 1: Core Components (Week 1)

#### 1. Create ChatWindow Container
**File**: `src/components/ChatSystem/ChatWindow.jsx`

```javascript
import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../../services/chatAPI';
import chatSocket from '../../services/chatSocket';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import TypingIndicator from './TypingIndicator';
import MessageInput from './MessageInput';
import './ChatWindow.css';

export default function ChatWindow({ conversationId }) {
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Load conversation and messages
  useEffect(() => {
    loadMessages();
    loadConversation();
  }, [conversationId]);

  // WebSocket listeners
  useEffect(() => {
    chatSocket.on('message:received', handleNewMessage);
    chatSocket.on('user:typing', handleUserTyping);
    chatSocket.on('message:read', handleMessageRead);

    return () => {
      chatSocket.off('message:received', handleNewMessage);
      chatSocket.off('user:typing', handleUserTyping);
      chatSocket.off('message:read', handleMessageRead);
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when visible
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const messageId = entry.target.dataset.messageId;
          markMessageAsRead(messageId);
        }
      });
    });

    document.querySelectorAll('[data-message-id]').forEach(el => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await chatAPI.getMessages(conversationId, 50);
      setMessages(data.data || []);
    } catch (err) {
      setError('Failed to load messages');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async () => {
    try {
      const data = await chatAPI.getConversations({ id: { _eq: conversationId } }, 1);
      setConversation(data.data?.[0]);
    } catch (err) {
      console.error('Failed to load conversation', err);
    }
  };

  const handleNewMessage = (message) => {
    if (message.conversation_id === conversationId) {
      setMessages(prev => [...prev, message]);
    }
  };

  const handleUserTyping = (data) => {
    if (data.conversation_id === conversationId) {
      setTypingUsers(prev => {
        const filtered = prev.filter(u => u.user_id !== data.user_id);
        return [...filtered, data.user_id];
      });

      setTimeout(() => {
        setTypingUsers(prev => prev.filter(u => u.user_id !== data.user_id));
      }, 5000);
    }
  };

  const handleMessageRead = (data) => {
    if (data.conversation_id === conversationId) {
      setMessages(prev => prev.map(msg => 
        msg.id === data.message_id 
          ? { ...msg, read_receipt: data.read_at }
          : msg
      ));
    }
  };

  const markMessageAsRead = async (messageId) => {
    try {
      await chatAPI.markAsRead(messageId, conversationId);
      chatSocket.emit('message:read', { conversationId, messageId });
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleSendMessage = async (messageText, attachments) => {
    try {
      const message = await chatAPI.sendMessage(conversationId, messageText, attachments);
      
      // Emit via WebSocket for real-time
      chatSocket.emit('message:send', {
        conversationId,
        messageText,
        attachments
      });

      // Optimistic update
      setMessages(prev => [...prev, message.data]);
    } catch (err) {
      setError('Failed to send message');
      console.error(err);
    }
  };

  if (loading) return <div className="chat-loading">Loading...</div>;
  if (error) return <div className="chat-error">{error}</div>;

  return (
    <div className="chat-window">
      <ChatHeader conversation={conversation} />
      <MessageList messages={messages} />
      {typingUsers.length > 0 && <TypingIndicator users={typingUsers} />}
      <MessageInput onSend={handleSendMessage} />
      <div ref={messagesEndRef} />
    </div>
  );
}
```

#### 2. Create ChatList Component
**File**: `src/components/ChatSystem/ChatList.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import { chatAPI } from '../../services/chatAPI';
import './ChatList.css';

export default function ChatList({ onSelectConversation, selectedId }) {
  const [conversations, setConversations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread, archived
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, [filter]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      let filterObj = {};

      if (filter === 'unread') {
        filterObj = { 'chat_participants.unread_count': { _gt: 0 } };
      } else if (filter === 'archived') {
        filterObj = { 'initiator_archived': { _eq: true } };
      }

      const data = await chatAPI.getConversations(filterObj, 50);
      setConversations(data.data || []);
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const otherUser = conv.initiator_id.id === getCurrentUserId() 
      ? conv.receiver_id 
      : conv.initiator_id;
    const name = otherUser.first_name + ' ' + otherUser.last_name;
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h2>Messages</h2>
        <button className="btn-new-chat">+</button>
      </div>

      <input
        type="text"
        placeholder="Search conversations..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="chat-search"
      />

      <div className="chat-filters">
        {['all', 'unread', 'archived'].map(f => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="conversations-list">
        {loading ? (
          <p>Loading...</p>
        ) : filteredConversations.length === 0 ? (
          <p>No conversations</p>
        ) : (
          filteredConversations.map(conv => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isSelected={selectedId === conv.id}
              onSelect={() => onSelectConversation(conv.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ConversationItem({ conversation, isSelected, onSelect }) {
  const otherUser = conversation.initiator_id.id === getCurrentUserId()
    ? conversation.receiver_id
    : conversation.initiator_id;

  const lastMessage = conversation.last_message_id;
  const timeAgo = getTimeAgo(conversation.last_message_at);

  return (
    <div
      className={`conversation-item ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <img
        src={otherUser.avatar_url || '/default-avatar.png'}
        alt={otherUser.first_name}
        className="avatar"
      />
      
      <div className="conversation-content">
        <div className="conversation-header">
          <h3>{otherUser.first_name} {otherUser.last_name}</h3>
          <span className="time">{timeAgo}</span>
        </div>
        <p className="last-message">
          {lastMessage?.message_text?.substring(0, 50)}...
        </p>
      </div>

      {conversation.unread_count > 0 && (
        <span className="unread-badge">{conversation.unread_count}</span>
      )}
    </div>
  );
}

function getTimeAgo(date) {
  const now = new Date();
  const then = new Date(date);
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getCurrentUserId() {
  return localStorage.getItem('user_id');
}
```

#### 3. Create MessageInput Component
**File**: `src/components/ChatSystem/MessageInput.jsx`

```javascript
import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import './MessageInput.css';

export default function MessageInput({ onSend, conversationId }) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(
        textareaRef.current.scrollHeight,
        200
      ) + 'px';
    }
  };

  const handleSend = async () => {
    if (!message.trim() && attachments.length === 0) return;

    setSending(true);
    try {
      // Upload attachments
      const uploadedAttachments = await Promise.all(
        attachments.map(file => uploadFile(file))
      );

      await onSend(message, uploadedAttachments);
      setMessage('');
      setAttachments([]);
    } catch (err) {
      console.error('Failed to send message', err);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('https://admin.itboy.ir/api/files', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      body: formData
    });
    const data = await res.json();
    return { id: data.data.id, name: file.name, size: file.size };
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files].slice(0, 5)); // Max 5 files
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleEmojiClick = (emojiObject) => {
    setMessage(prev => prev + emojiObject.emoji);
    setShowEmoji(false);
  };

  return (
    <div className="message-input-container">
      {attachments.length > 0 && (
        <div className="attachment-preview">
          {attachments.map((file, idx) => (
            <div key={idx} className="attachment-item">
              <span>{file.name}</span>
              <button onClick={() => removeAttachment(idx)}>✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="message-input-wrapper">
        <button
          className="btn-icon"
          onClick={() => fileInputRef.current?.click()}
          title="Attach file"
        >
          📎
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        <div className="relative">
          <button
            className="btn-icon"
            onClick={() => setShowEmoji(!showEmoji)}
          >
            😊
          </button>
          {showEmoji && (
            <div className="emoji-picker-container">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}
        </div>

        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message..."
          rows="1"
          className="message-textarea"
        />

        <button
          className="btn-send"
          onClick={handleSend}
          disabled={sending || (!message.trim() && attachments.length === 0)}
        >
          {sending ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
```

#### 4. Create MessageBubble Component
**File**: `src/components/ChatSystem/MessageBubble.jsx`

```javascript
import React, { useState } from 'react';
import MessageReactions from './MessageReactions';
import AttachmentPreview from './AttachmentPreview';
import './MessageBubble.css';

export default function MessageBubble({ message, isOwn, onReact, onDelete }) {
  const [showActions, setShowActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const getReadStatus = () => {
    if (message.read_receipt) return '✓✓'; // Read
    if (message.delivered_at) return '✓✓'; // Delivered
    return '✓'; // Sent
  };

  const getReadStatusColor = () => {
    if (message.read_receipt) return 'blue';
    return 'gray';
  };

  return (
    <div
      className={`message-bubble ${isOwn ? 'own' : 'other'}`}
      data-message-id={message.id}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isOwn && (
        <img
          src={message.sender_id?.avatar_url || '/default-avatar.png'}
          alt={message.sender_id?.first_name}
          className="message-avatar"
        />
      )}

      <div className="message-content-wrapper">
        <div className="message-bubble-inner">
          {message.message_text && (
            <p className="message-text">{message.message_text}</p>
          )}

          {message.message_attachments?.length > 0 && (
            <div className="message-attachments">
              {message.message_attachments.map(att => (
                <AttachmentPreview key={att.id} attachment={att} />
              ))}
            </div>
          )}

          <div className="message-meta">
            <span className="message-time">
              {new Date(message.created_at).toLocaleTimeString()}
            </span>
            {isOwn && (
              <span className={`read-receipt ${getReadStatusColor()}`}>
                {getReadStatus()}
              </span>
            )}
          </div>
        </div>

        {message.message_reactions?.length > 0 && (
          <MessageReactions reactions={message.message_reactions} />
        )}

        {showActions && (
          <div className="message-actions">
            <button
              className="action-btn"
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              title="Add reaction"
            >
              👍
            </button>
            {isOwn && (
              <>
                <button className="action-btn" title="Edit">✎</button>
                <button className="action-btn" onClick={() => onDelete(message.id)}>
                  ✕
                </button>
              </>
            )}
          </div>
        )}

        {showReactionPicker && (
          <ReactionPicker
            onSelect={(emoji) => {
              onReact(message.id, emoji);
              setShowReactionPicker(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
```

---

### Phase 2: Real-Time & Advanced Features (Week 2-3)

**Continue with:**
- TypingIndicator component
- NotificationCenter component
- ReadReceipt component
- MessageReactions component
- Conversation settings/preferences
- WebSocket integration
- Push notifications (Service Workers)

---

## Database Query Patterns

### Efficient Query Examples

#### Get User's Conversations with Unread Count
```javascript
// Combines conversations and chat_participants
const query = `
  GET /items/conversations?
    filter={"_or":[
      {"initiator_id":{"_eq":${userId}}},
      {"receiver_id":{"_eq":${userId}}}
    ]}&
    fields=*,initiator_id.*,receiver_id.*,chat_participants.*&
    sort=-last_message_at&
    limit=50
`;
```

#### Get Unread Messages for Conversation
```javascript
const query = `
  GET /items/message_reads?
    filter={"_and":[
      {"conversation_id":{"_eq":${conversationId}}},
      {"reader_id":{"_eq":${userId}}},
      {"status":{"_neq":"READ"}}
    ]}&
    fields=*,message_id.*
`;
```

#### Paginate Messages in Conversation
```javascript
const query = `
  GET /items/messages?
    filter={"conversation_id":{"_eq":${conversationId}}}&
    sort=-created_at&
    limit=30&
    offset=${offset}&
    fields=*,sender_id.*,message_attachments.*,message_reactions.*
`;
```

#### Get Active Typing Users
```javascript
const query = `
  GET /items/typing_indicators?
    filter={"_and":[
      {"conversation_id":{"_eq":${conversationId}}},
      {"expires_at":{"_gt":"NOW()"}}
    ]}&
    fields=user_id.*
`;
```

---

## Testing Strategy

### 1. Unit Tests
```bash
npm test -- ChatWindow.test.jsx
npm test -- chatAPI.test.js
npm test -- chatSocket.test.js
```

### 2. Integration Tests
```bash
npm run test -- e2e/chat.spec.js
```

### 3. Manual Testing Scenarios

**Scenario 1: Send Message**
- [ ] Open chat with user
- [ ] Type message
- [ ] Send message
- [ ] Message appears in real-time
- [ ] Read receipt updates

**Scenario 2: Receive Message**
- [ ] User B sends message
- [ ] User A receives in real-time
- [ ] Notification badge updates
- [ ] Sound plays (if enabled)

**Scenario 3: Typing Indicator**
- [ ] User A starts typing
- [ ] "User A is typing..." appears for User B
- [ ] Disappears after 5 seconds
- [ ] Works for multiple users

**Scenario 4: File Attachment**
- [ ] Drag file to input
- [ ] Preview appears
- [ ] File uploads
- [ ] Appears in message

**Scenario 5: Emoji Reactions**
- [ ] Hover on message
- [ ] Click emoji button
- [ ] Select emoji from picker
- [ ] Reaction appears on message
- [ ] Count updates

**Scenario 6: Read Receipts**
- [ ] User A sees "✓" (sent)
- [ ] Message reaches server "✓✓" (delivered)
- [ ] User B reads message "✓✓" (blue, read)
- [ ] Timestamp shows read time

**Scenario 7: Notifications**
- [ ] Message arrives while app closed
- [ ] Browser notification shows
- [ ] Click notification opens chat
- [ ] Notification badge updates

**Scenario 8: Conversation Settings**
- [ ] Star/unstar conversation
- [ ] Change color tag
- [ ] Mute notifications
- [ ] Custom label
- [ ] Settings persist

---

## Performance Optimization

### 1. Pagination
```javascript
// Load initial 30 messages, then load more on scroll
const [offset, setOffset] = useState(0);

const handleScroll = (e) => {
  if (e.target.scrollTop === 0) {
    setOffset(prev => prev + 30);
    loadMoreMessages(offset + 30);
  }
};
```

### 2. Message Virtualization
```javascript
// Only render visible messages using react-window
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={messages.length}
  itemSize={80}
>
  {({ index, style }) => (
    <MessageBubble
      message={messages[index]}
      style={style}
    />
  )}
</FixedSizeList>
```

### 3. Debounce Typing
```javascript
const [typingTimeout, setTypingTimeout] = useState(null);

const handleTyping = () => {
  clearTimeout(typingTimeout);
  
  // Emit typing event
  chatSocket.emit('typing:start', { conversationId });
  
  // Clear after 1 second of inactivity
  const timeout = setTimeout(() => {
    chatSocket.emit('typing:stop', { conversationId });
  }, 1000);
  
  setTypingTimeout(timeout);
};
```

### 4. Cache Conversations
```javascript
// Store in React Context or Redux
const [conversationCache, setConversationCache] = useState({});

const getConversation = (id) => {
  if (conversationCache[id]) {
    return conversationCache[id];
  }
  // Fetch from API
};
```

---

## Security Best Practices

### 1. Row-Level Security
All queries must filter by current user:
```javascript
// ✓ Correct: Filter by current user
GET /items/conversations?filter={"_or":[
  {"initiator_id":{"_eq":$CURRENT_USER}},
  {"receiver_id":{"_eq":$CURRENT_USER}}
]}

// ✗ Wrong: No user filter
GET /items/conversations
```

### 2. Permissions
- Users can only read their own messages
- Users can only send to conversations they're in
- Blocked users cannot send messages
- Admins can moderate messages

### 3. Input Validation
```javascript
// Validate before sending
const validateMessage = (text) => {
  if (!text.trim()) return false;
  if (text.length > 5000) return false;
  return true;
};
```

### 4. Rate Limiting
Implement server-side rate limiting:
- Max 100 messages per minute per user
- Max 10 new conversations per hour
- Max 5 files per minute

---

## Monitoring & Analytics

### Track These Metrics
1. **Message delivery time**: Time from send to delivered
2. **Read time**: Time from delivered to read
3. **Active users**: Users in chat at any moment
4. **Conversation count**: Total conversations per user
5. **Attachment types**: What files users send
6. **Error rate**: Failed sends/receives
7. **WebSocket reliability**: Connection uptime

---

## Deployment Checklist

- [ ] Set up WebSocket server (Socket.io)
- [ ] Configure CORS for Directus API
- [ ] Enable browser push notifications
- [ ] Set up Firebase Cloud Messaging (FCM)
- [ ] Configure email notifications as fallback
- [ ] Set up monitoring/logging
- [ ] Test on mobile browsers
- [ ] Test with slow network (throttle)
- [ ] Load test with 1000+ concurrent users
- [ ] Backup notification data
- [ ] Implement analytics
- [ ] User documentation

---

## Freelancer.com Feature Comparison

| Feature | Freelancer | Your App | Status |
|---------|-----------|----------|--------|
| Conversations | ✓ | ✓ | Ready |
| File Attachments | ✓ | ✓ | Ready |
| Message Search | ✓ | Pending | Need to add |
| Read Receipts | ✓ | ✓ | Ready |
| Typing Indicator | ✓ | ✓ | Ready |
| Emoji Reactions | ✓ | ✓ | Ready |
| Message Reactions | ✓ | ✓ | Ready |
| Notifications | ✓ | ✓ | Ready |
| Mute/Archive | ✓ | ✓ | Ready |
| Call/Video | ✓ | Pending | Optional |
| Message Editing | Partial | Pending | Need to add |
| Message Deletion | Partial | ✓ | Ready |
| User Blocking | ✓ | ✓ | Ready |
| Conversation Pinning | ✓ | Pending | Need to add |
| Custom Labels | ✓ | ✓ | Ready |
| Dark Mode | ✓ | Pending | Need to add |
| Mobile App | ✓ | Pending | Future |

---

## Next Steps

1. **Build Phase 1**: Create all core components
2. **Set up WebSocket**: Connect real-time functionality
3. **Integrate API**: Test all Directus endpoints
4. **UI Polish**: CSS styling and animations
5. **Mobile Responsive**: Test on mobile devices
6. **Performance**: Optimize queries and rendering
7. **Security**: Implement permissions and validation
8. **Testing**: Comprehensive test suite
9. **Deployment**: Production setup
10. **Monitoring**: Error tracking and analytics

---

*This guide provides a complete roadmap for building a professional, production-ready chat system comparable to Freelancer.com.*

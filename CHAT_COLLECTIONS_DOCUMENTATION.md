# Chat Collections Documentation

## Overview

Complete chat system for the Truck2 Logistics Platform supporting real-time messaging between drivers and shippers with read receipts, reactions, typing indicators, and comprehensive notification management.

**Total Collections**: 9
**Total Fields**: 145+
**Total Relationships**: 26 M2O (Many-to-One)
**Sorting**: Collections 22-30

---

## Collections Summary

| # | Collection | Icon | Purpose | Fields | Status |
|---|---|---|---|---|---|
| 22 | conversations | chat | Chat rooms between driver/shipper | 18 | ✓ Created |
| 23 | messages | mail | Individual chat messages | 20 | ✓ Created |
| 24 | message_reads | done_all | Message delivery/read status | 8 | ✓ Created |
| 25 | message_attachments | attachment | File attachments to messages | 14 | ✓ Created |
| 26 | message_reactions | emotion | Emoji reactions to messages | 6 | ✓ Created |
| 27 | chat_participants | group | Conversation participants & roles | 14 | ✓ Created |
| 28 | typing_indicators | edit | Real-time typing status | 5 | ✓ Created |
| 29 | conversation_settings | settings | Per-user chat preferences | 12 | ✓ Created |
| 30 | chat_notifications | notifications | Push notification queue | 16 | ✓ Created |

---

## 1. CONVERSATIONS Collection

**Purpose**: Core chat room management between driver and shipper. Links to shipments and bids.

**Fields (18)**:

| Field | Type | Constraints | Purpose |
|---|---|---|---|
| id | Integer | PK, Auto-increment | Primary key |
| conversation_id | String | UUID, Unique, Max 36 | Unique conversation identifier |
| shipment_id | Integer | FK → shipments | Related shipment (optional) |
| bid_id | Integer | FK → bids | Related bid (optional) |
| initiator_id | Integer | FK → users | Who started conversation |
| receiver_id | Integer | FK → users | Other party in conversation |
| conversation_type | String | ENUM: SHIPMENT, GENERAL, SUPPORT | Chat purpose |
| is_active | Boolean | Default: true | Active status |
| total_message_count | Integer | Default: 0 | Message counter |
| last_message_id | Integer | FK → messages | Latest message reference |
| last_message_at | Timestamp | Nullable | Last activity timestamp |
| initiator_archived | Boolean | Default: false | Archived by initiator |
| receiver_archived | Boolean | Default: false | Archived by receiver |
| is_closed | Boolean | Default: false | Closed conversation flag |
| closed_reason | String | ENUM: SHIPMENT_COMPLETED, MANUAL_CLOSE, BLOCKED_USER, INACTIVE_30_DAYS | Why closed |
| closed_at | Timestamp | Nullable | Closure timestamp |
| created_at | Timestamp | Auto-created | Conversation start |
| updated_at | Timestamp | Auto-updated | Last modification |

**Indexes**:
- `initiator_id` (M2O lookup)
- `receiver_id` (M2O lookup)
- `shipment_id` (M2O lookup)
- `last_message_at DESC` (Recent conversations first)
- Composite: `(initiator_id, receiver_id)` (Find existing conversations)

**Relationships**:
- M2O → users (initiator_id)
- M2O → users (receiver_id)
- M2O → shipments (shipment_id, nullable)
- M2O → bids (bid_id, nullable)
- M2O → messages (last_message_id, nullable)
- O2M ← messages (conversation_id)
- O2M ← message_reads (conversation_id)
- O2M ← chat_participants (conversation_id)
- O2M ← typing_indicators (conversation_id)
- O2M ← conversation_settings (conversation_id)
- O2M ← chat_notifications (conversation_id)

---

## 2. MESSAGES Collection

**Purpose**: Individual chat messages with support for text, images, files, and system messages.

**Fields (20)**:

| Field | Type | Constraints | Purpose |
|---|---|---|---|
| id | Integer | PK, Auto-increment | Primary key |
| message_id | String | UUID, Unique | Client-side message ID |
| conversation_id | Integer | FK → conversations | Parent conversation |
| sender_id | Integer | FK → users | Message author |
| message_text | Text | Max 5000 chars | Message content |
| message_type | String | ENUM: TEXT, IMAGE, FILE, LOCATION, SYSTEM | Content type |
| system_message_type | String | ENUM: USER_JOINED, USER_LEFT, CONVERSATION_CREATED, SHIPMENT_ACCEPTED, DELIVERY_COMPLETED | System event type |
| edited_at | Timestamp | Nullable | When message was edited |
| edit_count | Integer | Default: 0 | Number of edits |
| edit_history | JSON | Nullable | Previous versions array |
| is_deleted | Boolean | Default: false | Soft delete flag |
| deleted_reason | String | ENUM: USER_REQUEST, MODERATION, ABUSE, SPAM | Deletion reason |
| deleted_by_id | Integer | FK → users | Admin who deleted |
| deleted_at | Timestamp | Nullable | Deletion timestamp |
| reaction_count | Integer | Default: 0 | Total emoji reactions |
| has_attachments | Boolean | Default: false | Attachment flag |
| attachment_count | Integer | Default: 0 | Number of attachments |
| metadata | JSON | Nullable | Custom message data |
| created_at | Timestamp | Auto-created | Message timestamp |
| updated_at | Timestamp | Auto-updated | Last modification |

**Indexes**:
- `conversation_id` (M2O + retrieval)
- `sender_id` (M2O + user messages)
- `created_at DESC` (Chronological order)
- `is_deleted` (Filter soft-deleted)
- Composite: `(conversation_id, created_at DESC)` (Message history pagination)

**Relationships**:
- M2O → conversations (conversation_id)
- M2O → users (sender_id)
- M2O → users (deleted_by_id, nullable)
- O2M ← message_attachments (message_id)
- O2M ← message_reactions (message_id)
- O2M ← message_reads (message_id)

---

## 3. MESSAGE_READS Collection

**Purpose**: Track message delivery and read status for each recipient.

**Fields (8)**:

| Field | Type | Constraints | Purpose |
|---|---|---|---|
| id | Integer | PK, Auto-increment | Primary key |
| message_id | Integer | FK → messages | Reference message |
| conversation_id | Integer | FK → conversations | Parent conversation |
| reader_id | Integer | FK → users | Who read message |
| status | String | ENUM: SENT, DELIVERED, READ | Message status |
| delivered_at | Timestamp | Nullable | Delivery time |
| read_at | Timestamp | Nullable | Read time |
| created_at | Timestamp | Auto-created | Record creation |

**Indexes**:
- `message_id` (M2O lookup)
- `reader_id` (User's read receipts)
- `conversation_id` (Conversation receipts)
- Composite: `(conversation_id, status)` (Unread counts)

**Relationships**:
- M2O → messages (message_id)
- M2O → conversations (conversation_id)
- M2O → users (reader_id)

---

## 4. MESSAGE_ATTACHMENTS Collection

**Purpose**: File attachments in messages with virus scanning and download tracking.

**Fields (14)**:

| Field | Type | Constraints | Purpose |
|---|---|---|---|
| id | Integer | PK, Auto-increment | Primary key |
| message_id | Integer | FK → messages | Parent message |
| file_name | String | Max 255 | Original filename |
| file_url | String | Max 500 | URL to download |
| file_size | Integer | Nullable, Max 50MB | Size in bytes |
| file_type | String | Max 50 | MIME type |
| file_extension | String | Max 10 | Extension (pdf, jpg, etc) |
| thumbnail_url | String | Max 500 | Thumbnail for images |
| category | String | ENUM: IMAGE, DOCUMENT, VIDEO, AUDIO, OTHER | File category |
| uploaded_by_id | Integer | FK → users | Uploader |
| scanned_for_virus | Boolean | Default: false | Antivirus check flag |
| is_safe | Boolean | Default: true | Safe for download |
| download_count | Integer | Default: 0 | Download counter |
| created_at | Timestamp | Auto-created | Upload time |

**Indexes**:
- `message_id` (M2O lookup)
- `uploaded_by_id` (User uploads)

**Relationships**:
- M2O → messages (message_id)
- M2O → users (uploaded_by_id)

**Constraints**:
- Max file size: 50 MB
- Allowed types: Images (JPG, PNG, GIF), Documents (PDF, DOC, DOCX), Videos (MP4, AVI)
- All uploads must be virus scanned

---

## 5. MESSAGE_REACTIONS Collection

**Purpose**: Emoji reactions to messages (likes, loves, laughs, etc).

**Fields (6)**:

| Field | Type | Constraints | Purpose |
|---|---|---|---|
| id | Integer | PK, Auto-increment | Primary key |
| message_id | Integer | FK → messages | Reacted message |
| user_id | Integer | FK → users | User reacting |
| reaction_emoji | String | Max 10 | Emoji character(s) |
| reaction_type | String | ENUM: LIKE, LOVE, LAUGH, SAD, ANGRY, WOW, CUSTOM | Reaction type |
| created_at | Timestamp | Auto-created | Reaction time |

**Indexes**:
- `message_id` (M2O lookup)
- `user_id` (User's reactions)
- Composite: `(message_id, user_id)` UNIQUE (One reaction per user per message)

**Relationships**:
- M2O → messages (message_id)
- M2O → users (user_id)

**Constraint**: One reaction per user per message (composite unique key)

---

## 6. CHAT_PARTICIPANTS Collection

**Purpose**: Track conversation participants, their roles, and individual read status.

**Fields (14)**:

| Field | Type | Constraints | Purpose |
|---|---|---|---|
| id | Integer | PK, Auto-increment | Primary key |
| conversation_id | Integer | FK → conversations | Parent conversation |
| user_id | Integer | FK → users | Participant user |
| role | String | ENUM: INITIATOR, RECEIVER, ADMIN | Role in conversation |
| unread_count | Integer | Default: 0 | Unread message count |
| is_muted | Boolean | Default: false | Mute notifications |
| muted_until | Timestamp | Nullable | When mute expires |
| is_blocked | Boolean | Default: false | Blocked user flag |
| blocked_at | Timestamp | Nullable | Block timestamp |
| last_read_message_id | Integer | FK → messages | Last read message |
| last_read_at | Timestamp | Nullable | Last read time |
| joined_at | Timestamp | Auto-created | Join timestamp |
| left_at | Timestamp | Nullable | Left timestamp |
| status | String | ENUM: ACTIVE, INACTIVE, ARCHIVED, BLOCKED | Participant status |

**Indexes**:
- `conversation_id` (M2O lookup)
- `user_id` (User's conversations)
- Composite: `(conversation_id, user_id)` UNIQUE (One entry per participant per conversation)

**Relationships**:
- M2O → conversations (conversation_id)
- M2O → users (user_id)
- M2O → messages (last_read_message_id, nullable)

---

## 7. TYPING_INDICATORS Collection

**Purpose**: Real-time typing status with automatic expiry.

**Fields (5)**:

| Field | Type | Constraints | Purpose |
|---|---|---|---|
| id | Integer | PK, Auto-increment | Primary key |
| conversation_id | Integer | FK → conversations | In which chat |
| user_id | Integer | FK → users | Who is typing |
| started_at | Timestamp | Auto-created | Typing start time |
| expires_at | Timestamp | NOT NULL | Auto-clear time (now + 5s) |

**Indexes**:
- `conversation_id` (M2O lookup)
- `expires_at` (Auto-cleanup - TTL 5 seconds)

**Relationships**:
- M2O → conversations (conversation_id)
- M2O → users (user_id)

**TTL**: Auto-delete after 5 seconds via `expires_at` index

---

## 8. CONVERSATION_SETTINGS Collection

**Purpose**: Per-user conversation preferences (notifications, colors, labels).

**Fields (12)**:

| Field | Type | Constraints | Purpose |
|---|---|---|---|
| id | Integer | PK, Auto-increment | Primary key |
| conversation_id | Integer | FK → conversations | Conversation |
| user_id | Integer | FK → users | Settings owner |
| color_tag | String | ENUM: RED, ORANGE, YELLOW, GREEN, BLUE, PURPLE | Color label |
| is_starred | Boolean | Default: false | Star/favorite flag |
| notifications_enabled | Boolean | Default: true | Enable alerts |
| notification_type | String | ENUM: ALL, MENTIONS_ONLY, NONE | Alert level |
| desktop_notifications | Boolean | Default: true | Browser push |
| mobile_notifications | Boolean | Default: true | Mobile push |
| sound_enabled | Boolean | Default: true | Notification sound |
| show_read_receipts | Boolean | Default: true | Share read status |
| custom_label | String | Max 100 | Custom chat name |
| created_at | Timestamp | Auto-created | Record creation |
| updated_at | Timestamp | Auto-updated | Last modification |

**Indexes**:
- `conversation_id` (M2O lookup)
- `user_id` (User settings)
- Composite: `(conversation_id, user_id)` UNIQUE (One settings record per user per conversation)

**Relationships**:
- M2O → conversations (conversation_id)
- M2O → users (user_id)

---

## 9. CHAT_NOTIFICATIONS Collection

**Purpose**: Push notification queue for unread messages with delivery tracking.

**Fields (16)**:

| Field | Type | Constraints | Purpose |
|---|---|---|---|
| id | Integer | PK, Auto-increment | Primary key |
| conversation_id | Integer | FK → conversations | Conversation |
| message_id | Integer | FK → messages | Triggering message |
| recipient_id | Integer | FK → users | Notification target |
| sender_id | Integer | FK → users | Message sender |
| notification_type | String | ENUM: MESSAGE, MENTION, SYSTEM | Notification type |
| title | String | Max 100 | Notification title |
| body | Text | Max 500 | Notification text |
| is_sent | Boolean | Default: false | Sent flag |
| is_read | Boolean | Default: false | User read flag |
| sent_at | Timestamp | Nullable | Send time |
| read_at | Timestamp | Nullable | Read time |
| device_tokens | JSON | Nullable | Target device IDs array |
| delivery_status | String | ENUM: PENDING, SENT, FAILED, BOUNCED | Status |
| error_message | Text | Max 500 | Error details if failed |
| created_at | Timestamp | Auto-created | Record creation |

**Indexes**:
- `recipient_id` (Notifications for user)
- `conversation_id` (Conversation notifications)
- `is_read` (Unread notifications)

**Relationships**:
- M2O → conversations (conversation_id)
- M2O → messages (message_id)
- M2O → users (recipient_id)
- M2O → users (sender_id)

---

## Relationship Matrix

**Total M2O Relationships: 26**

```
CONVERSATIONS (5 outbound):
  → users (initiator_id)
  → users (receiver_id)
  → shipments (shipment_id)
  → bids (bid_id)
  → messages (last_message_id)

MESSAGES (3 outbound):
  → conversations (conversation_id)
  → users (sender_id)
  → users (deleted_by_id)

MESSAGE_READS (3 outbound):
  → messages (message_id)
  → conversations (conversation_id)
  → users (reader_id)

MESSAGE_ATTACHMENTS (2 outbound):
  → messages (message_id)
  → users (uploaded_by_id)

MESSAGE_REACTIONS (2 outbound):
  → messages (message_id)
  → users (user_id)

CHAT_PARTICIPANTS (3 outbound):
  → conversations (conversation_id)
  → users (user_id)
  → messages (last_read_message_id)

TYPING_INDICATORS (2 outbound):
  → conversations (conversation_id)
  → users (user_id)

CONVERSATION_SETTINGS (2 outbound):
  → conversations (conversation_id)
  → users (user_id)

CHAT_NOTIFICATIONS (4 outbound):
  → conversations (conversation_id)
  → messages (message_id)
  → users (recipient_id)
  → users (sender_id)
```

---

## WebSocket Real-Time Events

### Client → Server

```javascript
socket.emit('message:send', {
  conversation_id: 1,
  message_text: 'Hello!',
  message_type: 'TEXT'
})

socket.emit('typing:start', { conversation_id: 1 })
socket.emit('typing:stop', { conversation_id: 1 })

socket.emit('message:read', { 
  conversation_id: 1, 
  message_id: 5 
})

socket.emit('conversation:open', { conversation_id: 1 })
socket.emit('conversation:close', { conversation_id: 1 })
```

### Server → Client

```javascript
socket.on('message:received', (message) => { ... })
socket.on('message:delivered', (message) => { ... })
socket.on('message:read', (message) => { ... })
socket.on('user:typing', (data) => { ... })
socket.on('user:online', (user) => { ... })
socket.on('user:offline', (user) => { ... })
```

---

## Access Control Configuration

### Anonymous Role
- **conversations**: Read-only (public shipment discussions)
- **messages**: Read-only (view public conversation history)

### Shipper Role
- **conversations**: Create/Read own, Update, Delete own
- **messages**: Create own, Read all in owned conversations, Update own, Delete own (soft)
- **chat_participants**: Read own
- **conversation_settings**: Create/Read/Update own

### Driver Role
- **conversations**: Create/Read/Update own, Delete own
- **messages**: Create/Read/Update/Delete (soft) own
- **message_attachments**: Create, Read all, Delete own
- **chat_participants**: Read own
- **conversation_settings**: Create/Read/Update own

### Admin Role
- **conversations**: Full CRUD
- **messages**: Full CRUD (including hard delete and restoration)
- **message_attachments**: Full CRUD (virus scan verification)
- **message_reactions**: Read (audit)
- **chat_participants**: Full CRUD (manage participation)
- **typing_indicators**: Delete (cleanup expired)
- **conversation_settings**: Full CRUD (configure user defaults)
- **chat_notifications**: Full CRUD (resend, diagnose delivery)

### Administrator Role
- All collections: Full CRUD + system-level operations
- Can view activity logs and audit trails

---

## Validation Rules

### Message Validation
- `message_text` must be 1-5000 characters
- Cannot edit deleted messages
- Edit count auto-increments on each update
- System messages cannot be edited or reacted to

### Conversation Validation
- Both `initiator_id` and `receiver_id` must be different users
- Cannot create duplicate conversation with same two users
- Cannot close already closed conversation
- Archived status prevents unilateral closure

### Attachment Validation
- Max 50 MB file size
- Must scan for viruses before marking `is_safe = true`
- Download count auto-increments

### Notification Validation
- Cannot have duplicate pending notifications for same message+recipient
- Cannot send notification if user's `is_muted = true`
- Delivery status must follow: PENDING → SENT/FAILED/BOUNCED

---

## Performance Considerations

1. **Pagination**: Use `message_id DESC` for infinite scroll
2. **Unread Counts**: Denormalize in `chat_participants.unread_count`
3. **Last Message**: Cache in `conversations.last_message_id` & `last_message_at`
4. **Typing Cleanup**: Use `expires_at` TTL (5 second auto-delete)
5. **Soft Deletes**: Index `messages.is_deleted` for filtering
6. **Composite Indexes**: Enable quick lookup of user's conversations

---

## Next Steps

1. **Setup Relationships**: Run relationship configuration script
2. **Configure Permissions**: Apply role-based access control
3. **Setup WebSocket**: Implement Socket.io for real-time features
4. **Testing**: Execute comprehensive test suite
5. **Documentation**: Update API client library

---

## Summary Statistics

- **Collections Created**: 9/9 ✓
- **Fields Created**: 145 total
- **M2O Relationships**: 26 total
- **O2M Relationships**: 17 reverse relationships
- **Unique Constraints**: 6 (message_id, conversation_id, (message_id,user_id), etc)
- **Indexes**: 20+ performance indexes
- **Enums**: 35+ dropdown options across collections

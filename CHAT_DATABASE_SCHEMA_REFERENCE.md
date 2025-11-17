# Chat System - Database Schema Reference

## Quick Schema Overview

```sql
-- Core Tables (2)
conversations
  id ➜ messages (O2M)
  messages ➜ messages (O2M)
  message_reads (O2M)
  chat_participants (O2M)
  typing_indicators (O2M)
  conversation_settings (O2M)

messages
  conversation_id ➜ conversations (M2O)
  sender_id ➜ users (M2O)
  message_attachments (O2M)
  message_reactions (O2M)
  message_reads (O2M)

-- Features (7)
message_reads (Delivery/read tracking)
message_attachments (File uploads)
message_reactions (Emoji reactions)
chat_participants (Participant management)
typing_indicators (Real-time typing)
conversation_settings (User preferences)
chat_notifications (Push notification queue)
```

---

## 1. CONVERSATIONS Table

**Purpose**: Core chat room management

```sql
CREATE TABLE conversations (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  conversation_id VARCHAR(36) UNIQUE NOT NULL,
  shipment_id INTEGER,
  bid_id INTEGER,
  initiator_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  conversation_type ENUM('SHIPMENT', 'GENERAL', 'SUPPORT') DEFAULT 'GENERAL',
  is_active BOOLEAN DEFAULT true,
  total_message_count INTEGER DEFAULT 0,
  last_message_id INTEGER,
  last_message_at TIMESTAMP NULL,
  initiator_archived BOOLEAN DEFAULT false,
  receiver_archived BOOLEAN DEFAULT false,
  is_closed BOOLEAN DEFAULT false,
  closed_reason ENUM('SHIPMENT_COMPLETED', 'MANUAL_CLOSE', 'BLOCKED_USER', 'INACTIVE_30_DAYS'),
  closed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign Keys
  CONSTRAINT fk_initiator FOREIGN KEY (initiator_id) REFERENCES users(id),
  CONSTRAINT fk_receiver FOREIGN KEY (receiver_id) REFERENCES users(id),
  CONSTRAINT fk_shipment FOREIGN KEY (shipment_id) REFERENCES shipments(id),
  CONSTRAINT fk_bid FOREIGN KEY (bid_id) REFERENCES bids(id),
  CONSTRAINT fk_last_message FOREIGN KEY (last_message_id) REFERENCES messages(id),

  -- Indexes
  INDEX idx_initiator (initiator_id),
  INDEX idx_receiver (receiver_id),
  INDEX idx_last_message_at (last_message_at DESC),
  UNIQUE INDEX idx_participants (initiator_id, receiver_id)
);
```

**Example Data**:
```json
{
  "id": 1,
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "shipment_id": 42,
  "bid_id": 15,
  "initiator_id": 2,
  "receiver_id": 5,
  "conversation_type": "SHIPMENT",
  "is_active": true,
  "total_message_count": 24,
  "last_message_id": 450,
  "last_message_at": "2025-11-14T19:36:00Z",
  "initiator_archived": false,
  "receiver_archived": false,
  "is_closed": false,
  "created_at": "2025-11-10T10:00:00Z",
  "updated_at": "2025-11-14T19:36:00Z"
}
```

**Queries**:

Get user's conversations:
```sql
SELECT * FROM conversations
WHERE (initiator_id = ? OR receiver_id = ?)
  AND is_active = true
ORDER BY last_message_at DESC
LIMIT 50;
```

Find existing conversation:
```sql
SELECT * FROM conversations
WHERE (initiator_id = ? AND receiver_id = ?)
   OR (initiator_id = ? AND receiver_id = ?)
LIMIT 1;
```

Get unread conversations:
```sql
SELECT c.*, COUNT(mr.id) as unread_count
FROM conversations c
LEFT JOIN message_reads mr ON c.id = mr.conversation_id 
  AND mr.reader_id = ? 
  AND mr.status != 'READ'
WHERE (c.initiator_id = ? OR c.receiver_id = ?)
GROUP BY c.id
HAVING unread_count > 0;
```

---

## 2. MESSAGES Table

**Purpose**: Individual message content with edit/delete history

```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  message_id VARCHAR(36) UNIQUE NOT NULL,
  conversation_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  message_text TEXT,
  message_type ENUM('TEXT', 'IMAGE', 'FILE', 'LOCATION', 'SYSTEM') DEFAULT 'TEXT',
  system_message_type ENUM('USER_JOINED', 'USER_LEFT', 'CONVERSATION_CREATED', 
    'SHIPMENT_ACCEPTED', 'DELIVERY_COMPLETED'),
  edited_at TIMESTAMP NULL,
  edit_count INTEGER DEFAULT 0,
  edit_history JSON,
  is_deleted BOOLEAN DEFAULT false,
  deleted_reason ENUM('USER_REQUEST', 'MODERATION', 'ABUSE', 'SPAM'),
  deleted_by_id INTEGER,
  deleted_at TIMESTAMP NULL,
  reaction_count INTEGER DEFAULT 0,
  has_attachments BOOLEAN DEFAULT false,
  attachment_count INTEGER DEFAULT 0,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign Keys
  CONSTRAINT fk_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  CONSTRAINT fk_sender FOREIGN KEY (sender_id) REFERENCES users(id),
  CONSTRAINT fk_deleted_by FOREIGN KEY (deleted_by_id) REFERENCES users(id),

  -- Indexes
  INDEX idx_conversation (conversation_id),
  INDEX idx_sender (sender_id),
  INDEX idx_created_at (created_at DESC),
  INDEX idx_is_deleted (is_deleted),
  UNIQUE INDEX idx_msg_conversation_time (conversation_id, created_at DESC)
);
```

**Example Data**:
```json
{
  "id": 450,
  "message_id": "660e8400-e29b-41d4-a716-446655440001",
  "conversation_id": 1,
  "sender_id": 2,
  "message_text": "When can you deliver?",
  "message_type": "TEXT",
  "edited_at": null,
  "edit_count": 0,
  "is_deleted": false,
  "reaction_count": 1,
  "has_attachments": false,
  "attachment_count": 0,
  "created_at": "2025-11-14T19:36:00Z",
  "updated_at": "2025-11-14T19:36:00Z"
}
```

**Queries**:

Get conversation messages (paginated):
```sql
SELECT m.*, u.first_name, u.last_name, u.avatar_url
FROM messages m
JOIN users u ON m.sender_id = u.id
WHERE m.conversation_id = ? AND m.is_deleted = false
ORDER BY m.created_at DESC
LIMIT 30 OFFSET ?;
```

Get latest message in conversation:
```sql
SELECT * FROM messages
WHERE conversation_id = ? AND is_deleted = false
ORDER BY created_at DESC
LIMIT 1;
```

Search messages:
```sql
SELECT * FROM messages
WHERE conversation_id = ? 
  AND message_text LIKE ? 
  AND is_deleted = false
ORDER BY created_at DESC;
```

Get edited messages (audit):
```sql
SELECT * FROM messages
WHERE edit_count > 0
ORDER BY edited_at DESC;
```

---

## 3. MESSAGE_READS Table

**Purpose**: Track message delivery and read status

```sql
CREATE TABLE message_reads (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  message_id INTEGER NOT NULL,
  conversation_id INTEGER NOT NULL,
  reader_id INTEGER NOT NULL,
  status ENUM('SENT', 'DELIVERED', 'READ') DEFAULT 'SENT',
  delivered_at TIMESTAMP NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign Keys
  CONSTRAINT fk_msg FOREIGN KEY (message_id) REFERENCES messages(id),
  CONSTRAINT fk_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  CONSTRAINT fk_reader FOREIGN KEY (reader_id) REFERENCES users(id),

  -- Indexes
  INDEX idx_message (message_id),
  INDEX idx_reader (reader_id),
  INDEX idx_conversation (conversation_id),
  UNIQUE INDEX idx_msg_reader (message_id, reader_id)
);
```

**Example Data**:
```json
{
  "id": 1050,
  "message_id": 450,
  "conversation_id": 1,
  "reader_id": 5,
  "status": "READ",
  "delivered_at": "2025-11-14T19:36:05Z",
  "read_at": "2025-11-14T19:36:10Z",
  "created_at": "2025-11-14T19:36:00Z"
}
```

**Queries**:

Get unread messages for user:
```sql
SELECT COUNT(*) as unread_count
FROM message_reads
WHERE reader_id = ? AND status != 'READ';
```

Get read status for message:
```sql
SELECT reader_id, status, read_at
FROM message_reads
WHERE message_id = ?
ORDER BY read_at DESC;
```

Mark all messages as read:
```sql
UPDATE message_reads
SET status = 'READ', read_at = NOW()
WHERE conversation_id = ? AND reader_id = ? AND status != 'READ';
```

Unread count per conversation:
```sql
SELECT conversation_id, COUNT(*) as unread_count
FROM message_reads
WHERE reader_id = ? AND status != 'READ'
GROUP BY conversation_id;
```

---

## 4. MESSAGE_ATTACHMENTS Table

**Purpose**: File attachments to messages

```sql
CREATE TABLE message_attachments (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  message_id INTEGER NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(50),
  file_extension VARCHAR(10),
  thumbnail_url VARCHAR(500),
  category ENUM('IMAGE', 'DOCUMENT', 'VIDEO', 'AUDIO', 'OTHER'),
  uploaded_by_id INTEGER NOT NULL,
  scanned_for_virus BOOLEAN DEFAULT false,
  is_safe BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign Keys
  CONSTRAINT fk_msg_attach FOREIGN KEY (message_id) REFERENCES messages(id),
  CONSTRAINT fk_uploader FOREIGN KEY (uploaded_by_id) REFERENCES users(id),

  -- Indexes
  INDEX idx_message_attach (message_id),
  INDEX idx_uploader (uploaded_by_id)
);
```

**Example Data**:
```json
{
  "id": 125,
  "message_id": 450,
  "file_name": "shipping_label.pdf",
  "file_url": "/files/abc123def456",
  "file_size": 1048576,
  "file_type": "application/pdf",
  "file_extension": "pdf",
  "category": "DOCUMENT",
  "uploaded_by_id": 2,
  "scanned_for_virus": true,
  "is_safe": true,
  "download_count": 3,
  "created_at": "2025-11-14T19:36:00Z"
}
```

**Queries**:

Get message attachments:
```sql
SELECT * FROM message_attachments
WHERE message_id = ?
ORDER BY created_at DESC;
```

Get user uploads (audit):
```sql
SELECT * FROM message_attachments
WHERE uploaded_by_id = ?
ORDER BY created_at DESC;
```

Get downloads report:
```sql
SELECT file_name, download_count
FROM message_attachments
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY download_count DESC;
```

---

## 5. MESSAGE_REACTIONS Table

**Purpose**: Emoji reactions to messages

```sql
CREATE TABLE message_reactions (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  message_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  reaction_emoji VARCHAR(10) NOT NULL,
  reaction_type ENUM('LIKE', 'LOVE', 'LAUGH', 'SAD', 'ANGRY', 'WOW', 'CUSTOM'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign Keys
  CONSTRAINT fk_msg_react FOREIGN KEY (message_id) REFERENCES messages(id),
  CONSTRAINT fk_reacting_user FOREIGN KEY (user_id) REFERENCES users(id),

  -- Indexes
  INDEX idx_message_react (message_id),
  INDEX idx_user_react (user_id),
  UNIQUE INDEX idx_user_reaction (message_id, user_id)
);
```

**Example Data**:
```json
{
  "id": 42,
  "message_id": 450,
  "user_id": 5,
  "reaction_emoji": "👍",
  "reaction_type": "LIKE",
  "created_at": "2025-11-14T19:36:30Z"
}
```

**Queries**:

Get reactions for message:
```sql
SELECT reaction_emoji, COUNT(*) as count, 
       GROUP_CONCAT(DISTINCT user_id) as users
FROM message_reactions
WHERE message_id = ?
GROUP BY reaction_emoji;
```

Check if user reacted:
```sql
SELECT * FROM message_reactions
WHERE message_id = ? AND user_id = ?;
```

Remove reaction:
```sql
DELETE FROM message_reactions
WHERE message_id = ? AND user_id = ?;
```

---

## 6. CHAT_PARTICIPANTS Table

**Purpose**: Track conversation participants and status

```sql
CREATE TABLE chat_participants (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  conversation_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role ENUM('INITIATOR', 'RECEIVER', 'ADMIN') DEFAULT 'RECEIVER',
  unread_count INTEGER DEFAULT 0,
  is_muted BOOLEAN DEFAULT false,
  muted_until TIMESTAMP NULL,
  is_blocked BOOLEAN DEFAULT false,
  blocked_at TIMESTAMP NULL,
  last_read_message_id INTEGER,
  last_read_at TIMESTAMP NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP NULL,
  status ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED', 'BLOCKED') DEFAULT 'ACTIVE',

  -- Foreign Keys
  CONSTRAINT fk_conv_part FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  CONSTRAINT fk_user_part FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_last_read_msg FOREIGN KEY (last_read_message_id) REFERENCES messages(id),

  -- Indexes
  INDEX idx_conversation_part (conversation_id),
  INDEX idx_user_part (user_id),
  UNIQUE INDEX idx_conv_user (conversation_id, user_id)
);
```

**Example Data**:
```json
{
  "id": 88,
  "conversation_id": 1,
  "user_id": 5,
  "role": "RECEIVER",
  "unread_count": 3,
  "is_muted": false,
  "is_blocked": false,
  "last_read_message_id": 447,
  "last_read_at": "2025-11-14T19:35:00Z",
  "status": "ACTIVE",
  "joined_at": "2025-11-10T10:00:00Z"
}
```

**Queries**:

Get participant info:
```sql
SELECT * FROM chat_participants
WHERE conversation_id = ? AND user_id = ?;
```

Update unread count:
```sql
UPDATE chat_participants
SET unread_count = 0, last_read_at = NOW()
WHERE conversation_id = ? AND user_id = ?;
```

Get unread counts for user:
```sql
SELECT conversation_id, unread_count
FROM chat_participants
WHERE user_id = ? AND unread_count > 0;
```

Mute conversation:
```sql
UPDATE chat_participants
SET is_muted = true, muted_until = DATE_ADD(NOW(), INTERVAL 8 HOUR)
WHERE conversation_id = ? AND user_id = ?;
```

---

## 7. TYPING_INDICATORS Table

**Purpose**: Real-time typing status (auto-cleanup: TTL 5 seconds)

```sql
CREATE TABLE typing_indicators (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  conversation_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,

  -- Foreign Keys
  CONSTRAINT fk_conv_typing FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  CONSTRAINT fk_user_typing FOREIGN KEY (user_id) REFERENCES users(id),

  -- Indexes
  INDEX idx_conversation_typing (conversation_id),
  INDEX idx_expires_at (expires_at)
);

-- Auto-cleanup job (run every minute)
DELETE FROM typing_indicators WHERE expires_at < NOW();
```

**Example Data**:
```json
{
  "id": 200,
  "conversation_id": 1,
  "user_id": 5,
  "started_at": "2025-11-14T19:36:30Z",
  "expires_at": "2025-11-14T19:36:35Z"
}
```

**Queries**:

Get active typers:
```sql
SELECT u.id, u.first_name, u.last_name
FROM typing_indicators t
JOIN users u ON t.user_id = u.id
WHERE t.conversation_id = ? AND t.expires_at > NOW();
```

Clean expired:
```sql
DELETE FROM typing_indicators WHERE expires_at < NOW();
```

---

## 8. CONVERSATION_SETTINGS Table

**Purpose**: Per-user conversation preferences

```sql
CREATE TABLE conversation_settings (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  conversation_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  color_tag ENUM('RED', 'ORANGE', 'YELLOW', 'GREEN', 'BLUE', 'PURPLE'),
  is_starred BOOLEAN DEFAULT false,
  notifications_enabled BOOLEAN DEFAULT true,
  notification_type ENUM('ALL', 'MENTIONS_ONLY', 'NONE') DEFAULT 'ALL',
  desktop_notifications BOOLEAN DEFAULT true,
  mobile_notifications BOOLEAN DEFAULT true,
  sound_enabled BOOLEAN DEFAULT true,
  show_read_receipts BOOLEAN DEFAULT true,
  custom_label VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign Keys
  CONSTRAINT fk_conv_settings FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  CONSTRAINT fk_user_settings FOREIGN KEY (user_id) REFERENCES users(id),

  -- Indexes
  INDEX idx_conversation_settings (conversation_id),
  INDEX idx_user_settings (user_id),
  UNIQUE INDEX idx_conv_user_settings (conversation_id, user_id)
);
```

**Example Data**:
```json
{
  "id": 45,
  "conversation_id": 1,
  "user_id": 5,
  "color_tag": "BLUE",
  "is_starred": true,
  "notifications_enabled": true,
  "notification_type": "ALL",
  "desktop_notifications": true,
  "mobile_notifications": true,
  "sound_enabled": true,
  "show_read_receipts": true,
  "custom_label": "Delivery Partner",
  "created_at": "2025-11-10T10:00:00Z",
  "updated_at": "2025-11-14T19:36:00Z"
}
```

**Queries**:

Get user settings:
```sql
SELECT * FROM conversation_settings
WHERE conversation_id = ? AND user_id = ?;
```

Get starred conversations:
```sql
SELECT conversation_id FROM conversation_settings
WHERE user_id = ? AND is_starred = true;
```

---

## 9. CHAT_NOTIFICATIONS Table

**Purpose**: Push notification queue

```sql
CREATE TABLE chat_notifications (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  conversation_id INTEGER NOT NULL,
  message_id INTEGER NOT NULL,
  recipient_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  notification_type ENUM('MESSAGE', 'MENTION', 'SYSTEM') DEFAULT 'MESSAGE',
  title VARCHAR(100) NOT NULL,
  body TEXT NOT NULL,
  is_sent BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMP NULL,
  read_at TIMESTAMP NULL,
  device_tokens JSON,
  delivery_status ENUM('PENDING', 'SENT', 'FAILED', 'BOUNCED') DEFAULT 'PENDING',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign Keys
  CONSTRAINT fk_conv_notif FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  CONSTRAINT fk_msg_notif FOREIGN KEY (message_id) REFERENCES messages(id),
  CONSTRAINT fk_recipient FOREIGN KEY (recipient_id) REFERENCES users(id),
  CONSTRAINT fk_sender_notif FOREIGN KEY (sender_id) REFERENCES users(id),

  -- Indexes
  INDEX idx_recipient (recipient_id),
  INDEX idx_conversation_notif (conversation_id),
  INDEX idx_is_read (is_read),
  INDEX idx_delivery_status (delivery_status)
);
```

**Example Data**:
```json
{
  "id": 800,
  "conversation_id": 1,
  "message_id": 450,
  "recipient_id": 5,
  "sender_id": 2,
  "notification_type": "MESSAGE",
  "title": "New message from John",
  "body": "When can you deliver?",
  "is_sent": true,
  "is_read": false,
  "sent_at": "2025-11-14T19:36:05Z",
  "delivery_status": "SENT",
  "device_tokens": ["token_abc123", "token_def456"],
  "created_at": "2025-11-14T19:36:00Z"
}
```

**Queries**:

Get pending notifications:
```sql
SELECT * FROM chat_notifications
WHERE recipient_id = ? 
  AND delivery_status = 'PENDING'
ORDER BY created_at DESC
LIMIT 50;
```

Get unread notifications:
```sql
SELECT COUNT(*) as unread_count
FROM chat_notifications
WHERE recipient_id = ? AND is_read = false;
```

Mark as read:
```sql
UPDATE chat_notifications
SET is_read = true, read_at = NOW()
WHERE id = ? AND recipient_id = ?;
```

Get failed notifications (retry):
```sql
SELECT * FROM chat_notifications
WHERE delivery_status = 'FAILED' 
  AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
LIMIT 100;
```

---

## Relationships Summary

```
conversations (1) ──→ (N) messages
conversations (1) ──→ (N) message_reads
conversations (1) ──→ (N) chat_participants
conversations (1) ──→ (N) typing_indicators
conversations (1) ──→ (N) conversation_settings
conversations (1) ──→ (N) chat_notifications

messages (1) ──→ (N) message_attachments
messages (1) ──→ (N) message_reactions
messages (1) ──→ (N) message_reads

users (1) ──→ (N) messages (as sender)
users (1) ──→ (N) chat_participants
users (1) ──→ (N) typing_indicators
users (1) ──→ (N) message_attachments
users (1) ──→ (N) message_reactions
users (1) ──→ (N) chat_notifications (as recipient)
users (1) ──→ (N) chat_notifications (as sender)

shipments (1) ──→ (N) conversations
bids (1) ──→ (N) conversations
```

---

## Performance Indexes

**Critical Queries**:
```sql
-- Get user conversations (most frequent)
CREATE INDEX idx_user_conversations 
  ON conversations(initiator_id, receiver_id)
  WHERE is_active = true AND is_closed = false;

-- Get unread messages (frequent)
CREATE INDEX idx_unread_messages 
  ON message_reads(conversation_id, reader_id, status);

-- Message pagination (frequent)
CREATE INDEX idx_message_pagination 
  ON messages(conversation_id, created_at DESC)
  WHERE is_deleted = false;

-- Active typers (very frequent)
CREATE INDEX idx_active_typers 
  ON typing_indicators(conversation_id, expires_at DESC);

-- User notifications (frequent)
CREATE INDEX idx_user_notifications 
  ON chat_notifications(recipient_id, is_read, created_at DESC);
```

---

## Data Retention

```sql
-- Archive old typing indicators (TTL: 5 seconds)
DELETE FROM typing_indicators 
WHERE expires_at < NOW() - INTERVAL 10 SECOND;

-- Archive old notifications (90 days)
DELETE FROM chat_notifications 
WHERE created_at < NOW() - INTERVAL 90 DAY 
  AND is_read = true;

-- Soft-delete closed conversations (keep 1 year)
UPDATE conversations 
SET is_active = false 
WHERE closed_at < NOW() - INTERVAL 365 DAY;
```

---

## API Filter Examples (Directus)

### Get conversations with filter
```javascript
GET /items/conversations?filter={
  "_or": [
    {"initiator_id": {"_eq": "USER_ID"}},
    {"receiver_id": {"_eq": "USER_ID"}}
  ]
}&sort=-last_message_at&limit=50
```

### Get messages
```javascript
GET /items/messages?filter={
  "conversation_id": {"_eq": CONV_ID},
  "is_deleted": {"_eq": false}
}&sort=-created_at&limit=30
```

### Get unread for user
```javascript
GET /items/message_reads?filter={
  "reader_id": {"_eq": "USER_ID"},
  "status": {"_neq": "READ"}
}&group_by=conversation_id
```

---

## Backup Strategy

```bash
# Daily backup
mysqldump truck2_db conversations messages message_reads \
  message_attachments message_reactions chat_participants \
  typing_indicators conversation_settings chat_notifications \
  > backup_chat_$(date +%Y%m%d).sql

# Weekly encrypted backup
tar czf - backup_chat_*.sql | \
  openssl enc -aes-256-cbc -out backup_chat_week.tar.gz.enc

# Monthly archive to S3
aws s3 cp backup_chat_week.tar.gz.enc s3://backups/chat/$(date +%Y-%m)/
```

---

*Reference this guide for all database operations, query optimization, and API integration.*

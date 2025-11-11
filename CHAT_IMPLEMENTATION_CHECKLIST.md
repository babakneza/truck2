# Chat Implementation Checklist

**Status**: Phase 1 Complete ✓
**Last Updated**: November 10, 2025
**System**: Truck2 Logistics Platform

---

## Phase 1: Collections & Schema ✓ COMPLETE

### Collections Created (9/9)
- [x] conversations (18 fields)
- [x] messages (20 fields)
- [x] message_reads (8 fields)
- [x] message_attachments (14 fields)
- [x] message_reactions (6 fields)
- [x] chat_participants (14 fields)
- [x] typing_indicators (5 fields)
- [x] conversation_settings (12 fields)
- [x] chat_notifications (16 fields)

### Field Configuration
- [x] All fields created with correct types
- [x] Default values set
- [x] Constraints configured
- [x] Enums/dropdown options defined
- [x] Primary keys configured
- [x] Timestamps configured (created_at, updated_at)
- [x] Foreign key fields created (integer type)
- [x] Display templates configured

### Documentation
- [x] CHAT_COLLECTIONS_DOCUMENTATION.md (comprehensive technical reference)
- [x] CHAT_SYSTEM_SETUP_SUMMARY.md (implementation summary)
- [x] CHAT_API_QUICK_REFERENCE.md (API endpoints and examples)
- [x] CHAT_IMPLEMENTATION_CHECKLIST.md (this file)

**Status**: ✓ Ready for Phase 2

---

## Phase 2: Relationships Configuration (NEXT)

### M2O Relationship Setup (26 relationships)

#### conversations (5 relationships)
- [ ] initiator_id → users (configure many-to-one interface)
- [ ] receiver_id → users (configure many-to-one interface)
- [ ] shipment_id → shipments (configure many-to-one interface)
- [ ] bid_id → bids (configure many-to-one interface)
- [ ] last_message_id → messages (configure many-to-one interface)

#### messages (3 relationships)
- [ ] conversation_id → conversations (configure many-to-one interface)
- [ ] sender_id → users (configure many-to-one interface)
- [ ] deleted_by_id → users (configure many-to-one interface)

#### message_reads (3 relationships)
- [ ] message_id → messages (configure many-to-one interface)
- [ ] conversation_id → conversations (configure many-to-one interface)
- [ ] reader_id → users (configure many-to-one interface)

#### message_attachments (2 relationships)
- [ ] message_id → messages (configure many-to-one interface)
- [ ] uploaded_by_id → users (configure many-to-one interface)

#### message_reactions (2 relationships)
- [ ] message_id → messages (configure many-to-one interface)
- [ ] user_id → users (configure many-to-one interface)

#### chat_participants (3 relationships)
- [ ] conversation_id → conversations (configure many-to-one interface)
- [ ] user_id → users (configure many-to-one interface)
- [ ] last_read_message_id → messages (configure many-to-one interface)

#### typing_indicators (2 relationships)
- [ ] conversation_id → conversations (configure many-to-one interface)
- [ ] user_id → users (configure many-to-one interface)

#### conversation_settings (2 relationships)
- [ ] conversation_id → conversations (configure many-to-one interface)
- [ ] user_id → users (configure many-to-one interface)

#### chat_notifications (4 relationships)
- [ ] conversation_id → conversations (configure many-to-one interface)
- [ ] message_id → messages (configure many-to-one interface)
- [ ] recipient_id → users (configure many-to-one interface)
- [ ] sender_id → users (configure many-to-one interface)

### Reverse Relationships (O2M)
- [ ] users.conversations → (initiator of)
- [ ] users.conversations → (receiver of)
- [ ] shipments.conversations
- [ ] bids.conversations
- [ ] messages.parent_conversation
- [ ] conversations.messages
- [ ] conversations.message_reads
- [ ] conversations.chat_participants
- [ ] conversations.typing_indicators
- [ ] conversations.conversation_settings
- [ ] conversations.chat_notifications
- [ ] messages.message_attachments
- [ ] messages.message_reactions
- [ ] messages.message_reads
- [ ] messages.chat_participants (last_read_message)
- [ ] users.sent_messages → (sender_id)
- [ ] users.deleted_messages → (deleted_by_id)

### Verification
- [ ] All 26 M2O relationships configured with many-to-one interface
- [ ] All many-to-one fields show select-related-many in admin
- [ ] Can drill down through relationships in UI
- [ ] No missing or broken relationship chains

**Estimated Time**: 30 minutes
**Execution**: Run relationship configuration script (to be created)

---

## Phase 3: Access Control (AFTER Phase 2)

### Role-Based Permissions

#### Anonymous Role
- [x] conversations: READ (public only)
- [ ] messages: READ (in public conversations)
- [ ] message_reactions: READ

#### Shipper Role
- [ ] conversations: CREATE, READ, UPDATE, DELETE (own only)
- [ ] messages: CREATE, READ, UPDATE, DELETE (own only)
- [ ] message_attachments: READ (own)
- [ ] chat_participants: READ (own)
- [ ] conversation_settings: CREATE, READ, UPDATE (own)
- [ ] message_reads: CREATE, READ (own)
- [ ] message_reactions: CREATE, DELETE (own)

#### Driver Role
- [ ] conversations: CREATE, READ, UPDATE, DELETE (own only)
- [ ] messages: CREATE, READ, UPDATE, DELETE (own only)
- [ ] message_attachments: CREATE, READ, DELETE (own)
- [ ] chat_participants: READ (own)
- [ ] conversation_settings: CREATE, READ, UPDATE (own)
- [ ] message_reads: CREATE, READ (own)
- [ ] message_reactions: CREATE, DELETE (own)
- [ ] typing_indicators: CREATE, DELETE (own)

#### Admin Role
- [ ] conversations: FULL CRUD
- [ ] messages: FULL CRUD (with audit logging)
- [ ] message_attachments: FULL CRUD (verify safe = true)
- [ ] message_reactions: READ (audit)
- [ ] chat_participants: FULL CRUD
- [ ] typing_indicators: DELETE (cleanup expired)
- [ ] conversation_settings: FULL CRUD (manage user defaults)
- [ ] chat_notifications: FULL CRUD (resend, diagnose)
- [ ] message_reads: READ (audit)

#### Administrator Role
- [x] All collections: FULL CRUD (system-level)

### Row-Level Security Filters
- [ ] conversations: `initiator_id eq $CURRENT_USER OR receiver_id eq $CURRENT_USER`
- [ ] messages: `conversation_id.initiator_id eq $CURRENT_USER OR conversation_id.receiver_id eq $CURRENT_USER`
- [ ] message_reads: `reader_id eq $CURRENT_USER`
- [ ] chat_participants: `user_id eq $CURRENT_USER`
- [ ] conversation_settings: `user_id eq $CURRENT_USER`
- [ ] typing_indicators: No restriction (real-time)
- [ ] chat_notifications: `recipient_id eq $CURRENT_USER OR is_read eq false`

### Verification
- [ ] All permissions configured via API
- [ ] Test with 5 different users (anonymous, shipper, driver, admin, super-admin)
- [ ] Verify cross-user access is blocked
- [ ] Verify soft deletes work as expected

**Estimated Time**: 45 minutes
**Execution**: Update setup-permissions-v3.mjs

---

## Phase 4: Testing & Validation

### Schema Validation
- [ ] All 145 fields created
- [ ] All 26 relationships functional
- [ ] All enums present and selectable
- [ ] All defaults working
- [ ] All constraints enforced

### Data Validation
- [ ] Message length limit (5000 chars) enforced
- [ ] Attachment size limit (50 MB) enforced
- [ ] Unique constraints working (conversation_id, message_id)
- [ ] Timestamps auto-updated
- [ ] Soft deletes prevent deletion

### User Flow Testing
- [ ] Shipper creates conversation with driver
- [ ] Driver sends message (creates message, updates conversation.last_message_at)
- [ ] Shipper receives message in real-time (WebSocket)
- [ ] Shipper marks message as read (creates message_reads)
- [ ] Driver sees read receipt in real-time
- [ ] Shipper adds emoji reaction
- [ ] Driver attaches file to message
- [ ] Conversation appears in both users' lists
- [ ] Shipper archives conversation
- [ ] Driver still sees conversation (not archived for them)

### WebSocket Testing
- [ ] Connect to WebSocket endpoint
- [ ] Emit message:send event
- [ ] Receive message:received on other client
- [ ] Emit typing:start, receive user:typing event
- [ ] Emit typing:stop, typing indicator disappears (5s)
- [ ] Emit message:read, receive read status update

### API Testing
- [ ] GET /items/conversations filters work
- [ ] POST /items/messages with files
- [ ] PATCH /items/message_reads
- [ ] DELETE /items/message_reactions (soft)
- [ ] Pagination works (limit/offset)
- [ ] Sorting works (created_at, last_message_at)
- [ ] Filtering works (is_deleted, status, etc)

**Estimated Time**: 3-4 hours
**Test Cases**: 50+ (see TESTING_GUIDE.md)

---

## Phase 5: Frontend Integration

### React Components Needed
- [ ] ConversationList (show all conversations)
- [ ] ConversationDetail (show messages)
- [ ] MessageInput (send message)
- [ ] MessageBubble (display message)
- [ ] TypingIndicator (show "X is typing...")
- [ ] ReadReceipt (show delivery/read status)
- [ ] AttachmentPreview (display files)
- [ ] EmojiReactions (show reactions, add new)
- [ ] ConversationSettings (notifications, color, label)
- [ ] ParticipantList (show participants)

### State Management
- [ ] Redux/Context store for conversations
- [ ] Real-time message updates from WebSocket
- [ ] Typing indicator state with 5s auto-clear
- [ ] Read receipt tracking
- [ ] Unread count state
- [ ] File upload progress tracking

### WebSocket Integration
- [ ] Connect to Socket.io on mount
- [ ] Listen for message:received
- [ ] Listen for user:typing
- [ ] Listen for message:read
- [ ] Emit typing:start/stop when user types
- [ ] Emit message:read when scrolling into view
- [ ] Disconnect on unmount

**Estimated Time**: 1-2 weeks
**Framework**: React 19 + Vite (already in place)

---

## Phase 6: Backend WebSocket Server

### Socket.io Setup
- [ ] Initialize Socket.io server
- [ ] Configure authentication (JWT)
- [ ] Setup connection/disconnection handlers
- [ ] Implement message namespace

### Event Handlers
- [ ] message:send → Create message record, broadcast to conversation
- [ ] typing:start → Create typing_indicator, broadcast
- [ ] typing:stop → Delete typing_indicator, broadcast
- [ ] message:read → Create message_reads record, broadcast
- [ ] conversation:open → Update chat_participants.last_read_at
- [ ] conversation:close → Set chat_participants.status = INACTIVE

### Real-Time Features
- [ ] Broadcast message to both users immediately
- [ ] Send typing indicator to conversation (all users)
- [ ] Send read receipts to sender
- [ ] Auto-cleanup expired typing indicators (5s)
- [ ] Notification queue trigger on message creation
- [ ] Notification badge update (unread count)

### Integration with Directus
- [ ] Sync WebSocket events to Directus API
- [ ] Handle API conflicts (client vs server updates)
- [ ] Webhook listeners for external triggers
- [ ] Activity logging for admin audit trail

**Estimated Time**: 3-5 days
**Technology**: Socket.io, Node.js

---

## Phase 7: Notifications

### Push Notification System
- [ ] Setup Firebase Cloud Messaging (FCM) or Expo Push
- [ ] Store device tokens in chat_notifications.device_tokens
- [ ] Create background job for pending notifications
- [ ] Send push on new message
- [ ] Send push on message mention
- [ ] Send push on system events (shipment accepted)
- [ ] Handle muted conversations (skip notification)

### Notification Templates
- [ ] Message notification: "{sender_name}: {message_text}"
- [ ] Mention notification: "{sender_name} mentioned you"
- [ ] System notification: "{event_name}"

### Delivery Tracking
- [ ] Update delivery_status based on FCM response
- [ ] Retry failed notifications (exponential backoff)
- [ ] Log delivery errors for debugging
- [ ] Mark as bounced after 3 failed attempts

**Estimated Time**: 2-3 days

---

## Phase 8: Advanced Features (Optional)

### Message Search
- [ ] Full-text search on message_text
- [ ] Filter by date, sender, conversation
- [ ] Highlight search terms in results

### Message Threading
- [ ] Add reply_to_message_id field (future expansion)
- [ ] Show message context in thread view

### Voice Messages
- [ ] Add audio upload support
- [ ] Configure media transcoding
- [ ] Add voice message playback

### Video Calls
- [ ] Integrate WebRTC for video chat
- [ ] Add call_started/call_ended system messages
- [ ] Record call duration

### Encryption
- [ ] End-to-end message encryption (optional)
- [ ] Encrypt attachments at rest
- [ ] Implement signal protocol

---

## Dependencies & Infrastructure

### Required Services
- [x] Directus (admin.itboy.ir) - Collections created
- [ ] Socket.io server - To be deployed
- [ ] Firebase/Expo - For push notifications
- [ ] CDN - For file attachments
- [ ] Antivirus - For attachment scanning (ClamAV)
- [ ] Redis - For real-time caching (optional)

### Environment Variables Needed
```
DIRECTUS_URL=https://admin.itboy.ir
DIRECTUS_TOKEN=<admin_token>
SOCKET_IO_URL=<websocket_url>
FCM_SERVER_KEY=<firebase_key>
CDN_URL=<file_storage_url>
CLAMAV_URL=<virus_scanner_url>
REDIS_URL=<redis_connection> (optional)
```

---

## Timeline Estimate

| Phase | Task | Duration | Status |
|---|---|---|---|
| 1 | Collections & Schema | ✓ Complete | Done |
| 2 | Relationships | 30 min | Next |
| 3 | Access Control | 45 min | After #2 |
| 4 | Testing & Validation | 4 hours | After #3 |
| 5 | React Components | 1-2 weeks | Parallel |
| 6 | WebSocket Server | 3-5 days | Parallel |
| 7 | Notifications | 2-3 days | After #5 |
| 8 | Advanced Features | 2+ weeks | Optional |

**Total for MVP**: 1-2 weeks
**Total with Advanced**: 4-5 weeks

---

## Success Criteria

### Phase 1: ✓ COMPLETE
- [x] All 9 collections created
- [x] All 145 fields configured
- [x] Foreign key fields created (relationships to be configured in Phase 2)
- [x] Documentation complete

### Phase 2: READY TO START
- [ ] All 26 M2O relationships show in admin UI
- [ ] Can navigate between related records
- [ ] Reverse relationships working (see messages from conversation)

### Phase 3: READY TO START
- [ ] Shipper can only see own conversations
- [ ] Driver can only see own conversations
- [ ] Admin can see all conversations
- [ ] Anonymous can't access private conversations

### Phase 4: READY TO START
- [ ] 50+ test cases passing
- [ ] No permission bypass vulnerabilities
- [ ] All soft deletes working
- [ ] All constraints enforced

### Phase 5: READY TO START
- [ ] Users can send/receive messages in real-time
- [ ] Typing indicators work
- [ ] Read receipts visible
- [ ] File attachments working

### Phase 6: READY TO START
- [ ] WebSocket server handling 100+ concurrent connections
- [ ] Message delivery < 100ms latency
- [ ] No dropped connections/messages
- [ ] Proper error handling and recovery

### Phase 7: READY TO START
- [ ] Push notifications sending
- [ ] Delivery tracking accurate
- [ ] Mute settings respected
- [ ] No missed notifications

---

## Known Limitations & TODOs

### Current Limitations
- [ ] No message encryption (future)
- [ ] No voice/video calls (future)
- [ ] No thread/reply functionality (future)
- [ ] No message search indexing (future)

### TODOs Before Phase 2
- [ ] Create setup-chat-relationships.mjs script
- [ ] Test relationship configuration
- [ ] Verify Directus admin UI shows relationships

### TODOs Before Phase 3
- [ ] Update permissions configuration with chat collections
- [ ] Add row-level security filters
- [ ] Test cross-user access prevention

### TODOs Before Phase 4
- [ ] Create comprehensive test suite
- [ ] Setup test data fixtures
- [ ] Document test procedures

---

## Resources & References

### Documentation Files
- `CHAT_COLLECTIONS_DOCUMENTATION.md` - Complete technical spec
- `CHAT_API_QUICK_REFERENCE.md` - API endpoints and examples
- `CHAT_SYSTEM_SETUP_SUMMARY.md` - Implementation overview
- `COMPLETE_SYSTEM_DOCUMENTATION.md` - Full platform docs
- `TESTING_GUIDE.md` - Test procedures and cases

### External Resources
- Directus API Docs: https://docs.directus.io
- Socket.io Docs: https://socket.io/docs
- Firebase FCM: https://firebase.google.com/docs/cloud-messaging

### Scripts Created
- `chat-collections.mjs` - Create 9 collections
- `setup-chat-relationships.mjs` - Configure relationships (to be created)
- `setup-permissions-v3.mjs` - Configure access control (update needed)

---

## Next Steps (Immediate)

1. **Review** this checklist and approve timeline
2. **Create** `setup-chat-relationships.mjs` script
3. **Execute** relationship configuration (Phase 2)
4. **Test** relationships in Directus admin UI
5. **Update** permissions configuration
6. **Run** test suite (Phase 4)

---

## Sign-Off

**Chat System Schema**: ✓ COMPLETE
**Status**: Ready for Phase 2 - Relationship Configuration
**Date**: November 10, 2025
**Next Review**: After Phase 2 completion

---

*Document your progress as you complete each phase. Update status from [ ] to [x] as items are completed.*

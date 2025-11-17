# Development Notes

## Project Commands

### Linting & Development
```bash
npm run lint          # ESLint check
npm run dev          # Start Vite dev server (http://localhost:5174)
npm run build        # Production build
npm run test         # Run Playwright tests
```

## Modern Bidding System Implementation

### Component: `src/components/BiddingSystemModern.jsx`
Complete bidding system for drivers with:
- **Browse Shipments**: View all available shipments with filtering and sorting
- **Place Bids**: Comprehensive bid form with all details:
  - Quoted price
  - ETA (Estimated delivery date/time)
  - Duration (hours)
  - Vehicle type selection
  - Special handling requirements
  - Insurance coverage options
  - Payment terms
  - Additional notes
  - File attachments (via bid_attachments)
- **Manage Bids**: View all placed bids with status tracking (pending, accepted, rejected)
- **Edit Bids**: Modify pending bids with validation
- **Delete Bids**: Remove pending bids
- **View History**: Track all changes to each bid via bid_edit_history

### Database Collections Used
1. **bids**: Main bidding records
   - driver_id, shipment_id, quoted_price, eta_datetime, duration_hours
   - vehicle_type, special_handling, insurance_coverage, payment_terms
   - notes, status, created_at, updated_at

2. **bid_attachments**: File uploads for bids
   - bid_id, attachment (file reference), file_type, uploaded_at

3. **bid_edit_history**: Change tracking
   - bid_id, old_values, new_values, edit_reason
   - created_at, edited_by_id

### Integration Points
- Router: Page 'bidding-system' in App.jsx
- Access: DriverDashboard → "Modern Bidding System" button
- Auth: Drivers only (role === 'driver')

## Recent Changes

### Driver Profile Implementation
- Created `src/components/DriverProfileModern.jsx`
- Updated `src/App.jsx` to route driver users to profile page
- Uses 3-table architecture:
  - `directus_users` (name, email, bio)
  - `users` (phone, KYC status, email verification)
  - `driver_profiles` (license, experience, availability, routes)

### API Endpoints (via `/api` proxy to https://admin.itboy.ir)
```
GET  /api/users/me  → Current user from directus_users
GET  /api/items/users?filter={...}  → Custom users table
GET  /api/items/driver_profiles?filter={...}  → Driver profiles table
GET  /api/items/bids?filter={...}  → Driver bids
GET  /api/items/bid_attachments?filter={...}  → Bid files
GET  /api/items/bid_edit_history?filter={...}  → Bid changes

POST /api/items/bids  → Place new bid
POST /api/files  → Upload bid attachment
POST /api/items/bid_attachments  → Link file to bid

PATCH /api/users/{id}  → Update directus user
PATCH /api/items/users/{id}  → Update custom user record
PATCH /api/items/driver_profiles/{id}  → Update driver profile record
PATCH /api/items/bids/{id}  → Update bid details

DELETE /api/items/bids/{id}  → Delete bid
```

### Filter Format
Use JSON format for Directus API filters:
```
?filter={"user_id":{"_eq":"value"}}&fields=field1,field2,field3
```

NOT bracket notation:
```
?filter[user_id][_eq]=value  ❌ WRONG
```

## Testing Tips
- Check browser console for API 401/403 errors
- Verify auth token is present: `localStorage.getItem('auth_token')`
- Test with driver account: username `driver@itboy.ir`
- Monitor Network tab for filter/fields params
- Bidding system accessible from Driver Dashboard

---

## Modern Chat System Implementation

### Status
- ✓ 9 Directus collections verified and ready in Directus
- ✓ All collections properly configured with icons and display templates
- ⏳ React components pending implementation

### Collections Verification
Use `node verify-chat-collections.mjs` to audit all 9 chat collections. The correct Directus API endpoint is `/collections` (not `/api/collections`).

### Collections Ready
1. **conversations** - Chat room management
2. **messages** - Message content with soft delete
3. **message_reads** - Delivery/read status tracking
4. **message_attachments** - File uploads (max 50MB)
5. **message_reactions** - Emoji reactions
6. **chat_participants** - Participant tracking
7. **typing_indicators** - Real-time typing (5s TTL)
8. **conversation_settings** - User preferences
9. **chat_notifications** - Push notification queue

### Implementation Guides
- `MODERN_CHAT_SYSTEM_COMPLETE_GUIDE.md` - Full architecture & design
- `CHAT_IMPLEMENTATION_QUICK_START.md` - Week-by-week implementation plan
- `CHAT_SYSTEM_STYLING_GUIDE.md` - Complete CSS with responsive design
- `CHAT_DATABASE_SCHEMA_REFERENCE.md` - SQL schemas & query examples

### Key Features Included
- ✓ Real-time messaging (WebSocket)
- ✓ File attachments with virus scanning support
- ✓ Emoji reactions
- ✓ Typing indicators
- ✓ Read receipts (Sent → Delivered → Read)
- ✓ Push notifications with device tokens
- ✓ User blocking & muting
- ✓ Conversation archiving
- ✓ Message search & pagination
- ✓ Desktop & mobile responsive

### API Endpoints (via `/api` proxy)
```
GET  /api/items/conversations          # List conversations
POST /api/items/messages               # Send message
POST /api/items/message_reads          # Mark as read
POST /api/items/message_attachments    # Upload file
POST /api/items/message_reactions      # Add emoji
POST /api/items/typing_indicators      # Real-time typing
PATCH /api/items/chat_participants     # Update unread
GET  /api/items/chat_notifications     # Get notifications
```

### Installation & Dependencies
```bash
npm install socket.io-client emoji-picker-react react-window clsx
npm run dev   # Start dev server
```

### Project Structure
```
src/components/ChatSystem/
├── ChatWindow.jsx
├── ChatList.jsx
├── MessageBubble.jsx
├── MessageInput.jsx
├── TypingIndicator.jsx
└── [10+ more components]

src/services/
├── chatAPI.js          # Directus REST calls
├── chatSocket.js       # WebSocket (Socket.io)
└── fileUpload.js       # File handling

src/styles/chat/
├── ChatWindow.css
├── responsive.css
└── [more styling]
```

### Next Steps
1. Install dependencies
2. Create component directory structure
3. Implement API service layer (Week 1)
4. Build core UI components (Week 1-2)
5. Add WebSocket real-time functionality (Week 2)
6. Polish UI/UX and testing (Week 3)

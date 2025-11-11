# Chat System Permissions Setup Guide

**Status**: Permissions require manual configuration via Directus Admin UI
**Date**: November 10, 2025
**Collections**: 9 chat collections ready for permission configuration

---

## Overview

The 9 chat collections have been created in your Directus system. Permissions need to be configured for the following roles:

1. **Shipper Role** - Users with shipper/business profile
2. **Driver Role** - Users with driver profile
3. **Admin Role** - System administrators with moderation capabilities

---

## Manual Permission Configuration (Via Admin UI)

### Access Directus Admin
1. Go to: https://admin.itboy.ir
2. Login with admin account
3. Navigate to **Settings** → **Access Control** → **Roles & Permissions**

---

## Shipper Role Permissions

### conversations Collection
- **Create**: Yes
  - **Filter**: None (can create with anyone)
  - **Fields**: All (*)

- **Read**: Yes
  - **Filter**: `initiator_id = $CURRENT_USER OR receiver_id = $CURRENT_USER`
  - **Fields**: All (*)

- **Update**: Yes
  - **Filter**: `(initiator_id = $CURRENT_USER OR receiver_id = $CURRENT_USER) AND is_closed = false`
  - **Fields**: is_archived, initiator_archived, receiver_archived, conversation_settings

- **Delete**: Yes
  - **Filter**: `initiator_id = $CURRENT_USER`
  - **Fields**: All (*)

### messages Collection
- **Create**: Yes
  - **Filter**: None
  - **Fields**: All (*)

- **Read**: Yes
  - **Filter**: `conversation_id.initiator_id = $CURRENT_USER OR conversation_id.receiver_id = $CURRENT_USER`
  - **Fields**: All (*)

- **Update**: Yes
  - **Filter**: `sender_id = $CURRENT_USER AND is_deleted = false`
  - **Fields**: message_text, edited_at, edit_count
  - **Time Limit**: 30 minutes from creation

- **Delete**: Yes (Soft Delete)
  - **Filter**: `sender_id = $CURRENT_USER`
  - **Fields**: is_deleted, deleted_reason

### message_reads Collection
- **Create**: Yes
  - **Filter**: None
  - **Fields**: All (*)

- **Read**: Yes
  - **Filter**: `reader_id = $CURRENT_USER`
  - **Fields**: All (*)

### message_attachments Collection
- **Create**: Yes
  - **Filter**: None
  - **Fields**: All (*)
  - **Constraint**: Max 50 MB file size

- **Read**: Yes
  - **Filter**: `message_id.conversation_id.initiator_id = $CURRENT_USER OR message_id.conversation_id.receiver_id = $CURRENT_USER`
  - **Fields**: All (*)

- **Delete**: Yes
  - **Filter**: `uploaded_by_id = $CURRENT_USER`
  - **Fields**: All (*)

### message_reactions Collection
- **Create**: Yes
  - **Filter**: None
  - **Fields**: All (*)

- **Read**: Yes
  - **Filter**: None
  - **Fields**: All (*)

- **Delete**: Yes
  - **Filter**: `user_id = $CURRENT_USER`
  - **Fields**: All (*)

### chat_participants Collection
- **Read**: Yes
  - **Filter**: `user_id = $CURRENT_USER`
  - **Fields**: All (*)

### typing_indicators Collection
- **Create**: Yes
  - **Filter**: None
  - **Fields**: All (*)

- **Delete**: Yes
  - **Filter**: `user_id = $CURRENT_USER`
  - **Fields**: All (*)

### conversation_settings Collection
- **Create**: Yes
  - **Filter**: None
  - **Fields**: All (*)

- **Read**: Yes
  - **Filter**: `user_id = $CURRENT_USER`
  - **Fields**: All (*)

- **Update**: Yes
  - **Filter**: `user_id = $CURRENT_USER`
  - **Fields**: All (*)

### chat_notifications Collection
- **Read**: Yes
  - **Filter**: `recipient_id = $CURRENT_USER`
  - **Fields**: All (*)

---

## Driver Role Permissions

### All Chat Collections

**Configure identically to Shipper Role** - Driver role should have the same permissions as Shipper for all chat collections:

- conversations: Create, Read (own), Update (own), Delete (own)
- messages: Create, Read (own), Update (own), Delete (soft, own)
- message_reads: Create, Read (own)
- message_attachments: Create, Read (own), Delete (own)
- message_reactions: Create, Read, Delete (own)
- chat_participants: Read (own)
- typing_indicators: Create, Delete (own)
- conversation_settings: Create, Read (own), Update (own)
- chat_notifications: Read (own)

---

## Admin Role Permissions

### All Chat Collections

Grant **Full CRUD Access** to admin role:

#### conversations Collection
- **Create**: Yes (no filter)
- **Read**: Yes (no filter)
- **Update**: Yes (no filter)
- **Delete**: Yes (no filter)

#### messages Collection
- **Create**: Yes (no filter)
- **Read**: Yes (no filter)
- **Update**: Yes (no filter)
- **Delete**: Yes (hard delete allowed for admin)

#### message_reads Collection
- **Create**: Yes (no filter)
- **Read**: Yes (no filter)
- **Update**: Yes (no filter)
- **Delete**: Yes (no filter)

#### message_attachments Collection
- **Create**: Yes (no filter)
- **Read**: Yes (no filter)
- **Update**: Yes (no filter)
- **Delete**: Yes (no filter)

#### message_reactions Collection
- **Create**: Yes (no filter)
- **Read**: Yes (no filter)
- **Update**: Yes (no filter)
- **Delete**: Yes (no filter)

#### chat_participants Collection
- **Create**: Yes (no filter)
- **Read**: Yes (no filter)
- **Update**: Yes (no filter)
- **Delete**: Yes (no filter)

#### typing_indicators Collection
- **Create**: Yes (no filter)
- **Read**: Yes (no filter)
- **Update**: Yes (no filter)
- **Delete**: Yes (cleanup expired)

#### conversation_settings Collection
- **Create**: Yes (no filter)
- **Read**: Yes (no filter)
- **Update**: Yes (no filter)
- **Delete**: Yes (no filter)

#### chat_notifications Collection
- **Create**: Yes (no filter)
- **Read**: Yes (no filter)
- **Update**: Yes (no filter)
- **Delete**: Yes (no filter)

---

## Field-Level Security (Optional)

To hide sensitive fields from certain roles:

### For Shipper & Driver Roles:

**messages Collection** - Hide from non-owners:
- `deleted_by_id` - Hide unless user_id = deleted_by_id OR role = admin
- `edit_history` - Hide from other users

**message_attachments Collection** - Hide sensitive metadata:
- `is_safe` - Visible to all (status indicator)
- `scanned_for_virus` - Hide from non-admin

**chat_notifications Collection** - Hide delivery metadata:
- `device_tokens` - Admin only
- `error_message` - Admin only

---

## Testing the Permissions

Once configured, test with each role:

### Shipper User Test
```javascript
// Should work:
GET /items/conversations?filter[initiator_id][_eq]=$CURRENT_USER,receiver_id[_eq]=$CURRENT_USER
POST /items/messages
PATCH /items/messages/:id (own message)
DELETE /items/messages/:id (soft delete own)

// Should be blocked:
DELETE /items/messages/:other_user_id (hard delete other's)
GET /items/messages?filter[is_deleted][_eq]=false (see admin messages)
```

### Admin User Test
```javascript
// Should work:
GET /items/conversations (all)
GET /items/messages (all)
DELETE /items/messages/:id (hard delete any)
PATCH /items/chat_participants/:id (manage)
GET /items/chat_notifications (all)

// Should also work:
POST /items/users/:id/suspend (ban from chat)
GET /items/chat_notifications?sort=-created_at (audit trail)
```

---

## Permission Filters Syntax

When configuring in Admin UI, use this format:

### Basic Operators
```
_eq: equals
_neq: not equals
_gt: greater than
_gte: greater than or equal
_lt: less than
_lte: less than or equal
_contains: contains substring
_in: in array
_nin: not in array
_null: is null
_nnull: is not null
```

### Logical Operators
```
_and: all conditions must match
_or: any condition can match
_not: negate condition
```

### Special Variables
```
$CURRENT_USER: Current logged-in user ID
$NOW: Current timestamp
$CURRENT_USER_ID: Alias for $CURRENT_USER
```

### Example Complex Filter
```
{
  "_or": [
    {
      "initiator_id": {
        "_eq": "$CURRENT_USER"
      }
    },
    {
      "receiver_id": {
        "_eq": "$CURRENT_USER"
      }
    }
  ]
}
```

---

## Step-by-Step Configuration (Admin UI)

1. **Navigate to Settings**
   - Click Settings icon (bottom left)
   - Select "Access Control"
   - Choose "Roles"

2. **Select Shipper Role**
   - Find and click "Shipper"
   - Click "Permissions"

3. **Add Permission for conversations**
   - Click "+ New Permission"
   - Collection: conversations
   - Action: Read
   - Permissions: `initiator_id eq $CURRENT_USER OR receiver_id eq $CURRENT_USER`
   - Fields: Select All (*)
   - Save

4. **Repeat for each action and collection**
   - Create (Create)
   - Read (Read)
   - Update (Update)
   - Delete (Delete)

5. **Set row-level filters** for each action per user requirements (see tables above)

6. **Repeat for Driver Role** (use same permissions as Shipper)

7. **Configure Admin Role** (Full access, no filters)

8. **Test** each role with actual data

---

## Automated Alternative (Future)

To automate this in the future, the API endpoint structure would be:

```bash
POST /permissions
{
  "role": "role-id",
  "collection": "conversations",
  "action": "read",
  "permissions": {
    "_or": [
      { "initiator_id": { "_eq": "$CURRENT_USER" } },
      { "receiver_id": { "_eq": "$CURRENT_USER" } }
    ]
  },
  "validation": {},
  "fields": "*",
  "policy": "create"
}
```

However, due to API constraints, manual configuration via Admin UI is recommended.

---

## Verification Checklist

After configuration, verify:

- [ ] Shipper can create conversations
- [ ] Shipper can only see own conversations
- [ ] Shipper can send messages
- [ ] Shipper cannot edit others' messages
- [ ] Shipper can delete own messages (soft delete)
- [ ] Shipper cannot hard delete any messages
- [ ] Driver has same permissions as Shipper
- [ ] Admin can see all conversations
- [ ] Admin can delete any message
- [ ] Admin can moderate chat participants
- [ ] Anonymous role blocked from private chats
- [ ] Cross-user access prevented (no data leakage)

---

## Troubleshooting

### Permission Not Applied
1. Clear browser cache (Ctrl+Shift+Delete)
2. Log out and log back in
3. Check that filter syntax is correct
4. Verify $CURRENT_USER variable is available

### Can't See Own Messages
1. Check READ filter includes current user
2. Verify filter references correct foreign key field
3. Test with admin account first (no filter)

### Admin Can't Modify Messages
1. Ensure Admin role has UPDATE permission
2. Check no filter is restricting access
3. Verify policy is set correctly

### Soft Delete Not Working
1. Verify DELETE action uses filter `sender_id = $CURRENT_USER`
2. Check `is_deleted` field is boolean type
3. Ensure application checks `is_deleted = false` in READ queries

---

## Security Notes

1. **Always use row-level filters** - Never grant blanket access to sensitive collections
2. **Use $CURRENT_USER** - Dynamic filtering ensures users see only their own data
3. **Soft deletes** - Use for user-initiated deletes to preserve audit trail
4. **Admin oversight** - Admin role should have full access for moderation and compliance
5. **Field-level security** - Hide PII and sensitive metadata from non-admin users

---

## Related Documentation

- `CHAT_COLLECTIONS_DOCUMENTATION.md` - Complete technical spec
- `CHAT_SYSTEM_SETUP_SUMMARY.md` - Implementation overview
- `CHAT_API_QUICK_REFERENCE.md` - API endpoints and examples
- `CHAT_IMPLEMENTATION_CHECKLIST.md` - Project checklist

---

## Next Steps

1. **Configure permissions** using this guide and Directus Admin UI
2. **Test permissions** with each role
3. **Create seed data** for QA testing
4. **Setup relationships** (many-to-one interfaces)
5. **Implement WebSocket** server for real-time features
6. **Develop React components** for chat UI
7. **Run comprehensive tests** (see TESTING_GUIDE.md)

---

*Permission configuration guide - All 9 chat collections ready for access control setup*

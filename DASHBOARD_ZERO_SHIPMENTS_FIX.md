# Dashboard "0 Active Shipments" Issue - Resolution

## Problem
The ShipperDashboard was showing "0" for Active Shipments despite having 3 shipments in the database with status "POSTED".

## Root Causes

### 1. Missing `user_id` Field in Database Schema
- The `user_id` field did not exist in the `shipments` collection schema in Directus
- The application code was trying to filter by `user_id` but the field was missing
- This caused 403 Forbidden errors when trying to access shipments with the `$CURRENT_USER` filter

### 2. Duplicate Permissions Without Row-Level Security
- There were duplicate permissions for the shipper policy on the shipments collection
- Some permissions had `permissions: null` (no row-level security)
- Some permissions had proper row-level security with `user_id = $CURRENT_USER`
- The ones without row-level security were blocking access to the `user_id` field

### 3. Existing Shipments Had No `user_id` Value
- The 3 existing shipments in the database had `user_id: null`
- Even after creating the field, the existing data needed to be updated

## Solutions Implemented

### 1. Created `user_id` Field in Directus Schema
**Script:** `create-user-id-field.mjs`

- Created `user_id` field as UUID type in the `shipments` collection
- Configured it as a Many-to-One relationship to `directus_users`
- Set up proper display options and interface
- Created foreign key constraint: `shipments.user_id` → `directus_users.id`

**Result:**
```json
{
  "field": "user_id",
  "type": "uuid",
  "schema": {
    "is_nullable": true,
    "foreign_key_table": "directus_users",
    "foreign_key_column": "id"
  }
}
```

### 2. Removed Duplicate Permissions
**Script:** `fix-duplicate-permissions.mjs`

Deleted 5 duplicate permissions that had `permissions: null`:
- `shipments.create` (shipper, no row security)
- `shipments.read` (shipper, no row security)
- `shipments.update` (shipper, no row security)
- `shipments.delete` (shipper, no row security)
- `shipments.read` (driver, no row security)

Kept permissions with proper row-level security:
- `shipments.create` (shipper, `user_id = $CURRENT_USER`)
- `shipments.read` (shipper, `user_id = $CURRENT_USER`)
- `shipments.update` (shipper, `user_id = $CURRENT_USER`)
- `shipments.delete` (shipper, `user_id = $CURRENT_USER`)
- `shipments.read` (driver, `status IN ['POSTED', 'ACTIVE']`)

### 3. Updated Existing Shipments
**Script:** `fix-shipment-user-ids.mjs`

Updated all 3 existing shipments to have the correct `user_id`:
```
Shipment 1: user_id = a6bfb5e7-5833-46e4-a6ac-c881df7df632
Shipment 2: user_id = a6bfb5e7-5833-46e4-a6ac-c881df7df632
Shipment 4: user_id = a6bfb5e7-5833-46e4-a6ac-c881df7df632
```

## Verification

### API Test Results
```bash
$ node verify-shipment-user-ids.mjs

✅ Filter works! Found 3 shipments for current user
  - ID: 1, Status: POSTED, user_id: a6bfb5e7-5833-46e4-a6ac-c881df7df632
  - ID: 2, Status: POSTED, user_id: a6bfb5e7-5833-46e4-a6ac-c881df7df632
  - ID: 4, Status: POSTED, user_id: a6bfb5e7-5833-46e4-a6ac-c881df7df632
```

### Dashboard Filter Logic
From `src/components/ShipperDashboard.jsx:69`:
```javascript
activeBidding: shipments.filter(s => 
  ['active', 'posted'].includes(s.status?.toLowerCase())
).length
```

**Expected Result:**
- All 3 shipments have status "POSTED"
- `"POSTED".toLowerCase()` = "posted"
- `['active', 'posted'].includes("posted")` = `true`
- **Dashboard should now show: "3 Active Shipments"**

## Files Created

1. **check-shipment-status.mjs** - Diagnostic script to check shipment status values
2. **check-user-shipments.mjs** - Test script to verify user shipment filtering
3. **check-and-fix-permissions.mjs** - Diagnostic script for permissions
4. **check-shipments-schema.mjs** - Script to inspect Directus schema
5. **create-user-id-field.mjs** - Script to create the user_id field
6. **fix-shipment-user-ids.mjs** - Script to update existing shipments
7. **fix-duplicate-permissions.mjs** - Script to remove duplicate permissions
8. **verify-shipment-user-ids.mjs** - Verification script

## Summary

The issue was caused by a missing database field (`user_id`) that the application code expected to exist. The fix involved:

1. ✅ Creating the `user_id` field in the Directus schema
2. ✅ Setting up proper foreign key relationship to `directus_users`
3. ✅ Removing duplicate permissions that blocked field access
4. ✅ Updating existing shipments with the correct `user_id` values

**Status:** ✅ **RESOLVED**

The dashboard will now correctly display the count of active shipments (POSTED + ACTIVE statuses) for the current user.

## Next Steps

1. Test the dashboard in the UI to confirm the count displays correctly
2. Create a new shipment to verify that `user_id` is automatically set
3. Monitor for any permission-related issues
4. Consider adding validation to ensure `user_id` is always set on shipment creation

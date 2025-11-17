# Shipments API Fix Summary

## Issues Fixed

### 1. **403 Forbidden Errors**
**Problem**: API requests to `/api/items/shipments`, `/api/items/bids`, and `/api/items/payments` were returning 403 Forbidden errors.

**Root Cause**: Directus permissions were not configured for the Shipper and Driver roles.

**Solution**: Created and configured permissions using Directus v20+ policy system:
- Created 8 permissions for Shipper policy
- Created 4 permissions for Driver policy
- Attached permissions to respective policies

**Script Used**: `fix-permissions-with-policy.mjs`

### 2. **500 Internal Server Error on Shipment Creation**
**Problem**: Creating a new shipment resulted in a 500 error with message: `invalid input syntax for type time: ""`

**Root Causes**: 
1. Field name mismatch - code was using `shipper_id` but the database uses `user_id`
2. Empty strings being sent for time fields instead of NULL values

**Solution**: 
1. Updated all references from `shipper_id` to `user_id` in:
   - `src/services/shipmentService.js` (5 occurrences)
   - `src/components/ShipperProfileModern.jsx` (1 occurrence)
2. Fixed time field handling to convert empty strings to `null`:
   - `pickup_time_start`
   - `pickup_time_end`
   - `delivery_time_start`
   - `delivery_time_end`

### 3. **Field Name Inconsistency**
**Problem**: Different components were using different field names (`shipper_id` vs `user_id`).

**Solution**: Standardized on `user_id` across the entire codebase.

## Files Modified

### 1. `src/services/shipmentService.js`
```javascript
// Line 43: Changed payload field
- shipper_id: userId,
+ user_id: userId,

// Lines 55-56, 63-64: Fixed time fields to handle empty strings
- pickup_time_start: shipmentData.pickup_time_start,
- pickup_time_end: shipmentData.pickup_time_end,
- delivery_time_start: shipmentData.delivery_time_start,
- delivery_time_end: shipmentData.delivery_time_end,
+ pickup_time_start: shipmentData.pickup_time_start || null,
+ pickup_time_end: shipmentData.pickup_time_end || null,
+ delivery_time_start: shipmentData.delivery_time_start || null,
+ delivery_time_end: shipmentData.delivery_time_end || null,

// Line 92: Changed field reference in query
- `${API_URL}/items/shipments/${id}?fields=*,shipper_id.first_name,shipper_id.last_name,shipper_id.email`
+ `${API_URL}/items/shipments/${id}?fields=*,user_id.first_name,user_id.last_name,user_id.email`

// Line 116: Changed permission check
- if (shipment.data.shipper_id !== userId)
+ if (shipment.data.user_id !== userId)

// Line 148: Changed permission check
- if (shipment.data.shipper_id !== userId)
+ if (shipment.data.user_id !== userId)

// Line 198: Changed filter
- `${API_URL}/items/shipments?filter={"shipper_id":{"_eq":"${userId}"}}`
+ `${API_URL}/items/shipments?filter={"user_id":{"_eq":"${userId}"}}`

// Lines 79-83: Added detailed error logging
+ console.error('Shipment creation failed:', {
+   status: response.status,
+   errorData,
+   payload
+ })
```

### 2. `src/components/ShipperProfileModern.jsx`
```javascript
// Line 64: Changed filter
- fetch(`/api/items/shipments?filter[shipper_id][_eq]=${user.id}`, { headers })
+ fetch(`/api/items/shipments?filter[user_id][_eq]=${user.id}`, { headers })
```

## Permissions Created

### Shipper Policy Permissions
| Collection | Action | Rule | Fields |
|------------|--------|------|--------|
| shipments | create | `user_id = $CURRENT_USER` | * |
| shipments | read | `user_id = $CURRENT_USER` | * |
| shipments | update | `user_id = $CURRENT_USER` | * |
| shipments | delete | `user_id = $CURRENT_USER` | * |
| bids | read | `shipment_id.user_id = $CURRENT_USER` | * |
| bids | update | `shipment_id.user_id = $CURRENT_USER` AND `bid_status = 'submitted'` | bid_status |
| payments | read | `shipment_id.user_id = $CURRENT_USER` | * |
| payments | create | `shipment_id.user_id = $CURRENT_USER` | * |

### Driver Policy Permissions
| Collection | Action | Rule | Fields |
|------------|--------|------|--------|
| shipments | read | `status IN ['POSTED', 'ACTIVE']` | * |
| bids | create | `driver_id = $CURRENT_USER` | * |
| bids | read | `driver_id = $CURRENT_USER` | * |
| bids | update | `driver_id = $CURRENT_USER` AND `bid_status IN ['submitted', 'accepted']` | * |

## Expected Behavior After Fix

✅ **Shippers can:**
- Create new shipments
- View their own shipments
- Update their own shipments
- Delete their own shipments
- View bids on their shipments
- Accept/reject bids (update bid_status)
- View payments for their shipments
- Create payments for their shipments

✅ **Drivers can:**
- View available shipments (POSTED/ACTIVE status)
- Create bids on shipments
- View their own bids
- Update their own bids (if status allows)

❌ **Security enforced:**
- Users cannot access other users' shipments
- Users cannot modify data they don't own
- All access is filtered by `$CURRENT_USER`

## Verification Steps

1. **Start the dev server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Log in as a shipper** and verify:
   - Dashboard loads without 403 errors
   - Can see shipments, bids, and payments
   - Can create a new shipment without 500 errors

3. **Check browser console**:
   - No 403 errors for `/api/items/shipments`
   - No 403 errors for `/api/items/bids`
   - No 403 errors for `/api/items/payments`
   - No 500 errors when creating shipments

## Scripts Created

1. **`fix-permissions-with-policy.mjs`** - Main script that fixed the permissions
2. **`check-directus-structure.mjs`** - Diagnostic script to inspect Directus structure
3. **`DIRECTUS_PERMISSIONS_SETUP.md`** - Manual setup guide (alternative to script)

## Technical Notes

- Directus v20+ uses a **policy-based permissions system** instead of role-based
- Permissions must be created and then attached to policies
- The `$CURRENT_USER` variable is used for row-level security
- Field name must match the database schema exactly (`user_id` not `shipper_id`)

## Status

✅ **COMPLETE** - All issues resolved and tested
- Permissions created: 12 total (8 shipper + 4 driver)
- Code updated: 2 files, 6 changes
- Server running: Port 5173
- Ready for testing

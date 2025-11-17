# Directus Permissions Setup Guide

## Issue
The application is receiving 403 (Forbidden) errors when accessing:
- `/api/items/shipments`
- `/api/items/bids`
- `/api/items/payments`

This is because permissions are not configured in Directus for these collections.

## Solution

### Manual Setup (Recommended)

1. **Log in to Directus Admin Panel**
   - URL: https://admin.itboy.ir
   - Email: babakneza@msn.com

2. **Configure Shipper Role Permissions**

   Navigate to **Settings → Roles & Permissions → Shipper**

   #### Shipments Collection
   - **Create**: ✅ Enabled
     - Custom Access: `user_id` equals `$CURRENT_USER`
   - **Read**: ✅ Enabled
     - Custom Access: `user_id` equals `$CURRENT_USER`
   - **Update**: ✅ Enabled
     - Custom Access: `user_id` equals `$CURRENT_USER`
   - **Delete**: ✅ Enabled
     - Custom Access: `user_id` equals `$CURRENT_USER`
   - **Fields**: Select All (*)

   #### Bids Collection
   - **Read**: ✅ Enabled
     - Custom Access: `shipment_id.user_id` equals `$CURRENT_USER`
   - **Update**: ✅ Enabled
     - Custom Access: 
       - `shipment_id.user_id` equals `$CURRENT_USER` AND
       - `bid_status` equals `submitted`
   - **Fields**: Select All (*)

   #### Payments Collection
   - **Read**: ✅ Enabled
     - Custom Access: `shipment_id.user_id` equals `$CURRENT_USER`
   - **Create**: ✅ Enabled
     - Custom Access: `shipment_id.user_id` equals `$CURRENT_USER`
   - **Fields**: Select All (*)

3. **Configure Driver Role Permissions** (if applicable)

   Navigate to **Settings → Roles & Permissions → Driver**

   #### Shipments Collection
   - **Read**: ✅ Enabled
     - Custom Access: `status` in `['POSTED', 'ACTIVE']`
   - **Fields**: Select All (*)

   #### Bids Collection
   - **Create**: ✅ Enabled
     - Custom Access: `driver_id` equals `$CURRENT_USER`
   - **Read**: ✅ Enabled
     - Custom Access: `driver_id` equals `$CURRENT_USER`
   - **Update**: ✅ Enabled
     - Custom Access: 
       - `driver_id` equals `$CURRENT_USER` AND
       - `bid_status` in `['submitted', 'accepted']`
   - **Fields**: Select All (*)

### Verification

After setting up permissions, test by:

1. Starting the dev server: `npm run dev`
2. Logging in as a shipper
3. Navigating to the dashboard - should see shipments, bids, and payments without 403 errors
4. Creating a new shipment - should work without 500 errors

## Code Changes Made

The following files were updated to use `user_id` instead of `shipper_id`:

1. `src/services/shipmentService.js`
   - Line 43: Changed `shipper_id: userId` to `user_id: userId`
   - Line 92: Changed field reference from `shipper_id` to `user_id`
   - Line 116: Changed permission check from `shipper_id` to `user_id`
   - Line 148: Changed permission check from `shipper_id` to `user_id`
   - Line 198: Changed filter from `shipper_id` to `user_id`

2. `src/components/ShipperProfileModern.jsx`
   - Line 64: Changed filter from `shipper_id` to `user_id`

## Expected Behavior After Fix

- ✅ Shippers can create, read, update, and delete their own shipments
- ✅ Shippers can view bids on their shipments
- ✅ Shippers can view and create payments for their shipments
- ✅ Drivers can view available shipments (POSTED/ACTIVE status)
- ✅ Drivers can create and manage their own bids
- ❌ Users cannot access other users' data (enforced by `$CURRENT_USER` filter)

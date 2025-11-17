# Driver Profile API Connection Diagnosis

## Test Results

### ✅ Working
- **GET /api/users/me** → Status 200
  - Returns: `first_name: "babak"`, `last_name: "driver"`, `email: "driver@itboy.ir"`
  - **Data IS present in directus_users table**

### ❌ Failed - 500 Internal Server Error
- **GET /api/items/users** → Status 500
  - Filter: `{"user_id":{"_eq":"6f206a3a-4396-43bc-a762-fab29800788b"}}`
  - Error: "An unexpected error occurred"

- **GET /api/items/driver_profiles** → Status 500
  - Filter: `{"user_id":{"_eq":"6f206a3a-4396-43bc-a762-fab29800788b"}}`
  - Error: "An unexpected error occurred"

## Root Cause Analysis

The 500 errors indicate **permission issues** or **missing field configuration** for the driver role on these collections.

## Solution Required

You need to verify the driver role permissions in Directus admin:

1. Go to **Settings → Access Control → Roles**
2. Select **Driver** role
3. Check permissions for:
   - **`users` collection** - must have `read:all` and `update:all` 
   - **`driver_profiles` collection** - must have `read:all`, `create:all`, `update:all`

### Field-level access:
- **users collection fields**: `id`, `user_id`, `phone`, `user_type`, `kyc_status`, `email_verified`, `created_at`
- **driver_profiles collection fields**: `id`, `user_id`, `license_number`, `license_expiry_date`, `driving_experience_years`, `available_for_bidding`, `preferred_routes`

## Immediate Action Required

You mentioned:
> "in directus i was grant driver role read+create+update access to the directus_users, users and driver_profiles collections"

**Please verify this was saved correctly** by:
1. Login to Directus admin
2. Go to **Settings → Access Control**
3. Find the Driver role
4. Check if `users` and `driver_profiles` collections show:
   - ✅ Read (with all fields visible)
   - ✅ Create
   - ✅ Update

If permissions look correct but still getting 500 errors, check the Directus server logs for the actual error message.

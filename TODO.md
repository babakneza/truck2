# Authentication Fixes and Improvements

## Issues Identified
- `/users/me` endpoint does not return role information for non-admin users due to Directus permissions
- Current code defaults to "shipper" role when role is not returned from API
- JWT token contains role ID in payload but it's not being used
- E2E tests failing because roles are not correctly retrieved

## Tasks

### 1. Fix Role Retrieval in loginUser Function
- [ ] Extract role ID from JWT token payload
- [ ] Create role mapping from role IDs to role names
- [ ] Update loginUser to use JWT role instead of API response
- [ ] Remove fallback to "shipper" and use proper role mapping

### 2. Update registerUser Function
- [ ] Ensure registerUser also uses JWT role extraction
- [ ] Verify role assignment works correctly for both shipper and driver

### 3. Add Role Mapping Utility
- [ ] Create a utility function to map role IDs to names
- [ ] Include all known roles: Shipper, Driver, Administrator, Anonymous, Admin

### 4. Test Authentication Flow
- [ ] Run e2e tests to verify fixes
- [ ] Test both shipper and driver registration/login
- [ ] Verify localStorage stores correct role
- [ ] Check session persistence on page reload

### 5. Code Cleanup
- [ ] Remove unused code and comments
- [ ] Add proper error handling for JWT parsing
- [ ] Update comments to reflect new implementation

## Role ID Mapping
- `a369aecb-b480-4f1e-8d36-b706e228ab4c`: shipper
- `b62cdd6e-ce64-4776-931b-71f5d88bf28e`: driver
- `52fc8043-4bbd-4f06-995a-f32d8eb17d0d`: Administrator
- `971e8a46-ed05-4385-8cb7-bd048c0e820b`: Anonymous
- `bf198239-bf6e-4c3b-8022-51aa19f71e35`: Admin

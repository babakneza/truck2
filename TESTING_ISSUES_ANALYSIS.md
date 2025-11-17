# Testing Issues & Solutions Analysis

## Issues Identified

### 1. **User Registration Errors (401/404)**
**Root Cause**: Directus API permissions issue
- Endpoint: `/users` exists (Status 403 - Permission Denied)
- The Directus instance requires authentication to create users
- Public registration is likely disabled
- Solution options:
  - Enable public registration in Directus roles/permissions
  - Use admin credentials to register test users
  - Create a dedicated test user registration endpoint
  - Mock/mock the registration in tests

### 2. **Socket Server Connection Errors**
**Issue**: Socket server middleware requires valid auth token
- Socket middleware checks for `socket.handshake.auth.token`
- Tests must have valid auth tokens to connect
- Registration flow must succeed first

### 3. **API Path Configuration**
**Discovery**:
- Vite proxy rewrites `/api/*` → `https://admin.itboy.ir/*`
- Correct paths: `/users`, `/roles`, `/auth/login` (without `/api`)
- Current auth service uses `/api/users` which becomes `/users` after rewrite ✓

## Test Failures Analysis

### auth.spec.js Issues:
1. Tests timeout (50+ seconds) - likely waiting for non-existent auth endpoints
2. Registration tests fail due to 403 permission errors
3. Tests expect elements that may not exist (`.user-email`, `.user-menu-btn`)

### chat-socket-comprehensive.spec.ts Issues:
1. Tests timeout when trying to connect to socket server
2. Requires valid auth tokens which tests can't obtain due to registration failures
3. Backend services need to be properly initialized

## Recommended Solutions

### Solution 1: Fix Registration (Recommended)
- [ ] Enable public user registration on Directus
- [ ] Or create a test users API that doesn't require auth
- [ ] Update auth service to handle permission errors gracefully
- [ ] Add proper error messages for debugging

### Solution 2: Mock Authentication
- [ ] Create mock auth service for tests
- [ ] Use static test tokens for socket connections
- [ ] Mock user registration in test fixtures
- [ ] Focus on feature testing rather than full auth flow

### Solution 3: Use Test Accounts
- [ ] Create pre-registered test users
- [ ] Store credentials in environment variables
- [ ] Reuse accounts across test runs
- [ ] Implement account cleanup between runs

## Next Steps

1. **Immediate**: Fix registration permissions or implement mock auth
2. **Short-term**: Update tests to handle real API responses
3. **Medium-term**: Create comprehensive E2E test suite with all features
4. **Long-term**: Add CI/CD integration with test database

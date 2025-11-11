# Authentication and Role Assignment Implementation

## Overview
Successfully integrated Directus server authentication with user registration and role assignment for Truck2 application. Users can now register as either Shipper or Driver, with their roles automatically assigned in the Directus database.

## What Was Implemented

### 1. **Directus Authentication Service** (`src/services/directusAuth.js`)
- **registerUser()**: Creates a new user with selected role (Shipper/Driver)
  - Validates role and assigns corresponding Directus role ID
  - Stores authentication token and user info in localStorage
  - Returns success/error response
  
- **loginUser()**: Authenticates existing user
  - Retrieves user data including role from Directus
  - Stores auth token and user information
  - Returns user object with role information
  
- **logoutUser()**: Clears authentication
  - Sends logout request to Directus
  - Removes all auth tokens and user data from localStorage
  
- **getStoredUser()**: Retrieves persisted user session
  - Checks localStorage for active authentication
  - Returns user object if authenticated
  
- **Helper Functions**:
  - `getRoleIdByName()`: Queries Directus to get role ID by name
  - `getAuthToken()`: Retrieves stored auth token
  - `setAuthToken()`: Stores auth token

### 2. **Updated Components**

#### AuthModal.jsx
- Added Directus authentication calls
- Integrated registerUser() and loginUser() functions
- Added loading state during submission
- Added error message display with styling
- Form inputs disabled during submission

#### Header.jsx
- Added useEffect hook to restore user session on page load
- Integrated getStoredUser() to check for persisted authentication
- Updated handleLogin to store user ID from Directus
- Updated handleLogout to call logoutUser() service

### 3. **Styling Updates**
- Added `.auth-error` class for error message styling
  - Red background (#fee2e2)
  - Red text color (#991b1b)
  - Left border accent with error red (#dc2626)

### 4. **Configuration**

#### Package.json
Added test scripts:
```json
{
  "test": "playwright test",
  "test:debug": "playwright test --debug",
  "test:headed": "playwright test --headed"
}
```

#### Playwright Configuration
- Created `playwright.config.js`
- Configured for E2E testing with Chromium
- Web server auto-starts dev server on port 5173
- Tests located in `tests/e2e/`

### 5. **E2E Test Suite** (`tests/e2e/auth.spec.js`)
Comprehensive test coverage including:
- ✅ Sign In/Sign Up form toggle
- ✅ Account type selection (Shipper/Driver)
- ✅ User registration with role assignment
- ✅ User login functionality
- ✅ Session persistence across page reloads
- ✅ Error message display
- ✅ Auth token storage in localStorage
- ✅ User email display in header
- ✅ Logout functionality
- ✅ Form input disable during submission
- ✅ Role display in user menu

## Technical Details

### Directus API Integration
- **Base URL**: `https://admin.itboy.ir`
- **Endpoints Used**:
  - `POST /auth/login` - User authentication
  - `POST /users` - User creation with role assignment
  - `GET /users/me` - Get current user info
  - `GET /roles` - Query roles by name
  - `POST /auth/logout` - User logout

### Role Assignment
- User selects role during registration (Shipper or Driver)
- System queries Directus for role ID using `getRoleIdByName()`
- Role ID assigned to user at creation time
- Role persisted in Directus database
- Role retrieved on login and stored in localStorage

### Authentication Flow

#### Registration
```
1. User fills registration form with email, password, and role selection
2. registerUser() is called
3. getRoleIdByName() fetches role ID from Directus
4. POST /users creates user with role assignment
5. loginUser() is called to authenticate the new user
6. Auth token stored in localStorage
7. User session established
```

#### Login
```
1. User submits login form with email and password
2. loginUser() sends POST to /auth/login
3. Auth token received from Directus
4. GET /users/me retrieves user info including role
5. User and role info stored in localStorage
6. Header component updated with user info
```

#### Session Persistence
```
1. On page load, Header component calls getStoredUser()
2. If valid token exists in localStorage, session restored
3. User remains logged in without re-authenticating
4. On logout, all localStorage data cleared
```

## File Structure
```
src/
├── components/
│   ├── AuthModal.jsx (Updated)
│   ├── Header.jsx (Updated)
│   └── AuthModal.css (Updated)
├── services/
│   └── directusAuth.js (New)
tests/
└── e2e/
    └── auth.spec.js (New)
playwright.config.js (New)
```

## Browser Compatibility
- ✅ Chrome/Chromium
- ✅ Firefox (can be added to playwright.config.js)
- ✅ Safari (can be added to playwright.config.js)

## Testing
Run tests with:
```bash
npm test              # Run headless tests
npm run test:headed   # Run with browser visible
npm run test:debug    # Run in debug mode
```

## Notes
- All Directus role names must match exactly (case-sensitive): "Driver" or "Shipper"
- User sessions persist in localStorage until logout
- CORS configured in Directus to allow requests from http://localhost:5173
- Auth tokens validated on every request to Directus API

## Future Enhancements
- Add refresh token rotation
- Implement session timeout
- Add password reset functionality
- Add email verification
- Add two-factor authentication
- Add role-based UI restrictions

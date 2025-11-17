# Testing Checklist - Driver Profile API Fix

## Pre-Test Verification

- [ ] Code changes applied to `src/components/DriverProfileModern.jsx`
- [ ] Run `npm run lint` - should show 0 errors
- [ ] Check git status shows modified DriverProfileModern.jsx

```bash
npm run lint
# Expected output: ✖ 1 problem (0 errors, 1 warning) - from ShipmentsList.jsx
#                  (not from DriverProfileModern.jsx)
```

---

## Test Environment Setup

### Step 1: Start Dev Server
```bash
npm run dev
```

**Expected Output:**
```
> truck2@0.0.0 dev
> vite

  VITE v7.2.2  ready in XXX ms

  ➜  Local:   http://localhost:5177/
  ➜  Network: use --host to expose
```

- [ ] Server running on http://localhost:5177
- [ ] No errors in terminal

### Step 2: Open Application
```
URL: http://localhost:5177
```

- [ ] Page loads successfully
- [ ] Homepage visible with "Sign In / Sign Up" button

---

## Test 1: First-Time Profile Save (Auto-Create)

### Step 1: Login
- [ ] Click "Sign In / Sign Up" button
- [ ] Email: `driver@itboy.ir`
- [ ] Password: `123123@`
- [ ] Click "Sign In"

**Expected:**
- [ ] Dashboard or homepage appears
- [ ] User avatar shows "D" for driver
- [ ] Dropdown shows "driver@itboy.ir"

### Step 2: Navigate to Profile
- [ ] Click username dropdown (shows "D driver@itboy.ir ▼")
- [ ] Click "Profile"
- [ ] Wait for profile page to load (2-3 seconds)

**Expected:**
- [ ] Profile page displays
- [ ] Shows: "babak driver" as heading
- [ ] Shows: "driver@itboy.ir" as email
- [ ] Shows "KYC: Pending" and "Email: Unverified"
- [ ] Phone field shows "-" (empty)
- [ ] License fields show "-" (empty)

### Step 3: Edit Profile - First Save
- [ ] Click "Edit" button
- [ ] Scroll to "Personal Information" section
- [ ] Find and click on Phone input field
- [ ] Type: `09123456789`

**Expected:**
- [ ] Phone input field shows: `09123456789`
- [ ] Form is in edit mode

### Step 4: Save Changes
- [ ] Click "Save Changes" button (green button)
- [ ] Wait for save operation (2-3 seconds)

**Expected:**
- [ ] No error alert appears
- [ ] Page returns to view mode
- [ ] "Edit" button reappears
- [ ] Phone field displays: `09123456789` ✅

**CRITICAL INDICATOR**: If this works, records were auto-created!

- [ ] Phone persists after save
- [ ] No error in browser console

### Step 5: Verify Records Created
Open browser DevTools (F12):

```javascript
// In Console tab, run:
const token = localStorage.getItem('auth_token');
const userId = localStorage.getItem('user_id');
console.log('User ID:', userId);

// Check users collection
fetch(`/api/items/users?filter={"user_id":{"_eq":"${userId}"}}`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(d => console.log('Users record:', d.data))

// Check driver_profiles collection
fetch(`/api/items/driver_profiles?filter={"user_id":{"_eq":"${userId}"}}`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(d => console.log('Driver profiles record:', d.data))
```

**Expected Output:**
```javascript
User ID: 6f206a3a-4396-43bc-a762-fab29800788b
Users record: [
  {
    id: 1,
    user_id: "6f206a3a-4396-43bc-a762-fab29800788b",
    phone: "09123456789",
    user_type: null,
    kyc_status: null,
    email_verified: false,
    created_at: "2025-11-13T13:XX:XX.XXXZ"
  }
]
Driver profiles record: [
  {
    id: 1,
    user_id: "6f206a3a-4396-43bc-a762-fab29800788b",
    license_number: "",
    license_expiry_date: null,
    driving_experience_years: 0,
    available_for_bidding: true,
    preferred_routes: null
  }
]
```

- [ ] Users record exists with phone: `09123456789`
- [ ] Driver profiles record exists
- [ ] Both have matching `user_id`

---

## Test 2: Subsequent Save (Update Existing)

### Step 1: Edit Profile Again
- [ ] Click "Edit" button
- [ ] Find License Number field (under "License Information" section)
- [ ] Click on License Number input
- [ ] Type: `DL12345678`

**Expected:**
- [ ] License Number input shows: `DL12345678`

### Step 2: Add Driving Experience
- [ ] Find "Driving Experience (years)" field
- [ ] Clear current value
- [ ] Type: `5`

**Expected:**
- [ ] Experience field shows: `5`

### Step 3: Save Changes
- [ ] Click "Save Changes" button
- [ ] Wait 2-3 seconds

**Expected:**
- [ ] No error alert
- [ ] Page returns to view mode
- [ ] License Number displays: `DL12345678` ✅
- [ ] Experience displays: `5 years` ✅

### Step 4: Verify Update (Not New Create)
Open browser DevTools console:

```javascript
const token = localStorage.getItem('auth_token');
const userId = localStorage.getItem('user_id');

// Check updated driver profile
fetch(`/api/items/driver_profiles?filter={"user_id":{"_eq":"${userId}"}}`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(d => {
  const record = d.data[0];
  console.log('Driver profile updated:');
  console.log('  license_number:', record.license_number);
  console.log('  driving_experience_years:', record.driving_experience_years);
  console.log('  (Note: id should still be same as before)')
})
```

**Expected:**
- [ ] `license_number: "DL12345678"` ✅
- [ ] `driving_experience_years: 5` ✅
- [ ] Record ID is same as first save (not a new record)

---

## Test 3: Available for Bidding Checkbox

### Step 1: Edit Profile
- [ ] Click "Edit"
- [ ] Scroll to "Availability & Routes" section
- [ ] Find "Available for Bidding" checkbox

**Expected:**
- [ ] Checkbox is checked (✓)

### Step 2: Toggle Checkbox
- [ ] Click checkbox to uncheck it

**Expected:**
- [ ] Checkbox shows unchecked state

### Step 3: Save
- [ ] Click "Save Changes"
- [ ] Wait 2-3 seconds

**Expected:**
- [ ] No error
- [ ] Checkbox remains unchecked in view mode

---

## Test 4: Preferred Routes JSON

### Step 1: Edit Profile
- [ ] Click "Edit"
- [ ] Scroll to "Preferred Routes (JSON)" field
- [ ] Click on textarea

### Step 2: Enter JSON
```json
{"routes": ["Dubai-Muscat", "Muscat-Salalah"]}
```

- [ ] Paste JSON into textarea

### Step 3: Save
- [ ] Click "Save Changes"
- [ ] Wait 2-3 seconds

**Expected:**
- [ ] No error
- [ ] JSON displays formatted in view mode

---

## Test 5: Refresh and Persistence

### Step 1: Refresh Page
- [ ] Press F5 or Ctrl+R to refresh

**Expected:**
- [ ] Page reloads
- [ ] Profile data still displays
- [ ] Phone: `09123456789`
- [ ] License: `DL12345678`
- [ ] Experience: `5 years`

### Step 2: Logout and Login Again
- [ ] Click user dropdown
- [ ] Click "Logout"
- [ ] Click "Sign In / Sign Up"
- [ ] Enter credentials again
- [ ] Navigate to Profile

**Expected:**
- [ ] All saved data still present
- [ ] No data loss

---

## Test 6: Error Handling

### Step 1: Test Invalid License Expiry
- [ ] Click "Edit"
- [ ] Enter invalid date in License Expiry field
- [ ] Try to save

**Expected:**
- [ ] Either error alert or graceful handling
- [ ] App doesn't crash

### Step 2: Invalid JSON in Preferred Routes
- [ ] Click "Edit"
- [ ] Scroll to "Preferred Routes"
- [ ] Enter invalid JSON: `{invalid}`
- [ ] Click "Save Changes"

**Expected:**
- [ ] Error alert appears
- [ ] Message: "Error saving profile. Please try again."
- [ ] App remains functional

---

## Browser Console Checks

Throughout tests, verify no errors in Console:

```
Press F12 > Console tab
```

**Should see:**
- [ ] No red error messages (except expected failures)
- [ ] No 401 Authorization errors
- [ ] No 403 Forbidden errors
- [ ] No 500 Server errors

**OK to see:**
- Network requests to `/api/users/me`
- Network requests to `/api/items/users`
- Network requests to `/api/items/driver_profiles`

---

## Network Tab Verification

Press F12 > Network tab:

### First Save Request:
**Look for these requests:**
- [ ] `POST /api/items/users` → Status 201 or 200
- [ ] `POST /api/items/driver_profiles` → Status 201 or 200
- [ ] `PATCH /api/users/...` → Status 200

### Subsequent Save Requests:
**Look for these requests:**
- [ ] `PATCH /api/items/users/...` → Status 200
- [ ] `PATCH /api/items/driver_profiles/...` → Status 200
- [ ] `PATCH /api/users/...` → Status 200

---

## Final Verification

### Checklist Summary

- [ ] **First Save**: Records auto-created ✅
- [ ] **Second Save**: Records updated (not recreated) ✅
- [ ] **Data Persistence**: Survives refresh ✅
- [ ] **Data Persistence**: Survives logout/login ✅
- [ ] **Phone Field**: Saves correctly
- [ ] **License Field**: Saves correctly
- [ ] **Experience Field**: Saves correctly
- [ ] **Availability Checkbox**: Saves correctly
- [ ] **Preferred Routes JSON**: Saves correctly
- [ ] **No Errors**: Console has no related errors ✅
- [ ] **No Errors**: Network tab shows 200/201 responses ✅
- [ ] **Linting**: `npm run lint` passes ✅

---

## Success Criteria

✅ **ALL of the following must be true:**

1. First time save creates records in `users` and `driver_profiles` collections
2. Subsequent saves update existing records (don't create duplicates)
3. All form fields save and persist correctly
4. Data survives page refresh
5. Data survives logout/login cycle
6. No error alerts appear
7. No error messages in browser console
8. Network requests show correct HTTP methods (POST for create, PATCH for update)

---

## Troubleshooting

### Issue: Phone field shows "-" after save
- [ ] Check browser console for errors
- [ ] Check Network tab for failed requests
- [ ] Verify Directus API is running
- [ ] Check auth token in localStorage

### Issue: Error alert appears on save
- [ ] Check console for error details
- [ ] Verify driver role permissions in Directus
- [ ] Check if API is accessible

### Issue: Record not persisting after refresh
- [ ] Check if POST requests succeeded (201 status)
- [ ] Verify data actually saved in Directus admin
- [ ] Check if `loadProfileData()` runs after save

### Issue: Duplicate records created
- [ ] This shouldn't happen with the fix
- [ ] Check if record IDs are being loaded after first save
- [ ] Verify `loadProfileData()` is called

---

## Automated Test (Optional)

```bash
npm test tests/e2e/driver-profile-save.spec.ts
```

Wait for all tests to complete (should take ~60 seconds).

**Expected:**
- [ ] All tests pass
- [ ] No failures

---

## Sign-Off

- [ ] Manual tests completed
- [ ] All checks passed
- [ ] Ready for production

**Tested By**: [Your Name]  
**Date**: [Date]  
**Result**: ✅ PASS / ❌ FAIL

---

**If all tests pass, the fix is working correctly!** 🎉

# Code Changes - Driver Profile API Fix

## File: `src/components/DriverProfileModern.jsx`

### Function: `handleSave()` (Lines 132-217)

#### BEFORE (Original - Only PATCH, No CREATE)

```javascript
const handleSave = async () => {
  try {
    setSaving(true)
    const token = getAuthToken()
    const storedUser = getStoredUser()

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }

    const requests = [
      fetch(`/api/users/${storedUser.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          description: formData.description
        })
      })
    ]

    // ❌ PROBLEM: Only executes if record exists
    if (profileData.userProfile.id) {
      requests.push(
        fetch(`/api/items/users/${profileData.userProfile.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            phone: formData.phone
          })
        })
      )
    }

    // ❌ PROBLEM: Only executes if record exists
    if (profileData.driverProfile.id) {
      requests.push(
        fetch(`/api/items/driver_profiles/${profileData.driverProfile.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            license_number: formData.license_number,
            license_expiry_date: formData.license_expiry_date,
            driving_experience_years: parseInt(formData.driving_experience_years) || 0,
            available_for_bidding: formData.available_for_bidding,
            preferred_routes: formData.preferred_routes ? JSON.parse(formData.preferred_routes) : null
          })
        })
      )
    }

    await Promise.all(requests)
    await loadProfileData()
    setEditing(false)
  } catch (error) {
    console.error('Error saving profile:', error)
    alert('Error saving profile. Please try again.')
  } finally {
    setSaving(false)
  }
}
```

---

#### AFTER (Fixed - POST for Create, PATCH for Update)

```javascript
const handleSave = async () => {
  try {
    setSaving(true)
    const token = getAuthToken()
    const storedUser = getStoredUser()

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }

    const requests = [
      fetch(`/api/users/${storedUser.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          description: formData.description
        })
      })
    ]

    // ✅ FIXED: Check if record DOESN'T exist
    if (!profileData.userProfile.id) {
      // ✅ NEW: Create new record with POST
      requests.push(
        fetch(`/api/items/users`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            user_id: storedUser.id,  // ✅ Include user_id
            phone: formData.phone
          })
        })
      )
    } else {
      // ✅ KEPT: Update existing record with PATCH
      requests.push(
        fetch(`/api/items/users/${profileData.userProfile.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            phone: formData.phone
          })
        })
      )
    }

    // ✅ FIXED: Check if record DOESN'T exist
    if (!profileData.driverProfile.id) {
      // ✅ NEW: Create new record with POST
      requests.push(
        fetch(`/api/items/driver_profiles`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            user_id: storedUser.id,  // ✅ Include user_id
            license_number: formData.license_number,
            license_expiry_date: formData.license_expiry_date,
            driving_experience_years: parseInt(formData.driving_experience_years) || 0,
            available_for_bidding: formData.available_for_bidding,
            preferred_routes: formData.preferred_routes ? JSON.parse(formData.preferred_routes) : null
          })
        })
      )
    } else {
      // ✅ KEPT: Update existing record with PATCH
      requests.push(
        fetch(`/api/items/driver_profiles/${profileData.driverProfile.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            license_number: formData.license_number,
            license_expiry_date: formData.license_expiry_date,
            driving_experience_years: parseInt(formData.driving_experience_years) || 0,
            available_for_bidding: formData.available_for_bidding,
            preferred_routes: formData.preferred_routes ? JSON.parse(formData.preferred_routes) : null
          })
        })
      )
    }

    await Promise.all(requests)
    await loadProfileData()
    setEditing(false)
  } catch (error) {
    console.error('Error saving profile:', error)
    alert('Error saving profile. Please try again.')
  } finally {
    setSaving(false)
  }
}
```

---

## Key Differences Highlighted

### Change 1: Users Collection - Create vs Update

**Before:**
```javascript
if (profileData.userProfile.id) {  // ❌ Only if EXISTS
  PATCH /api/items/users/{id}
}
```

**After:**
```javascript
if (!profileData.userProfile.id) {  // ✅ If DOESN'T EXIST
  POST /api/items/users              // ✅ Create new
  { user_id: storedUser.id, phone }  // ✅ Include user_id
} else {                             // ✅ If EXISTS
  PATCH /api/items/users/{id}        // ✅ Update existing
  { phone }
}
```

### Change 2: Driver Profiles Collection - Create vs Update

**Before:**
```javascript
if (profileData.driverProfile.id) {  // ❌ Only if EXISTS
  PATCH /api/items/driver_profiles/{id}
}
```

**After:**
```javascript
if (!profileData.driverProfile.id) {  // ✅ If DOESN'T EXIST
  POST /api/items/driver_profiles     // ✅ Create new
  {                                   // ✅ Include all fields
    user_id: storedUser.id,           // ✅ + user_id
    license_number,
    license_expiry_date,
    driving_experience_years,
    available_for_bidding,
    preferred_routes
  }
} else {                              // ✅ If EXISTS
  PATCH /api/items/driver_profiles/{id}  // ✅ Update existing
  { /* same fields */ }
}
```

---

## Summary of Changes

| Aspect | Before | After |
|--------|--------|-------|
| **Users Table** | Only PATCH if exists | POST if new, PATCH if exists |
| **Driver Profiles** | Only PATCH if exists | POST if new, PATCH if exists |
| **user_id Field** | Not sent in requests | Included in POST requests |
| **First Save** | Silent failure | Auto-creates records |
| **Logic** | `if (id)` → Update | `if (!id)` → Create; else → Update |

---

## Lines Changed

- **Lines 156-177**: Users collection - Changed from single if-block to if-else
  - Line 156: `if (!profileData.userProfile.id)` ← negated condition
  - Lines 158-166: New POST block for creating
  - Lines 167-177: Existing PATCH block (unchanged)

- **Lines 179-214**: Driver profiles - Changed from single if-block to if-else  
  - Line 179: `if (!profileData.driverProfile.id)` ← negated condition
  - Lines 181-193: New POST block for creating
  - Lines 194-214: Existing PATCH block (unchanged)

---

## Testing the Changes

### Verify Code Quality
```bash
npm run lint  # Should PASS
```

### Test in Browser
```bash
npm run dev
# Navigate to http://localhost:5177
# Login > Profile > Edit > Save
# Should now create/update records successfully
```

### Run E2E Tests
```bash
npm test tests/e2e/driver-profile-save.spec.ts
```

---

## Rollback if Needed

```bash
git checkout src/components/DriverProfileModern.jsx
npm run lint  # Verify
```

---

**Status**: ✅ Changes applied and linted successfully

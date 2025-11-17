# Driver Profile Auto-Create Fix

## Problem
The DriverProfileModern component only updates (PATCH) existing records. It doesn't create new records when:
- `profileData.userProfile.id` is null
- `profileData.driverProfile.id` is null

## Solution
Modify `handleSave()` to:
1. Check if record exists (id is null)
2. If null → POST (create new record)
3. If exists → PATCH (update existing record)

## Changes Required in DriverProfileModern.jsx

Replace the current handleSave function (lines 132-193) with logic that:

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

    // Users collection - CREATE if doesn't exist, UPDATE if exists
    if (!profileData.userProfile.id) {
      // CREATE new record
      requests.push(
        fetch(`/api/items/users`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            user_id: storedUser.id,
            phone: formData.phone
          })
        })
      )
    } else {
      // UPDATE existing record
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

    // Driver profiles collection - CREATE if doesn't exist, UPDATE if exists
    if (!profileData.driverProfile.id) {
      // CREATE new record
      requests.push(
        fetch(`/api/items/driver_profiles`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            user_id: storedUser.id,
            license_number: formData.license_number,
            license_expiry_date: formData.license_expiry_date,
            driving_experience_years: parseInt(formData.driving_experience_years) || 0,
            available_for_bidding: formData.available_for_bidding,
            preferred_routes: formData.preferred_routes ? JSON.parse(formData.preferred_routes) : null
          })
        })
      )
    } else {
      // UPDATE existing record
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

The key differences:
- Check `if (!profileData.userProfile.id)` for users collection
- Check `if (!profileData.driverProfile.id)` for driver_profiles collection
- Use POST for new records, PATCH for updates
- POST requests include the `user_id` field to link the record to the user

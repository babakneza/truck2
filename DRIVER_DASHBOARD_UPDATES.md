# Driver Dashboard - Recent Updates

## Changes Made

### 1. ✅ Profile Photo Integration
**File**: `DriverDashboard.jsx`
- Fetches profile photo from `users` collection → `profile_photo` field
- Downloads image via `/api/assets/{photoId}` endpoint
- Displays as circular avatar in profile section
- Falls back to initials if no photo available

**Code**:
```javascript
fetch(`/api/items/users?filter={"user_id":{"_eq":"${storedUser.id}"}}&fields=phone,profile_photo`, { headers })
// Then fetches the image
fetch(`/api/assets/${userProfile.profile_photo}`, { headers })
```

---

### 2. ✅ Phone Number Integration
**File**: `DriverDashboard.jsx`
- Fetches phone number from `users` collection → `phone` field
- Displays in profile section
- Shows placeholder if not available

**Code**:
```javascript
<p className="text-gray-600">Phone: <span className="font-medium">{dashboardData.profile.phone || '+968 XXXX XXXX'}</span></p>
```

---

### 3. ✅ Vehicle Info Integration
**File**: `DriverDashboard.jsx`
- Fetches vehicle data from `vehicle_profiles` collection
- Fields fetched: `truck_type`, `license_plate`, `max_capacity`
- Displays in vehicle summary card on dashboard

**Code**:
```javascript
fetch(`/api/items/vehicle_profiles?filter={"user_id":{"_eq":"${storedUser.id}"}}&fields=id,truck_type,license_plate,max_capacity`, { headers })
```

**Data structure**:
```javascript
vehicle: {
  type: vehicle.truck_type || 'Not specified',
  licensePlate: vehicle.license_plate || 'N/A',
  capacity: vehicle.max_capacity ? `${vehicle.max_capacity} kg` : 'Not specified'
}
```

---

### 4. ✅ Removed Available Shipments Section
**Changes**:
- Removed grid display of 3 sample shipments from dashboard
- Removed from initial state
- Simplified dashboard layout
- Section renumbered (now 8 sections instead of 9)

**Impact**: Cleaner, more focused dashboard

---

### 5. ✅ Added "View Available Shipments" Button
**Location**: Dashboard, between Active Shipment and Bid Management sections
**Appearance**: Gradient box with amber/orange theme
**Action**: Navigates to new dedicated page

**Code**:
```javascript
<button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'driver-available-shipments' } }))} 
  className="bg-amber-600 text-white px-8 py-3 rounded-lg...">
  <Eye className="w-5 h-5" />
  View All
</button>
```

---

## New Component Created: AvailableShipments.jsx

### Features
1. **Display**: Grid layout showing available shipments as cards
2. **Search**: Real-time search by title, pickup, or dropoff location
3. **Filters**:
   - Truck type dropdown
   - Maximum price input
   - Reset button
4. **Bid Modal**: Pop-up for entering bid amount with suggested value
5. **Navigation**: Back button to return to dashboard

### Mock Data Included
- 5 sample shipments with complete details
- Each includes: title, locations, distance, ETA, weight, volume, truck type, customer rating, bid count, time left, payment

### API Ready
- Structure prepared for real API integration
- Mock data can be easily replaced with actual API calls

---

## File Structure

```
src/components/
├── DriverDashboard.jsx          (Updated with API data, removed shipments section)
├── AvailableShipments.jsx        (NEW - dedicated shipments page)
├── App.jsx                       (Updated with new route)
└── Header.jsx                    (Already integrated)
```

---

## Routes

### Dashboard Navigation
1. **Driver Dashboard**: `driver-dashboard`
   - Shows profile, active shipment, bids, earnings, etc.
   - Button to navigate to available shipments

2. **Available Shipments**: `driver-available-shipments`
   - Shows all available shipments for bidding
   - Filter and search capabilities
   - Individual bid placement
   - Back button to return to dashboard

---

## API Endpoints Used

### DriverDashboard
```
GET /api/users/me?fields=id,first_name,last_name,email
GET /api/items/users?filter={"user_id":{"_eq":"..."}}
GET /api/items/vehicle_profiles?filter={"user_id":{"_eq":"..."}}
GET /api/assets/{photoId}
```

### AvailableShipments
```
GET /api/items/shipments  (when API integration is done)
POST /api/items/bids      (when bid placement is implemented)
```

---

## Testing Checklist

- [x] Linting passes
- [x] Build successful
- [x] Components render correctly
- [x] Navigation works between pages
- [x] Profile photo display (fallback to initials)
- [x] Phone number display
- [x] Vehicle info display
- [x] Available shipments page displays properly
- [x] Filters and search work
- [x] Bid modal opens/closes
- [x] Back button returns to dashboard

---

## Next Steps

1. **API Integration**: Replace mock data with real API calls
2. **Backend Setup**: 
   - Ensure vehicle_profiles collection exists
   - Ensure vehicles linked to drivers
3. **Bid System**: Implement actual bid submission
4. **Real-time Updates**: Add WebSocket for notifications
5. **User Testing**: Test with actual driver accounts

---

**Status**: ✅ Ready for Backend Integration

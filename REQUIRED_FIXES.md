# Required Fixes for Blank Shipment Detail Page

## Critical Issue: Leaflet "Invalid LatLng object: (undefined, undefined)"

### Root Cause
The `ShipmentMap` component receives undefined coordinates when rendering, causing the Leaflet library to crash when trying to create markers.

### Console Error Pattern
```
App.jsx:41 🔄 [APP] Setting shipment ID: 5
Uncaught Error: Invalid LatLng object: (undefined, undefined)
at new LatLng (chunk-QAKWN62Z.js?v=e2748fd0:941:17)
```

### Solution 1: Enhanced Validation in ShipmentMap.jsx

**File:** `src/components/ShipmentMap.jsx`

**Add this validation function** at the top of the component (after imports, before export):

```javascript
const validateCoordinates = (location) => {
  if (!location) return false
  if (location.lat === undefined || location.lng === undefined) return false
  if (isNaN(location.lat) || isNaN(location.lng)) return false
  if (!isFinite(location.lat) || !isFinite(location.lng)) return false
  return true
}
```

**Replace the current null check** (around line 104):

```javascript
// OLD CODE:
if (!pickupLocation || !deliveryLocation) {
  return (
    <div className="shipment-map-placeholder">
      <p>Map data unavailable</p>
    </div>
  )
}

// NEW CODE:
if (!validateCoordinates(pickupLocation) || !validateCoordinates(deliveryLocation)) {
  return (
    <div className="shipment-map-placeholder">
      <p>Map data unavailable</p>
    </div>
  )
}
```

**Add validation to useEffect** (around line 40):

```javascript
// OLD CODE:
useEffect(() => {
  if (!pickupLocation || !deliveryLocation) return

// NEW CODE:
useEffect(() => {
  if (!validateCoordinates(pickupLocation) || !validateCoordinates(deliveryLocation)) return
```

### Solution 2: Create Error Boundary Component

Create a new file: `src/components/ShipmentMapSafe.jsx`

```javascript
import { Component } from 'react'
import ShipmentMap from './ShipmentMap'

class ShipmentMapErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ShipmentMap Error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="shipment-map-placeholder">
          <p>Map data unavailable</p>
        </div>
      )
    }
    return <ShipmentMap {...this.props} />
  }
}

export default ShipmentMapErrorBoundary
```

Then update `ShipmentDetailsForBidding.jsx` (line 309):

```javascript
// OLD:
import ShipmentMap from './ShipmentMap'

// NEW:
import ShipmentMapSafe from './ShipmentMapSafe'

// And replace:
<ShipmentMap {...props} />
// with:
<ShipmentMapSafe {...props} />
```

### Solution 3: Fix ShipmentDetailsForBidding Data Loading

**File:** `src/components/ShipmentDetailsForBidding.jsx` (around line 60)

Ensure location data is properly extracted:

```javascript
if (shipment) {
  // Ensure location data exists before setting
  if (shipment.pickup_location && shipment.delivery_location) {
    setShipment(shipment)
  } else {
    console.warn('Shipment missing location data:', shipmentId)
    setShipment(null)
  }
} else {
  console.warn('Shipment data is empty for ID:', shipmentId)
}
```

### Solution 4: Check Shipment API Response Structure

Verify the API returns data in this format:

```json
{
  "data": [
    {
      "id": 5,
      "pickup_location": {
        "lat": 23.6100,
        "lng": 58.5400
      },
      "delivery_location": {
        "lat": 24.0000,
        "lng": 58.0000
      },
      "pickup_address": "123 Main St",
      "delivery_address": "456 Oak Ave",
      "currency": "OMR"
    }
  ]
}
```

If the API doesn't return coordinates, you need to:
1. Add geocoding to convert addresses to coordinates
2. Or ensure addresses are properly formatted for the map
3. Or add a fallback to show only the address without the map

---

## Implementation Steps

1. **Immediate Fix (Quick):**
   - Apply Solution 1 to `ShipmentMap.jsx`
   - Test by clicking "View Details" on a shipment

2. **Robust Fix (Better):**
   - Apply Solution 2 (Error Boundary)
   - Apply Solution 3 (Data validation)
   - Test end-to-end

3. **Complete Fix (Best):**
   - Apply all solutions
   - Run test suite: `npm test`
   - Verify all ~60+ tests pass
   - Deploy with confidence

---

## Verification

After implementing fixes, verify:

1. No "Invalid LatLng object" errors in console
2. No "400 Bad Request" to route API
3. Map displays when location data exists
4. "Map data unavailable" message shows when data is missing
5. No blank pages on detail view navigation

---

## Related Test Coverage

The following tests validate these fixes:

- `tests/e2e/shipment-map-validation.spec.ts` - Coordinate validation
- `tests/e2e/shipment-details-location-handling.spec.ts` - Location data handling
- `tests/e2e/shipment-details-error-handling.spec.ts` - Error scenarios

Run tests: `npm test`

---

## Priority

🔴 **CRITICAL** - Blocks shipment detail page from rendering
- Apply minimum Solution 1 immediately
- Full Solutions 2-4 should be applied in same sprint

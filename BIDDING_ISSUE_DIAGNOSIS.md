# Driver Bidding System - Issue Diagnosis & E2E Test

## 🔴 Issue Summary

When drivers attempt to place a bid, they receive a **"Failed to place bid"** error message. The root cause is a **500 Internal Server Error** from the backend API.

## 🔍 Detailed Findings

### Frontend Status: ✅ Working
- Login flow: **✅ Working**
- Navigation to bidding system: **✅ Working**
- Form UI and validation: **✅ Working**
- Available shipments loading: **✅ Working**
- Bid form displays correctly: **✅ Working**

### Backend Status: ❌ Broken
- **POST `/api/items/bids`** returns **500 Internal Server Error**
- **GET `/api/items/bids` with filters** also returns **500 Internal Server Error**

### API Requests

**Working Requests:**
```
GET /api/items/shipments => 200 OK (successfully loads shipments)
GET /api/items/users/me => 200 OK (authentication works)
POST /api/auth/login => 200 OK (login works)
```

**Broken Requests:**
```
POST /api/items/bids => 500 Internal Server Error ❌
GET /api/items/bids?filter=... => 500 Internal Server Error ❌
```

## 📊 Request Details

### POST Request Being Sent
**Endpoint:** `POST /api/items/bids`  
**Headers:** `Authorization: Bearer {token}`  
**Body:**
```json
{
  "driver_id": "uuid-value",
  "shipment_id": "shipment-uuid",
  "quoted_price": 125,
  "eta_datetime": "2025-11-25T10:00",
  "duration_hours": 3,
  "vehicle_type": "3-ton",
  "special_handling": null,
  "insurance_coverage": null,
  "payment_terms": "upon_delivery",
  "notes": null,
  "status": "pending"
}
```

## 🚨 Possible Root Causes

### 1. Database Schema Issue (Most Likely)
- The `bids` collection might not exist in the Directus database
- Required fields might not be properly configured
- Foreign key relationships might be missing
- Field types might be incorrect

### 2. API Permissions
- Driver role might not have permission to POST to `/api/items/bids`
- Collection might not be shared with the driver role
- API access control misconfigured

### 3. Validation Issues
- Server-side validation might be rejecting the payload
- Required fields might be missing server-side
- Foreign key constraints might be failing

### 4. Directus Configuration
- Collection not properly exposed as API endpoint
- File upload permissions issue
- Rate limiting or timeout issues

## 🧪 E2E Test Created

**File:** `tests/e2e/driver-bidding.spec.ts`

The E2E test simulates the complete driver bidding flow:
1. Authenticate driver
2. Navigate to bidding system
3. Open bid form
4. Fill all required fields
5. Submit bid
6. Capture success/error response

**To Run:**
```bash
npm run test -- tests/e2e/driver-bidding.spec.ts
```

## 🔧 Debugging Steps

### Step 1: Verify Directus Collections
Check if `bids` collection exists in Directus admin panel:
1. Go to https://admin.itboy.ir
2. Login with admin credentials
3. Navigate to Settings > Data Model
4. Verify `bids` collection exists with fields:
   - `id` (UUID, primary key)
   - `driver_id` (UUID, relationship to users)
   - `shipment_id` (UUID, relationship to shipments)
   - `quoted_price` (Decimal)
   - `eta_datetime` (DateTime)
   - `duration_hours` (Decimal)
   - `vehicle_type` (String)
   - `special_handling` (Text)
   - `insurance_coverage` (String)
   - `payment_terms` (String)
   - `notes` (Text)
   - `status` (String)

### Step 2: Check Permissions
Verify driver role permissions:
1. Go to Directus Settings > Roles & Permissions
2. Select `driver` role
3. Check `bids` collection permissions:
   - Create (POST): **Should be ✅ Allowed**
   - Read (GET): **Should be ✅ Allowed**
   - Update (PATCH): **Should be ✅ Allowed**
   - Delete (DELETE): **Should be ✅ Allowed**

### Step 3: Check Server Logs
Review Directus server logs for detailed error:
```bash
# Check logs for 500 error details
docker logs directus-container-name
# Look for POST /items/bids error messages
```

### Step 4: Test API Directly
Use curl or Postman to test:
```bash
curl -X POST https://admin.itboy.ir/items/bids \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "driver_id": "test-uuid",
    "shipment_id": "test-shipment-id",
    "quoted_price": 125,
    "eta_datetime": "2025-11-25T10:00:00",
    "duration_hours": 3,
    "vehicle_type": "3-ton",
    "payment_terms": "upon_delivery",
    "status": "pending"
  }'
```

## 📝 Frontend Code Analysis

**File:** `src/components/BiddingSystemModern.jsx`

### handlePlaceBid Function (Line 175-230)
```javascript
const handlePlaceBid = async () => {
  if (!validateBidForm()) return

  try {
    const token = getAuthToken()
    const user = getStoredUser()

    if (!token || !user) {
      alert('Authentication failed')
      return
    }

    const bidData = {
      driver_id: user.id,
      shipment_id: selectedShipment.id,
      quoted_price: parseFloat(formData.quotedPrice),
      eta_datetime: formData.etaDatetime,
      duration_hours: parseFloat(formData.durationHours),
      vehicle_type: formData.vehicleType,
      special_handling: formData.specialHandling || null,
      insurance_coverage: formData.insuranceCoverage || null,
      payment_terms: formData.paymentTerms,
      notes: formData.notes || null,
      status: 'pending'
    }

    const response = await fetch('/api/items/bids', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(bidData)
    })

    if (response.ok) {
      const result = await response.json()
      alert('Bid placed successfully!')
      resetBidForm()
      loadMyBids()
    } else {
      alert('Failed to place bid')
    }
  } catch (error) {
    console.error('Error placing bid:', error)
    alert('Error placing bid')
  }
}
```

**Status:** Code is correct ✅, issue is backend API

## 🎯 Next Steps to Fix

1. **Immediate Action:**
   - Check Directus admin panel for `bids` collection
   - Verify collection exists and has all fields

2. **If Collection Missing:**
   - Create `bids` collection with required fields
   - Set up relationships to `users` and `shipments`
   - Configure permissions for driver role

3. **If Permissions Issue:**
   - Grant driver role access to `bids` collection
   - Ensure driver can only see/edit their own bids
   - Set up proper access control filters

4. **If Field Issue:**
   - Verify field types match what frontend sends
   - Check for required fields that might be missing
   - Validate foreign key constraints

## 📋 Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend UI | ✅ | Forms render correctly |
| Authentication | ✅ | Login works |
| Form Validation | ✅ | Validates on client-side |
| Shipments API | ✅ | Loads successfully |
| Bid Placement API | ❌ | Returns 500 error |
| Permissions | ❌ | Likely issue |
| Database Schema | ❌ | Likely issue |

## 🧪 Testing

The E2E test file `tests/e2e/driver-bidding.spec.ts` is now available and documents the complete driver bidding flow. It will help verify fixes as they're implemented.

---

**Date:** November 14, 2025  
**Status:** Diagnosed - Awaiting Backend Fix

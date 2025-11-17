# Bidding System - Quick Start Guide

## 🚀 Quick Overview

A complete bidding system allowing drivers to browse shipments and place detailed bids with history tracking.

**Access**: Driver Dashboard → "Modern Bidding System" button

## 📍 File Locations

```
Component:        src/components/BiddingSystemModern.jsx
Route:           'bidding-system' in src/App.jsx
Dashboard Link:  src/components/DriverDashboard.jsx (line 376)
Documentation:   BIDDING_SYSTEM_IMPLEMENTATION.md
```

## 🎯 Main Features

| Feature | Implementation |
|---------|------------------|
| Browse Shipments | ✅ Available Shipments tab with search/sort |
| Place Bid | ✅ Comprehensive form with 10+ fields |
| Manage Bids | ✅ View, edit, delete bids |
| History | ✅ Track all bid changes |
| Files | ✅ Upload attachments to bids |

## 📊 Database Collections

| Collection | Purpose | Key Fields |
|-----------|---------|-----------|
| bids | Main bid records | driver_id, shipment_id, quoted_price, vehicle_type, etc. |
| bid_attachments | File uploads | bid_id, attachment, file_type |
| bid_edit_history | Change tracking | bid_id, old_values, new_values, edited_by_id |

## 🔧 Core API Endpoints

```javascript
// Get available shipments
GET /api/items/shipments?filter={"status":{"_eq":"POSTED"},"user_id":{"_neq":userId}}

// Get my bids
GET /api/items/bids?filter={"driver_id":{"_eq":driverId}}

// Place new bid
POST /api/items/bids
{ driver_id, shipment_id, quoted_price, eta_datetime, duration_hours, vehicle_type, ... }

// Update bid
PATCH /api/items/bids/{id}
{ quoted_price, eta_datetime, duration_hours, ... }

// Delete bid
DELETE /api/items/bids/{id}

// Upload file
POST /api/files
FormData with file

// Link file to bid
POST /api/items/bid_attachments
{ bid_id, attachment, file_type }

// Get bid history
GET /api/items/bid_edit_history?filter={"bid_id":{"_eq":bidId}}
```

## 🎨 Component Structure

```
BiddingSystemModern
├── State
│   ├── view: 'shipments' | 'myBids'
│   ├── shipments, filteredShipments
│   ├── myBids, selectedBid
│   ├── formData, attachments
│   └── validationErrors, bidHistory
│
├── Views
│   ├── Shipments Tab
│   │   ├── Search & Filter
│   │   ├── Shipment Cards
│   │   └── "Place Bid" Button
│   │
│   └── My Bids Tab
│       ├── Bid List
│       ├── Status Badges
│       └── Action Buttons (Edit/Delete/History)
│
├── Modals
│   ├── Bid Form Modal (Place & Edit)
│   ├── History Modal (View changes)
│
└── Functions
    ├── loadShipments()
    ├── loadMyBids()
    ├── handlePlaceBid()
    ├── handleEditBid()
    ├── handleDeleteBid()
    ├── loadBidHistory()
    └── uploadBidAttachments()
```

## 📋 Form Fields

```javascript
const formData = {
  quotedPrice: '',           // Required: > 0
  etaDatetime: '',          // Required: datetime
  durationHours: '',        // Required: > 0
  vehicleType: '',          // Required: dropdown
  specialHandling: '',      // Optional: textarea
  insuranceCoverage: '',    // Optional: dropdown
  paymentTerms: 'upon_delivery',  // Required: dropdown
  notes: ''                 // Optional: textarea
}

// Vehicle Types
['pickup', '3-ton', '5-ton', '10-ton', '15-ton', '20-ton', 'trailer', 'refrig', 'tanker']

// Payment Terms
['upon_delivery', 'prepaid', 'advance_50', 'net_15', 'net_30']

// Insurance Options
['', 'basic', 'standard', 'premium']
```

## 🔍 Validation Rules

```javascript
✅ quotedPrice > 0
✅ etaDatetime is required
✅ durationHours > 0
✅ vehicleType is required
✅ paymentTerms is required

❌ Empty required fields → show error
❌ Invalid numbers → show error
```

## 🎨 Status Badges

| Status | Color | Badge |
|--------|-------|-------|
| pending | Amber | PENDING |
| accepted | Green | ACCEPTED |
| rejected | Red | REJECTED |
| cancelled | Gray | CANCELLED |

## 🔐 Security Features

- ✅ Auth token required on all API calls
- ✅ User ID validation
- ✅ Driver-only access (role === 'driver')
- ✅ Filter by user ownership
- ✅ Soft delete with deleted_at timestamp

## 📱 Responsive Design

```
Desktop:  2-column grid for shipments
Tablet:   2-column grid, adjusted spacing
Mobile:   1-column grid, adjusted padding
```

## 🎯 User Flow

```
1. Driver clicks "Go to Bidding System" on Dashboard
2. Bidding System loads with "Available Shipments" tab
3. Driver searches/filters shipments
4. Driver clicks "Place Bid" on shipment
5. Bid Form Modal opens
6. Driver fills all required fields
7. Driver optionally adds notes and files
8. Driver clicks "Place Bid"
9. Bid is created and driver returns to "My Bids" tab
10. Driver can now edit, view history, or delete pending bid
```

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "No authentication found" | Check localStorage.getItem('auth_token') |
| "Failed to fetch shipments" | Check API response status and browser console |
| "Cannot edit accepted/rejected bids" | Only pending bids can be edited |
| "File upload failed" | Check file size and type, verify /api/files endpoint |
| "History shows no changes" | Bid_edit_history only shows if bid was actually edited |

## 🧪 Quick Test Steps

1. **Setup**: Login as driver (driver@itboy.ir)
2. **Navigate**: Click "Modern Bidding System" on dashboard
3. **Search**: Type location in search box
4. **View**: Click "Place Bid" on any shipment
5. **Fill**: Complete all required fields
6. **Submit**: Click "Place Bid"
7. **Check**: Verify bid appears in "My Bids" tab
8. **Edit**: Click "Edit" on pending bid
9. **History**: Click "History" to view changes
10. **Delete**: Click "Delete" to remove bid (with confirmation)

## 📚 Related Documentation

- **Full Documentation**: `BIDDING_SYSTEM_IMPLEMENTATION.md`
- **Implementation Summary**: `BIDDING_SYSTEM_SUMMARY.md`
- **Development Notes**: `CLAUDE.md`

## 💡 Tips

- 💡 Use "Sort By" to organize shipments by price or distance
- 💡 Add notes to bids for special instructions
- 💡 Upload documents to support your bid (e.g., insurance docs)
- 💡 Check bid history to track all modifications
- 💡 Payment terms can be adjusted based on shipment type
- 💡 Only pending bids can be edited or deleted

## 🔄 API Response Examples

**Place Bid Response**:
```json
{
  "data": {
    "id": 123,
    "driver_id": 45,
    "shipment_id": 67,
    "quoted_price": 500,
    "eta_datetime": "2025-01-15T14:00:00",
    "status": "pending",
    "created_at": "2025-01-14T10:30:00"
  }
}
```

**My Bids Response**:
```json
{
  "data": [
    {
      "id": 123,
      "quoted_price": 500,
      "vehicle_type": "10-ton",
      "status": "pending",
      "shipment_id": {
        "cargo_type": "Electronics"
      }
    }
  ]
}
```

## 🚀 Deployment Checklist

- [ ] Collections exist: bids, bid_attachments, bid_edit_history
- [ ] Permissions set for drivers to CRUD bids
- [ ] API proxy configured to /api endpoint
- [ ] Auth token storage working
- [ ] File upload endpoint accessible
- [ ] Component builds without errors
- [ ] Routing configured in App.jsx
- [ ] Navigation link added to Dashboard
- [ ] Tested with driver account
- [ ] Production build successful

---

**Last Updated**: November 14, 2025
**Version**: 1.0.0
**Status**: Production Ready ✅

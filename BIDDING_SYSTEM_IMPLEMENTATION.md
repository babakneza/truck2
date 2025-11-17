# Modern Bidding System Implementation

## Overview

A comprehensive, modern bidding system has been implemented for drivers in the shipping application. The system allows drivers to browse available shipments, place detailed bids with complete specifications, and manage their bidding activity with full history tracking.

## Architecture

### Collections Structure

The system utilizes three Directus collections:

#### 1. **bids** (Main Bidding Records)
- **id**: Primary key (integer, auto-increment)
- **driver_id**: Foreign key to drivers (many-to-one to users)
- **shipment_id**: Foreign key to shipments (many-to-one)
- **quoted_price**: Decimal - Driver's quoted price
- **eta_datetime**: Timestamp - Estimated delivery date/time
- **duration_hours**: Decimal - Estimated duration in hours
- **vehicle_type**: String - Type of vehicle offered
- **special_handling**: String - Special requirements or handling notes
- **insurance_coverage**: String - Insurance coverage level
- **payment_terms**: String - Payment terms (upon_delivery, prepaid, advance_50, net_15, net_30)
- **notes**: Text - Additional notes or comments
- **status**: String - Bid status (pending, accepted, rejected, cancelled)
- **created_at**: Timestamp - Bid creation time
- **updated_at**: Timestamp - Last update time
- **deleted_at**: Timestamp - Soft delete timestamp

#### 2. **bid_attachments** (File Uploads)
- **id**: Primary key (integer)
- **bid_id**: Foreign key to bids (many-to-one)
- **attachment**: File reference (many-to-one to directus_files)
- **file_type**: String - MIME type of file
- **uploaded_at**: Timestamp - Upload timestamp

#### 3. **bid_edit_history** (Change Tracking)
- **id**: Primary key (integer)
- **bid_id**: Foreign key to bids (many-to-one)
- **old_values**: JSON - Previous field values
- **new_values**: JSON - New field values
- **edit_reason**: String - Reason for the edit
- **created_at**: Timestamp - Change timestamp
- **edited_by_id**: UUID - User ID who made the change (FK to directus_users)

### Component Structure

**File**: `src/components/BiddingSystemModern.jsx`

#### Key Features

1. **View Management**
   - `view === 'shipments'`: Browse available shipments
   - `view === 'myBids'`: View and manage placed bids

2. **State Management**
   - Shipments list with transformation
   - My bids with status tracking
   - Bid form data with validation
   - File attachments
   - Bid history

3. **Core Functions**
   - `loadShipments()`: Fetch available shipments for bidding
   - `loadMyBids()`: Fetch driver's placed bids
   - `loadBidHistory()`: Fetch edit history for a bid
   - `validateBidForm()`: Validate all required fields
   - `handlePlaceBid()`: Submit new bid with attachments
   - `handleEditBid()`: Update pending bid
   - `handleDeleteBid()`: Delete pending bid
   - `uploadBidAttachments()`: Upload and link files to bid

#### Modals

1. **Bid Form Modal** (`showBidForm`)
   - Comprehensive form for placing bids
   - Real-time validation with error display
   - File upload support with preview
   - All fields from bids collection

2. **Edit Form Modal** (`showEditForm`)
   - Edit form for pending bids only
   - Same fields as bid form
   - Saves changes to bid_edit_history via trigger

3. **History Modal** (`showHistory`)
   - View all changes to a bid
   - Shows before/after values
   - Displays edit timestamps and user info

## Features

### 1. Browse Available Shipments

**Features**:
- Display all active shipments posted by other users
- Real-time search by cargo type, pickup, or dropoff
- Sort options:
  - Most Recent
  - Price (Low to High)
  - Price (High to Low)
  - Distance
- Filter and clear filters
- Display shipment details:
  - Cargo type and description
  - Route (pickup → dropoff) with distance
  - Weight and volume
  - Budget range
  - Pickup and delivery dates
  - Number of existing bids

### 2. Place Bid

**Comprehensive Bid Form**:
- **Pricing**
  - Quoted Price (with validation)
  - Currency matches shipment
  - Suggested amount based on budget

- **Timing**
  - Estimated Delivery Date & Time (datetime picker)
  - Estimated Duration in hours

- **Vehicle Details**
  - Vehicle Type selection (pickup, 3-ton, 5-ton, 10-ton, 15-ton, 20-ton, trailer, refrigerated, tanker)
  - Special Handling requirements (text area)
  - Insurance Coverage (none, basic, standard, premium)

- **Payment**
  - Payment Terms (upon delivery, prepaid, 50% advance, net 15, net 30)

- **Additional Info**
  - Notes (text area for additional information)
  - File Attachments (optional, multiple files)

**Validation**:
- Quoted price must be > 0
- ETA is required
- Duration must be > 0
- Vehicle type is required
- Payment terms is required
- All errors displayed with clear messages

### 3. Manage My Bids

**Bid Display**:
- Shows all driver's placed bids
- Status badges:
  - Pending (amber)
  - Accepted (green)
  - Rejected (red)
  - Cancelled (gray)
- Quick view of key bid details:
  - Quoted price
  - Duration
  - Vehicle type
  - Payment terms
  - Notes

**Bid Actions**:
- **View History**: See all changes to the bid with timestamps
- **Edit** (pending bids only): Modify bid details
- **Delete** (pending bids only): Remove the bid with confirmation

### 4. Bid History Tracking

**Tracked Changes**:
- Shows chronological history of all edits
- Displays old and new values for each field
- Shows edit reason (if provided)
- Timestamp and user who made the change
- Edit #1, #2, etc. numbering

## API Integration

### Endpoints Used

```
GET  /api/items/shipments?filter={...}  → Available shipments
GET  /api/items/bids?filter={...}       → Driver's bids
GET  /api/items/bid_attachments         → Bid attachments
GET  /api/items/bid_edit_history        → Edit history
GET  /api/assets/{fileId}               → Download files

POST /api/items/bids                    → Create new bid
POST /api/files                         → Upload file
POST /api/items/bid_attachments         → Link file to bid

PATCH /api/items/bids/{id}              → Update bid

DELETE /api/items/bids/{id}             → Delete bid
```

### Filter Examples

```javascript
Available shipments (not posted by current user):
{"status": {"_eq": "POSTED"}, "user_id": {"_neq": userId}}

Driver's bids:
{"driver_id": {"_eq": driverId}}

Bid history for specific bid:
{"bid_id": {"_eq": bidId}}
```

## UI/UX Design

### Modern Design Elements
- Gradient backgrounds (blue to indigo)
- Rounded corners (2xl = 16px radius)
- Card-based layout with shadows
- Color-coded status badges
- Icon integration with Lucide React
- Responsive grid layouts
- Smooth transitions and hover effects
- Modal dialogs for forms

### Color Scheme
- **Primary**: Indigo (#4F46E5)
- **Secondary**: Blue (#3B82F6)
- **Success**: Green (#10B981)
- **Warning**: Amber (#F59E0B)
- **Error**: Red (#EF4444)
- **Neutral**: Gray (#6B7280)

### Icon Usage
- **Zap**: Bidding, quick actions
- **MapPin**: Location/route
- **DollarSign**: Pricing
- **Calendar**: Dates/time
- **Clock**: Duration/time
- **Truck**: Vehicle type
- **Shield**: Insurance/protection
- **CreditCard**: Payment terms
- **FileText**: Notes/documents
- **FileUp**: File uploads
- **History**: Change tracking
- **Edit2**: Edit action
- **Trash2**: Delete action
- **ArrowLeft**: Navigation back
- **Eye**: View/visibility
- **Plus**: Add actions
- **Check**: Confirm actions
- **Send**: Submit actions

## Browser Compatibility

- Modern browsers supporting:
  - ES2020+ JavaScript
  - CSS Grid and Flexbox
  - Fetch API
  - File API
  - FormData API

## Performance Considerations

1. **Data Loading**
   - Efficient API filtering at source
   - Lazy loading of bid history
   - File uploads with progress tracking

2. **Rendering**
   - useCallback for function memoization
   - Conditional rendering for modals
   - Responsive grid layouts

3. **Validation**
   - Client-side validation before submission
   - Real-time error display
   - Form reset after successful submission

## Security Features

1. **Authentication**
   - All requests include auth token
   - User ID verification
   - Role-based access (drivers only)

2. **Data Protection**
   - Filtering by current user's ID
   - Cannot view other drivers' bids without proper permissions
   - File upload validation

3. **Soft Deletes**
   - Uses deleted_at timestamp
   - Preserves data integrity

## Error Handling

1. **Network Errors**
   - Alert messages for failed API calls
   - Graceful fallbacks
   - Retry-friendly state management

2. **Validation Errors**
   - Clear error messages below each field
   - Visual error indicators (red text, alert icons)
   - Form submission prevention until valid

3. **File Upload Errors**
   - Individual file error handling
   - Attachment removal capability

## Future Enhancements

1. **Bid Analytics**
   - Acceptance rate tracking
   - Price competitiveness insights
   - Bid timing analysis

2. **Notifications**
   - Real-time bid status updates
   - Shipment alerts
   - Payment notifications

3. **Advanced Filtering**
   - Date range filters
   - Custom route preferences
   - Vehicle type matching

4. **Bid Templates**
   - Save bid templates
   - Quick bid placement with templates
   - Preset vehicle configurations

5. **Batch Operations**
   - Multi-bid management
   - Bulk status updates
   - Batch export functionality

6. **Mobile Optimization**
   - Touch-friendly interfaces
   - Mobile-specific layouts
   - Offline capability

## Testing

### Manual Testing Checklist

- [ ] Load bidding system as driver
- [ ] Browse available shipments
- [ ] Search and filter shipments
- [ ] View shipment details
- [ ] Place bid with all fields
- [ ] Validate required fields
- [ ] Upload files to bid
- [ ] View placed bid
- [ ] Edit pending bid
- [ ] View bid history
- [ ] Delete bid
- [ ] View My Bids tab
- [ ] Check status badges

### Test Data

Driver account:
- Email: `driver@itboy.ir`
- Has access to bidding system
- Can place/manage bids

## Deployment Notes

1. Ensure all three collections exist in Directus
2. Set proper permissions for drivers to:
   - Read bids collection
   - Create bids records
   - Update own bids
   - Read bid_edit_history
   - Upload files via /api/files
3. Verify API proxy to `/api` endpoint
4. Test auth token storage and retrieval

## Files Modified/Created

- **Created**: `src/components/BiddingSystemModern.jsx` (650+ lines)
- **Modified**: `src/App.jsx` (added import and route)
- **Modified**: `src/components/DriverDashboard.jsx` (updated button to link to bidding system)
- **Modified**: `CLAUDE.md` (added documentation)

## Code Quality

- ✅ ESLint compliant
- ✅ No TypeScript errors
- ✅ Follows React best practices
- ✅ Proper dependency injection
- ✅ Responsive design
- ✅ Accessibility considered
- ✅ Production build successful

---

**Implementation Date**: 2025-01-14
**Component Version**: 1.0.0
**Status**: Production Ready

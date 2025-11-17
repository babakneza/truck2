# Shipper Profile Component - Visual Guide

## Component Structure

```
ShipperProfileModern
│
├── Loading State
│   └── Spinner with "Loading profile..." message
│
└── Main Layout
    │
    ├── Profile Header Card
    │   ├── Gradient Banner (blue gradient)
    │   ├── Avatar (128x128, rounded-2xl)
    │   │   └── Camera Icon (hover overlay)
    │   ├── User Info
    │   │   ├── Name (h1, bold)
    │   │   ├── Verification Badge
    │   │   ├── Email (with icon)
    │   │   ├── Phone (with icon)
    │   │   └── Member Since (with icon)
    │   ├── Action Buttons
    │   │   ├── Edit Profile / Save Changes
    │   │   └── Cancel (when editing)
    │   └── Stats Bar (4 columns)
    │       ├── Rating (⭐ 4.8)
    │       ├── Total Shipments (📈 count)
    │       ├── Response Rate (95%)
    │       └── Trust Score (🛡️ 85%)
    │
    └── Content Card
        │
        ├── Tab Navigation
        │   ├── Personal Info (👤)
        │   ├── Business Details (🏢)
        │   ├── Documents (📄)
        │   └── Settings (⚙️)
        │
        └── Tab Content
            │
            ├── Personal Info Tab
            │   ├── Personal Information Section
            │   │   ├── First Name
            │   │   ├── Last Name
            │   │   ├── Email (disabled)
            │   │   ├── Phone
            │   │   ├── Nationality 🆕
            │   │   └── ID Number 🆕
            │   └── Contact Information Section
            │       ├── Physical Address
            │       ├── City
            │       ├── State
            │       ├── Country
            │       └── Postal Code
            │
            ├── Business Details Tab
            │   └── Business Profile Section
            │       ├── Company Name
            │       ├── Company Description (textarea)
            │       ├── Business Registration Number
            │       ├── Tax Registration Number
            │       ├── Industry Specialization
            │       ├── Years in Business
            │       ├── Company Size (select)
            │       ├── Service Areas
            │       ├── Business Hours
            │       └── Website
            │
            ├── Documents Tab
            │   ├── Document Library
            │   │   └── Document Cards (grid)
            │   │       ├── Icon
            │   │       ├── Document Type
            │   │       ├── Status Badge
            │   │       └── Upload Date
            │   └── Upload Section
            │       ├── Drag & Drop Area
            │       └── Choose File Button
            │
            └── Settings Tab
                ├── Security Section
                │   ├── Change Password
                │   └── Enable 2FA
                ├── Notifications Section
                │   ├── Email notifications
                │   ├── SMS notifications
                │   └── Weekly reports
                ├── Preferences Section
                │   ├── Language (select)
                │   └── Timezone (select)
                └── Danger Zone
                    └── Deactivate Account
```

## Color Coding

### Status Badges
- **Verified**: Green background (#e8f5e9), Green text (#2e7d32)
- **Pending**: Yellow background (#fff3e0), Orange text (#e65100)
- **Rejected**: Red background (#ffebee), Red text (#c62828)

### Buttons
- **Primary**: Blue gradient (#1a73e8 → #4285f4)
- **Secondary**: Gray background (#f8f9fa), Gray text (#495057)
- **Danger**: Red background (#dc3545), White text

### Form States
- **Editable**: White background, Blue focus ring
- **Disabled**: Gray background (#f8f9fa), Gray text (#6c757d)

## Icon Usage (Lucide React)

### Header Icons
- `User` - Personal Info tab
- `Building2` - Business Details tab
- `FileText` - Documents tab
- `Settings` - Settings tab
- `Mail` - Email address
- `Phone` - Phone number
- `Calendar` - Member since
- `Award` - Rating
- `TrendingUp` - Total shipments
- `Shield` - Trust score

### Form Icons
- `Flag` - Nationality field
- `Hash` - ID Number field
- `MapPin` - Address section
- `Globe` - Website field
- `Briefcase` - Industry field

### Action Icons
- `Edit2` - Edit profile
- `Save` - Save changes
- `X` - Cancel
- `Camera` - Upload photo
- `Upload` - Upload documents
- `CheckCircle` - Verified status
- `Clock` - Pending status
- `AlertCircle` - Rejected status / Danger zone

## Responsive Behavior

### Mobile (< 768px)
- Single column layout
- Stacked form fields
- Full-width buttons
- Simplified stats (2x2 grid)
- Scrollable tabs

### Tablet (768px - 1024px)
- Two column layout
- Side-by-side form fields
- Stats in 4 columns
- Horizontal tabs

### Desktop (> 1024px)
- Full layout
- Multi-column grids
- All features visible
- Optimal spacing

## Animation & Transitions

### Hover Effects
- Buttons: `translateY(-2px)` + shadow increase
- Cards: `translateY(-4px)` + shadow increase
- Form fields: Border color change
- Tabs: Background color change

### Transitions
- All: `transition-all` (200ms - 300ms)
- Smooth color changes
- Smooth transform changes
- Smooth shadow changes

### Loading States
- Spinner: Rotating animation
- Buttons: Opacity change when disabled
- Forms: Skeleton loading (future)

## Accessibility

### Keyboard Navigation
- Tab through all form fields
- Enter to submit
- Escape to cancel
- Arrow keys for tabs

### Focus Indicators
- Blue ring on focus
- 4px ring width
- Primary color (#1a73e8)
- Visible on all interactive elements

### Screen Readers
- Semantic HTML (h1, h2, section)
- ARIA labels on icons
- Form labels properly associated
- Status announcements

## Data Flow

```
User Action
    ↓
State Update (useState)
    ↓
Form Data Change
    ↓
Save Button Click
    ↓
API Call (fetch)
    ↓
Database Update
    ↓
Refresh Profile Data
    ↓
UI Update
```

## API Endpoints Used

### GET Requests
- `/api/users/me` - User data
- `/api/items/shipper_profiles` - Shipper profile
- `/api/items/shipments` - Shipments for stats
- `/api/items/kyc_documents` - Documents
- `/api/items/payment_methods` - Payment methods

### PATCH/POST Requests
- `/api/users/me` - Update user fields
- `/api/items/shipper_profiles/{id}` - Update profile
- `/api/items/shipper_profiles` - Create profile (if not exists)

## State Management

### Component State
```javascript
const [loading, setLoading] = useState(true)
const [editing, setEditing] = useState(false)
const [activeTab, setActiveTab] = useState('profile')
const [saving, setSaving] = useState(false)
const [profileData, setProfileData] = useState({...})
const [formData, setFormData] = useState({...})
```

### Data Structure
```javascript
profileData = {
  user: { id, email, first_name, last_name, phone, status },
  shipperProfile: { 
    company_name, 
    nationality, // NEW
    id_number,   // NEW
    ...
  },
  kycDocuments: [...],
  paymentMethods: [...],
  stats: { totalShipments, rating, ... }
}
```

## CSS Classes (Tailwind)

### Layout
- `min-h-screen` - Full viewport height
- `max-w-7xl` - Maximum width container
- `mx-auto` - Center horizontally
- `px-4 sm:px-6 lg:px-8` - Responsive padding

### Grid
- `grid grid-cols-1 md:grid-cols-2` - Responsive columns
- `gap-6` - Grid gap
- `space-y-8` - Vertical spacing

### Colors
- `bg-primary-600` - Primary background
- `text-primary-600` - Primary text
- `hover:bg-primary-700` - Hover state

### Effects
- `rounded-xl` - Border radius
- `shadow-xl` - Box shadow
- `transition-all` - Smooth transitions
- `hover:shadow-2xl` - Hover shadow

---

**This guide provides a complete overview of the ShipperProfileModern component structure, styling, and behavior.**

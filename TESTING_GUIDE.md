# Directus Logistics Platform - QA Testing Guide

**Project**: Truck2 Logistics Platform
**Purpose**: Complete role-based access control testing
**Target Audience**: QA/Testing Team
**Test Scope**: 5 Roles × 20 Collections × 4 Actions (CRUD)
**Total Test Cases**: 400+ scenarios

---

## Table of Contents
1. [Setup Instructions](#setup-instructions)
2. [Test User Creation](#test-user-creation)
3. [Testing by Role](#testing-by-role)
4. [Access Control Checklist](#access-control-checklist)
5. [Test Cases & Verification](#test-cases--verification)
6. [Reporting & Defects](#reporting--defects)

---

## Setup Instructions

### Prerequisites
- Access to Directus Admin Panel: https://admin.itboy.ir
- Admin account credentials (provided by system administrator)
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Document for recording test results

### Initial Setup Steps

1. **Log in to Directus Admin**
   - URL: https://admin.itboy.ir/admin
   - Use provided administrator credentials
   - Verify you see "Settings" menu at bottom left

2. **Verify Roles Exist**
   - Go to Settings → Roles & Permissions
   - Confirm these 5 roles exist:
     - [ ] Anonymous
     - [ ] Shipper
     - [ ] Driver
     - [ ] Admin
     - [ ] Administrator (built-in)

3. **Verify Collections Exist**
   - Go to Collections (left sidebar)
   - Confirm 21 collections visible:
     - [ ] User Management (5): users, verification_codes, token_blacklist, kyc_documents, payment_methods
     - [ ] Profiles (4): shipper_profiles, driver_profiles, vehicle_profiles, driver_bank_accounts
     - [ ] Shipment & Bidding (6): shipments, shipment_items, bids, bid_attachments, bid_edit_history, bid_statistics
     - [ ] Financial (6): payments, payment_authorizations, escrow, refunds, shipment_tracking

---

## Test User Creation

### Create Test Users in Directus

#### Step 1: Navigate to Users
```
Settings → Users & Roles → Users
Click "Create New"
```

#### Step 2: Create Anonymous User
**Note**: Anonymous users access the API without authentication.
- **Email**: anonymous@test.local
- **First Name**: Anonymous
- **Last Name**: Test
- **Password**: Auto-generated (or Test1234!)
- **Role**: Anonymous
- **Status**: Active
- **Save**

#### Step 3: Create Shipper User
```
Settings → Users & Roles → Users → Create New

Email: shipper@test.local
First Name: John
Last Name: Shipper
Password: Test1234!
Role: Shipper
Status: Active
Save
```

#### Step 4: Create Driver User
```
Settings → Users & Roles → Users → Create New

Email: driver@test.local
First Name: James
Last Name: Driver
Password: Test1234!
Role: Driver
Status: Active
Save
```

#### Step 5: Create Admin User
```
Settings → Users & Roles → Users → Create New

Email: admin@test.local
First Name: Admin
Last Name: User
Password: Test1234!
Role: Admin
Status: Active
Save
```

#### Step 6: Create Administrator User (Optional)
**Note**: Administrator role is system-level. Only create if testing system functions.
```
Settings → Users & Roles → Users → Create New

Email: sysadmin@test.local
First Name: System
Last Name: Admin
Password: Test1234!
Role: Administrator
Status: Active
Save
```

### Verification Checklist
- [ ] All 5 test users created
- [ ] Each user has correct role assigned
- [ ] All users have status = "Active"
- [ ] User IDs noted for reference (helpful for debugging)

---

## Testing by Role

---

### ROLE 1: ANONYMOUS USER

#### Login Instructions
1. Log out from Directus Admin
2. Open browser in Incognito/Private mode
3. Go to https://admin.itboy.ir/admin
4. Email: `anonymous@test.local`
5. Password: `Test1234!`
6. Click "Sign In"

#### Expected Behavior After Login
- ✅ Should see limited collections list
- ✅ Only "shipments" collection should be visible
- ✅ No "Settings" menu at bottom
- ✅ No access to Users, Roles, or other admin features

#### Test Cases - Anonymous Role

| # | Collection | Action | Expected | Result | Notes |
|---|---|---|---|---|---|
| 1.1 | shipments | **READ** | ✅ Can view list | [ ] | Should see all shipments |
| 1.2 | shipments | **CREATE** | ❌ Cannot (button disabled) | [ ] | "+" button should not appear |
| 1.3 | shipments | **UPDATE** | ❌ Cannot (no edit button) | [ ] | Edit pencil icon should not appear |
| 1.4 | shipments | **DELETE** | ❌ Cannot (no delete) | [ ] | No trash icon visible |
| 1.5 | bids | **READ** | ❌ Cannot access | [ ] | Collection not in sidebar |
| 1.6 | payments | **READ** | ❌ Cannot access | [ ] | Collection not in sidebar |
| 1.7 | users | **READ** | ❌ Cannot access | [ ] | Collection not in sidebar |
| 1.8 | Settings | **ACCESS** | ❌ Settings hidden | [ ] | Settings menu not visible |

#### Anonymous User Test Summary
```
Total Test Cases: 8
Expected Passes: 6 (all ❌) + 2 (all ✅)
Actual Passes: _____
Pass Rate: _____%
```

**Defects Found**:
- [ ] None
- [ ] (list any issues below)

---

### ROLE 2: SHIPPER USER

#### Login Instructions
1. Log out current user
2. Log in as: `shipper@test.local`
3. Password: `Test1234!`

#### Expected Behavior After Login
- ✅ Should see collections sidebar
- ✅ Visible collections: shipments, bids, payments, shipment_items, shipment_tracking, shipper_profiles
- ✅ Other collections hidden or disabled
- ✅ Settings menu not visible

#### Pre-Test Setup (Optional)
To test read/write operations, you may need to:
1. Create a test shipper profile for this user (under shipper_profiles)
2. Create sample shipments
3. Other shippers create sample bids on your shipments

#### Test Cases - Shipper Role

##### 2.1: Shipments Collection
| # | Action | Filter | Expected | Result | Notes |
|---|---|---|---|---|---|
| 2.1.1 | **READ** | Own shipments | ✅ Can view | [ ] | Should see list (might be empty initially) |
| 2.1.2 | **READ** | Other's shipments | ❌ Cannot | [ ] | Row-level filter should block view |
| 2.1.3 | **CREATE** | New shipment | ✅ Can create | [ ] | "+" button should work |
| 2.1.4 | **UPDATE** | Own shipment | ✅ Can edit | [ ] | Edit pencil icon should work |
| 2.1.5 | **UPDATE** | Other's shipment | ❌ Cannot | [ ] | Cannot modify other user's data |
| 2.1.6 | **DELETE** | Own shipment | ✅ Can delete | [ ] | Trash icon should work |
| 2.1.7 | **DELETE** | Other's shipment | ❌ Cannot | [ ] | Cannot delete other's data |

**To test 2.1.2, 2.1.5, 2.1.7**: 
- Ask another user to post a shipment
- Try to view/edit/delete it

##### 2.2: Bids Collection
| # | Action | Filter | Expected | Result | Notes |
|---|---|---|---|---|---|
| 2.2.1 | **READ** | Own shipment bids | ✅ Can view | [ ] | See bids received on own shipments |
| 2.2.2 | **READ** | Other user's bids | ❌ Cannot | [ ] | Should not see bids on others' shipments |
| 2.2.3 | **CREATE** | New bid | ❌ Cannot | [ ] | Shippers don't create bids |
| 2.2.4 | **UPDATE** | Bid | ❌ Cannot | [ ] | Shippers don't modify bids |
| 2.2.5 | **DELETE** | Bid | ❌ Cannot | [ ] | Shippers don't delete bids |

##### 2.3: Payments Collection
| # | Action | Filter | Expected | Result | Notes |
|---|---|---|---|---|---|
| 2.3.1 | **READ** | Own shipments | ✅ Can view | [ ] | See payment records for own shipments |
| 2.3.2 | **READ** | Other's payments | ❌ Cannot | [ ] | Cannot see others' payment info |
| 2.3.3 | **CREATE** | Payment | ❌ Cannot | [ ] | Only system creates payments |
| 2.3.4 | **UPDATE** | Payment | ❌ Cannot | [ ] | Cannot modify payments |
| 2.3.5 | **DELETE** | Payment | ❌ Cannot | [ ] | Cannot delete payments |

##### 2.4: Shipper_profiles Collection
| # | Action | Filter | Expected | Result | Notes |
|---|---|---|---|---|---|
| 2.4.1 | **READ** | Own profile | ✅ Can view | [ ] | See own business info |
| 2.4.2 | **READ** | Other profiles | ❌ Cannot | [ ] | Cannot see other shippers' info |
| 2.4.3 | **CREATE** | New profile | ❌ Cannot | [ ] | Profile created at signup |
| 2.4.4 | **UPDATE** | Own profile | ✅ Can edit | [ ] | Update company info, rates |
| 2.4.5 | **UPDATE** | Other profile | ❌ Cannot | [ ] | Cannot modify other shippers |
| 2.4.6 | **DELETE** | Profile | ❌ Cannot | [ ] | Cannot delete profiles |

##### 2.5: Related Collections (Read-Only)
| # | Collection | Action | Expected | Result | Notes |
|---|---|---|---|---|---|
| 2.5.1 | shipment_items | READ | ✅ Can view | [ ] | View items in own shipments |
| 2.5.2 | shipment_items | CREATE | ❌ Cannot | [ ] | Items are created with shipment |
| 2.5.3 | shipment_tracking | READ | ✅ Can view | [ ] | Real-time tracking of own shipments |
| 2.5.4 | shipment_tracking | UPDATE | ❌ Cannot | [ ] | Only drivers/system update tracking |

##### 2.6: Prohibited Collections
| # | Collection | Expected | Result | Notes |
|---|---|---|---|---|
| 2.6.1 | users | Cannot access | [ ] | Not visible in sidebar |
| 2.6.2 | driver_profiles | Cannot access | [ ] | Not visible in sidebar |
| 2.6.3 | vehicle_profiles | Cannot access | [ ] | Not visible in sidebar |
| 2.6.4 | kyc_documents | Cannot access | [ ] | Not visible in sidebar |
| 2.6.5 | escrow | Cannot access | [ ] | Not visible in sidebar |
| 2.6.6 | refunds | Cannot access | [ ] | Not visible in sidebar |
| 2.6.7 | Settings menu | Cannot access | [ ] | Settings not visible |

#### Shipper User Test Summary
```
Total Test Cases: 30+
Expected Passes: 18-20
Actual Passes: _____
Pass Rate: _____%
```

**Defects Found**:
- [ ] None
- [ ] (list any issues)

---

### ROLE 3: DRIVER USER

#### Login Instructions
1. Log out current user
2. Log in as: `driver@test.local`
3. Password: `Test1234!`

#### Expected Behavior After Login
- ✅ Should see collections sidebar
- ✅ Visible collections: shipments (read-only), bids, bid_attachments, vehicle_profiles, driver_profiles, driver_bank_accounts, payments, shipment_items
- ✅ Other collections hidden
- ✅ Settings menu not visible

#### Pre-Test Setup
To test all functionality:
1. Create driver profile for this user (driver_profiles)
2. Create vehicle profile (vehicle_profiles)
3. Create bank account for payouts (driver_bank_accounts)
4. Ask a shipper to post a test shipment
5. Place a test bid on that shipment

#### Test Cases - Driver Role

##### 3.1: Shipments Collection (Read-Only)
| # | Action | Expected | Result | Notes |
|---|---|---|---|---|
| 3.1.1 | **READ** | ✅ Can view all | [ ] | Browse all available shipments |
| 3.1.2 | **CREATE** | ❌ Cannot | [ ] | "+" button disabled |
| 3.1.3 | **UPDATE** | ❌ Cannot | [ ] | Edit button disabled |
| 3.1.4 | **DELETE** | ❌ Cannot | [ ] | Delete button disabled |

##### 3.2: Bids Collection
| # | Action | Filter | Expected | Result | Notes |
|---|---|---|---|---|
| 3.2.1 | **READ** | Own bids | ✅ Can view | [ ] | See own submitted bids |
| 3.2.2 | **READ** | Other drivers' bids | ❌ Cannot | [ ] | Row filter blocks other bids |
| 3.2.3 | **CREATE** | New bid | ✅ Can create | [ ] | Place bid on available shipment |
| 3.2.4 | **UPDATE** | Own bid | ✅ Can edit | [ ] | Modify bid amount/notes |
| 3.2.5 | **UPDATE** | Other's bid | ❌ Cannot | [ ] | Cannot modify competitors' bids |
| 3.2.6 | **DELETE** | Own bid | ✅ Can delete | [ ] | Withdraw own bid |
| 3.2.7 | **DELETE** | Other's bid | ❌ Cannot | [ ] | Cannot delete others' bids |

**Important Test**: 
- 3.2.4: Try editing a bid that's already accepted. Should fail (validation).
- 3.2.5: Ask another driver to submit a bid, try to edit it. Should be blocked.

##### 3.3: Bid_attachments Collection
| # | Action | Filter | Expected | Result | Notes |
|---|---|---|---|---|
| 3.3.1 | **READ** | Own bid attachments | ✅ Can view | [ ] | See documents on own bids |
| 3.3.2 | **READ** | Other's attachments | ❌ Cannot | [ ] | Cannot see other drivers' docs |
| 3.3.3 | **CREATE** | New attachment | ✅ Can upload | [ ] | Add quote/doc to bid |
| 3.3.4 | **UPDATE** | Attachment | ❌ Cannot | [ ] | Attachments immutable |
| 3.3.5 | **DELETE** | Attachment | ❌ Cannot | [ ] | Cannot delete documents |

##### 3.4: Vehicle_profiles Collection
| # | Action | Filter | Expected | Result | Notes |
|---|---|---|---|---|
| 3.4.1 | **READ** | Own vehicles | ✅ Can view | [ ] | See own vehicle list |
| 3.4.2 | **READ** | Other's vehicles | ❌ Cannot | [ ] | Cannot see competitors' fleet |
| 3.4.3 | **CREATE** | New vehicle | ✅ Can add | [ ] | Register new vehicle |
| 3.4.4 | **UPDATE** | Own vehicle | ✅ Can edit | [ ] | Update vehicle info |
| 3.4.5 | **UPDATE** | Other's vehicle | ❌ Cannot | [ ] | Cannot modify other drivers' vehicles |
| 3.4.6 | **DELETE** | Vehicle | ❌ Cannot | [ ] | Cannot delete vehicles |

**Important Tests**:
- 3.4.3: Verify validation rules (insurance_expiry, capacity_kg > 0, etc.)
- 3.4.4: Try modifying expired insurance. Should fail validation.

##### 3.5: Driver_profiles Collection
| # | Action | Filter | Expected | Result | Notes |
|---|---|---|---|---|
| 3.5.1 | **READ** | Own profile | ✅ Can view | [ ] | See own driver info |
| 3.5.2 | **READ** | Other's profile | ❌ Cannot | [ ] | Cannot view other drivers |
| 3.5.3 | **CREATE** | Profile | ❌ Cannot | [ ] | Profile created at signup |
| 3.5.4 | **UPDATE** | Own profile | ✅ Can edit | [ ] | Update rating, bio, experience |
| 3.5.5 | **UPDATE** | Other's profile | ❌ Cannot | [ ] | Cannot modify other drivers |
| 3.5.6 | **DELETE** | Profile | ❌ Cannot | [ ] | Cannot delete profile |

##### 3.6: Driver_bank_accounts Collection
| # | Action | Filter | Expected | Result | Notes |
|---|---|---|---|---|
| 3.6.1 | **READ** | Own accounts | ✅ Can view | [ ] | See saved bank accounts |
| 3.6.2 | **READ** | Other's accounts | ❌ Cannot | [ ] | Cannot see other drivers' bank info |
| 3.6.3 | **CREATE** | New account | ✅ Can add | [ ] | Add bank account for payouts |
| 3.6.4 | **UPDATE** | Own account | ✅ Can edit | [ ] | Update account details |
| 3.6.5 | **UPDATE** | Other's account | ❌ Cannot | [ ] | Cannot modify other drivers' accounts |
| 3.6.6 | **DELETE** | Account | ❌ Cannot | [ ] | Cannot delete accounts |

##### 3.7: Payments Collection (Read-Only)
| # | Action | Filter | Expected | Result | Notes |
|---|---|---|---|---|
| 3.7.1 | **READ** | Own payments | ✅ Can view | [ ] | See payments for accepted bids |
| 3.7.2 | **READ** | Other's payments | ❌ Cannot | [ ] | Cannot see other drivers' earnings |
| 3.7.3 | **CREATE** | Payment | ❌ Cannot | [ ] | System creates payments |
| 3.7.4 | **UPDATE** | Payment | ❌ Cannot | [ ] | Cannot modify payments |
| 3.7.5 | **DELETE** | Payment | ❌ Cannot | [ ] | Cannot delete records |

##### 3.8: Related Collections (Read-Only)
| # | Collection | Action | Expected | Result | Notes |
|---|---|---|---|---|
| 3.8.1 | shipment_items | READ | ✅ Can view | [ ] | See cargo items in shipments |
| 3.8.2 | bid_edit_history | READ | ✅ Can view own | [ ] | See change history of own bids |
| 3.8.3 | payment_authorizations | READ | ❌ Cannot | [ ] | Admin-only approval records |

##### 3.9: Prohibited Collections
| # | Collection | Expected | Result | Notes |
|---|---|---|---|---|
| 3.9.1 | users | Cannot access | [ ] | Not in sidebar |
| 3.9.2 | shipper_profiles | Cannot access | [ ] | Cannot see shipper info |
| 3.9.3 | kyc_documents | Cannot access | [ ] | Not in sidebar |
| 3.9.4 | escrow | Cannot access | [ ] | Not in sidebar |
| 3.9.5 | refunds | Cannot access | [ ] | Not in sidebar |
| 3.9.6 | Settings | Cannot access | [ ] | Menu hidden |

#### Driver User Test Summary
```
Total Test Cases: 40+
Expected Passes: 24-26
Actual Passes: _____
Pass Rate: _____%
```

**Defects Found**:
- [ ] None
- [ ] (list issues)

---

### ROLE 4: ADMIN USER

#### Login Instructions
1. Log out current user
2. Log in as: `admin@test.local`
3. Password: `Test1234!`

#### Expected Behavior After Login
- ✅ Should see all 21 collections
- ✅ Should see Settings menu
- ✅ Can create, edit, delete any record
- ✅ Can view all users' data
- ✅ Can access Access Control settings

#### Test Cases - Admin Role

##### 4.1: Full CRUD on All Collections
| # | Collection | CREATE | READ | UPDATE | DELETE | Result | Notes |
|---|---|---|---|---|---|---|---|
| 4.1.1 | users | ✅ | ✅ | ✅ | ✅ | [ ] | Full user management |
| 4.1.2 | shipments | ✅ | ✅ | ✅ | ✅ | [ ] | Can create/edit any shipment |
| 4.1.3 | bids | ✅ | ✅ | ✅ | ✅ | [ ] | Can manage all bids |
| 4.1.4 | payments | ✅ | ✅ | ✅ | ✅ | [ ] | Full payment control |
| 4.1.5 | vehicle_profiles | ✅ | ✅ | ✅ | ✅ | [ ] | Can manage all vehicles |
| 4.1.6 | driver_profiles | ✅ | ✅ | ✅ | ✅ | [ ] | Access all driver accounts |
| 4.1.7 | shipper_profiles | ✅ | ✅ | ✅ | ✅ | [ ] | Access all shipper accounts |
| 4.1.8 | kyc_documents | ✅ | ✅ | ✅ | ✅ | [ ] | Full KYC access |
| 4.1.9 | escrow | ✅ | ✅ | ✅ | ✅ | [ ] | Escrow management |
| 4.1.10 | refunds | ✅ | ✅ | ✅ | ✅ | [ ] | Process refunds |
| 4.1.11 | payment_authorizations | ✅ | ✅ | ✅ | ✅ | [ ] | Approve payments |
| 4.1.12 | All other 9 collections | ✅ | ✅ | ✅ | ✅ | [ ] | Full access to remaining |

**For each collection test**:
- [ ] Can view all records (no filters)
- [ ] Can create new record
- [ ] Can edit existing record (any user's)
- [ ] Can delete record

##### 4.2: Admin-Specific Capabilities

| # | Feature | Expected | Result | Notes |
|---|---|---|---|---|
| 4.2.1 | Access Settings menu | ✅ Can access | [ ] | Full system settings |
| 4.2.2 | User suspension | ✅ Can suspend | [ ] | Set user status = suspended |
| 4.2.3 | Role assignment | ✅ Can assign roles | [ ] | Change any user's role |
| 4.2.4 | KYC approval | ✅ Can approve docs | [ ] | Mark kyc_documents as approved |
| 4.2.5 | Payment adjustment | ✅ Can edit payments | [ ] | Modify payment amounts |
| 4.2.6 | Refund processing | ✅ Can create refunds | [ ] | Process manual refunds |
| 4.2.7 | Access Control settings | ✅ Can view/edit | [ ] | See Settings → Access Control |
| 4.2.8 | View activity logs | ✅ Can access | [ ] | See Settings → Activity Log |

##### 4.3: Cross-User Data Access
| # | Test | Expected | Result | Notes |
|---|---|---|---|---|
| 4.3.1 | View shipper's shipments | ✅ Can view | [ ] | No row filters applied |
| 4.3.2 | View driver's bids | ✅ Can view | [ ] | See all bids |
| 4.3.3 | View user's payments | ✅ Can view | [ ] | All payment data visible |
| 4.3.4 | View kyc_documents | ✅ Can view all | [ ] | See all pending approvals |
| 4.3.5 | Edit other's data | ✅ Can edit | [ ] | Modify any user's record |

#### Admin User Test Summary
```
Total Test Cases: 30+
Expected Passes: 30+
Actual Passes: _____
Pass Rate: _____%
```

**Defects Found**:
- [ ] None
- [ ] (list issues)

---

### ROLE 5: ADMINISTRATOR (System-Level)

#### Login Instructions
1. Log out current user
2. Log in as: `sysadmin@test.local`
3. Password: `Test1234!`

#### Expected Behavior After Login
- ✅ Should see all features including system-level settings
- ✅ Full access to database structure
- ✅ Can manage roles and permissions
- ✅ Can access API tokens and webhooks
- ✅ Can access extensions and plugins

#### Test Cases - Administrator Role

| # | Feature | Expected | Result | Notes |
|---|---|---|---|---|
| 5.1 | View all collections | ✅ Yes | [ ] | Including system collections |
| 5.2 | Modify collection schema | ✅ Yes | [ ] | Add/remove fields |
| 5.3 | Create new role | ✅ Yes | [ ] | Add custom roles |
| 5.4 | Edit role permissions | ✅ Yes | [ ] | Modify all role settings |
| 5.5 | Manage API tokens | ✅ Yes | [ ] | Create/revoke tokens |
| 5.6 | Configure webhooks | ✅ Yes | [ ] | Set up event triggers |
| 5.7 | View all users | ✅ Yes | [ ] | See all platform users |
| 5.8 | Manage users | ✅ Yes | [ ] | Suspend, delete users |
| 5.9 | Access activity log | ✅ Yes | [ ] | View all platform activity |
| 5.10 | Configure extensions | ✅ Yes | [ ] | Install/manage extensions |
| 5.11 | Access database | ✅ Yes | [ ] | Full database management |
| 5.12 | Backup/restore | ✅ Yes | [ ] | Database backups |

#### Administrator Test Summary
```
Total Test Cases: 12
Expected Passes: 12
Actual Passes: _____
Pass Rate: _____%
```

**Defects Found**:
- [ ] None
- [ ] (list issues)

---

## Access Control Checklist

### Master Access Control Matrix

Print this table and fill it in as you test:

#### Collection Access by Role
```
              | Anonymous | Shipper | Driver | Admin | Sysadmin |
users         | ❌       | ❌     | ❌    | ✅   | ✅      |
shipments     | ✅ (R)   | ✅*    | ✅ (R)| ✅   | ✅      |
bids          | ❌       | ✅ (R) | ✅*   | ✅   | ✅      |
payments      | ❌       | ✅ (R) | ✅ (R)| ✅   | ✅      |
vehicle_prof  | ❌       | ❌     | ✅*   | ✅   | ✅      |
driver_prof   | ❌       | ❌     | ✅*   | ✅   | ✅      |
shipper_prof  | ❌       | ✅*    | ❌    | ✅   | ✅      |
All others    | ❌       | ❌     | ❌    | ✅   | ✅      |

Legend:
✅ = Full access
✅ (R) = Read-only
✅* = Own data only (row-level filter)
❌ = No access
```

### Field-Level Security Checks

For sensitive fields, verify they're hidden from lower roles:

| Field | Anonymous | Shipper | Driver | Admin | Hidden From |
|-------|---|---|---|---|---|
| user password_hash | ❌ | ❌ | ❌ | ✅ | All but Admin |
| kyc status | ❌ | ❌ | ❌ | ✅ | All but Admin |
| payment auth codes | ❌ | ❌ | ❌ | ✅ | All but Admin |
| driver earnings | ❌ | ❌ | ✅ (own) | ✅ | Non-owners |

- [ ] Verify password fields cannot be viewed
- [ ] Verify KYC approval status hidden from applicant
- [ ] Verify other users' payment details hidden
- [ ] Verify other drivers' earnings hidden

---

## Test Cases & Verification

### Test Case Format Template

Use this template for each test case:

```
TEST CASE ID: [TC-ROLE-COLLECTION-ACTION]

Title: [Role] can/cannot [ACTION] [COLLECTION]

Prerequisites:
- [ ] User logged in as [ROLE]
- [ ] Test data exists (if needed)

Steps:
1. Navigate to [COLLECTION]
2. Attempt [ACTION]
3. Verify [EXPECTED RESULT]

Expected Result:
- [EXPECTED BEHAVIOR]

Actual Result:
- [WHAT ACTUALLY HAPPENED]

Status: [ ] PASS [ ] FAIL

Notes/Defects:
- [Any observations]
```

### Critical Test Scenarios

#### Scenario 1: Shipper cannot view Driver data
```
TEST CASE ID: TC-SECURITY-001

Title: Shipper cannot view driver personal information

Prerequisites:
- [ ] Logged in as Shipper
- [ ] Driver has submitted bids

Steps:
1. Go to driver_profiles collection
2. Attempt to open the collection
3. Verify no data is visible

Expected Result:
- Collection not visible in sidebar
- Cannot navigate to driver_profiles
- No driver data displayed

Actual Result:
__________________________________

Status: [ ] PASS [ ] FAIL
```

#### Scenario 2: Driver cannot edit accepted bids
```
TEST CASE ID: TC-SECURITY-002

Title: Driver cannot modify accepted bid

Prerequisites:
- [ ] Logged in as Driver
- [ ] One of your bids is marked as accepted

Steps:
1. Go to bids collection
2. Find accepted bid
3. Click edit button
4. Try to modify bid_amount
5. Click save

Expected Result:
- Edit button should be disabled
- Cannot modify accepted bid
- Error message: "Cannot edit accepted bid"

Actual Result:
__________________________________

Status: [ ] PASS [ ] FAIL
```

#### Scenario 3: Admin can override and modify any data
```
TEST CASE ID: TC-ADMIN-001

Title: Admin can modify any user's shipment

Prerequisites:
- [ ] Logged in as Admin
- [ ] Shipper has active shipments

Steps:
1. Go to shipments collection
2. Find shipper's shipment
3. Click edit
4. Modify cargo_description
5. Save changes

Expected Result:
- Edit button enabled
- Can modify any field
- Changes saved successfully
- Audit log records the change

Actual Result:
__________________________________

Status: [ ] PASS [ ] FAIL
```

#### Scenario 4: Anonymous user cannot create data
```
TEST CASE ID: TC-ANON-001

Title: Anonymous cannot create shipment

Prerequisites:
- [ ] Logged in as Anonymous
- [ ] On shipments collection

Steps:
1. Look for create button ("+" icon)
2. Try to click it
3. Attempt to create new shipment

Expected Result:
- "+" button does not appear
- Cannot access create form
- No way to submit new shipment

Actual Result:
__________________________________

Status: [ ] PASS [ ] FAIL
```

### Regression Testing Checklist

After any system changes, re-run these critical tests:

- [ ] TC-SECURITY-001: Shipper cannot view driver data
- [ ] TC-SECURITY-002: Driver cannot edit accepted bids
- [ ] TC-ADMIN-001: Admin can modify any data
- [ ] TC-ANON-001: Anonymous cannot create
- [ ] TC-AUTH-001: All users can log in
- [ ] TC-RBAC-001: All roles have correct collections visible
- [ ] TC-DATA-001: Users see only their own data (row filters)
- [ ] TC-VALIDATION-001: Invalid data rejected (validation rules)

---

## Reporting & Defects

### Defect Report Template

For any failures, complete this form:

```
DEFECT REPORT
=============

ID: [Auto-assigned by tracking system]
Date: [YYYY-MM-DD]
Reporter: [Your Name]
Severity: [ ] Critical [ ] High [ ] Medium [ ] Low

Title:
[Short description of issue]

Test Case ID:
[TC-XXXX-XXX]

Steps to Reproduce:
1. [First step]
2. [Second step]
3. [Third step]

Expected Result:
[What should happen]

Actual Result:
[What actually happened]

Screenshots:
[Attach screenshot if possible]

Environment:
- Browser: [Chrome/Firefox/Safari/Edge]
- OS: [Windows/Mac/Linux]
- Directus URL: [URL tested]

Reproducibility:
[ ] Always
[ ] Sometimes
[ ] Once
[ ] Cannot reproduce

Root Cause Analysis:
[Your investigation findings]

Suggested Fix:
[Proposed solution if known]

Status: [ ] Open [ ] In Progress [ ] Fixed [ ] Closed [ ] Wontfix
```

### Defect Tracking

Use this table to track all defects found:

| ID | Test Case | Severity | Description | Status | Assigned To | Notes |
|---|---|---|---|---|---|---|
| DEF-001 | TC-XXXX | High | [Brief description] | Open | [Name] | [Notes] |
| DEF-002 | TC-XXXX | Medium | [Brief description] | Fixed | [Name] | [Notes] |

### Test Summary Report

#### Executive Summary
```
PROJECT: Truck2 Logistics Platform
TEST CYCLE: [Version/Sprint Number]
START DATE: [Date]
END DATE: [Date]
DURATION: [Days]

TEST COVERAGE:
- Total Test Cases Planned: 100+
- Test Cases Executed: ___
- Test Cases Passed: ___
- Test Cases Failed: ___
- Test Cases Blocked: ___

Success Rate: ___%

OVERALL STATUS: [ ] PASS [ ] FAIL

CRITICAL ISSUES: ___ (must be fixed before release)
MAJOR ISSUES: ___ (should be fixed)
MINOR ISSUES: ___ (nice to fix)
```

#### Detailed Results by Role

```
ANONYMOUS ROLE
- Test Cases: 8
- Passed: ___
- Failed: ___
- Pass Rate: ___%
- Critical Issues: ___

SHIPPER ROLE
- Test Cases: 30
- Passed: ___
- Failed: ___
- Pass Rate: ___%
- Critical Issues: ___

DRIVER ROLE
- Test Cases: 40
- Passed: ___
- Failed: ___
- Pass Rate: ___%
- Critical Issues: ___

ADMIN ROLE
- Test Cases: 30
- Passed: ___
- Failed: ___
- Pass Rate: ___%
- Critical Issues: ___

ADMINISTRATOR ROLE
- Test Cases: 12
- Passed: ___
- Failed: ___
- Pass Rate: ___%
- Critical Issues: ___
```

#### Recommendations
```
Based on testing results:

1. [Observation about strengths]
2. [Observation about weaknesses]
3. [Recommendation for improvement]
4. [Recommendation for next cycle]

Go/No-Go Decision: [ ] GO [ ] NO-GO

Reason:
[Brief explanation of decision]
```

---

## Tips for Testers

### General Guidelines

1. **Test in Isolation**
   - Always use a fresh browser session (Incognito mode)
   - Log out completely between role changes
   - Clear browser cache if seeing stale data

2. **Test with Real Data**
   - Create actual shipments, bids, payments
   - Test with varying data (different amounts, dates, etc.)
   - Test boundary conditions (min/max values)

3. **Check Validation Rules**
   - Try invalid data (negative numbers, bad emails, etc.)
   - Verify error messages are clear
   - Test date constraints

4. **Verify Row-Level Security**
   - Always try to access another user's data
   - Confirm proper filtering is applied
   - Check that user can only see own records

5. **Document Everything**
   - Take screenshots of failures
   - Note exact steps to reproduce
   - Record timestamps

### Common Test Data

For testing, use these sample values:

```
Shipper Data:
- Email: john.shipper@example.com
- Company: Global Logistics
- Origin: Muscat Port (23.6100, 58.5400)
- Destination: Dubai (25.2048, 55.2708)

Driver Data:
- Email: james.driver@example.com
- Phone: +968-92-123456
- Vehicle: 2022 Volvo FH16
- Capacity: 20,000 kg

Shipment Data:
- Cargo: Electronics
- Weight: 5,000 kg
- Budget: OMR 500-800
- Deadline: 5 days

Bid Data:
- Amount: OMR 650
- ETA: 3 days
- Vehicle: 20,000 kg capacity
```

### Troubleshooting Tips

| Problem | Solution |
|---------|----------|
| Can't log in | Verify email/password correct, check user exists |
| Wrong collections visible | Confirm user role assignment is correct |
| Can see other's data | Check row-level filters are applied |
| Create button missing | Verify role has CREATE permission |
| Edit button grayed out | May need to create data first, or not allowed to edit |
| Data not saving | Check validation rules, look for error messages |

---

## Sign-Off

### Test Lead Approval

```
Test Lead: _______________________
Date: _______________________
Pass/Fail: _______________________

All critical defects addressed: [ ] Yes [ ] No
All test cases documented: [ ] Yes [ ] No
Recommend release: [ ] Yes [ ] No
```

### Quality Assurance Sign-Off

```
QA Manager: _______________________
Date: _______________________

Verified all test cases executed: [ ] Yes [ ] No
Reviewed all defect reports: [ ] Yes [ ] No
Approved for production: [ ] Yes [ ] No
```

---

**Testing Guide Version**: 1.0
**Last Updated**: November 10, 2025
**Created By**: QA Lead
**Document Status**: Ready for Use

**GOOD LUCK WITH TESTING! 🧪**

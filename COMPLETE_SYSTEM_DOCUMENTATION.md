# Directus Logistics Platform - Complete System Documentation

**Project**: Truck2 Logistics Platform
**Database**: PostgreSQL via Directus CMS
**Frontend**: React 19 with Vite
**API**: Directus REST API with Token Authentication
**Last Updated**: November 10, 2025
**Status**: Schema Complete - Ready for Testing

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Database Schema](#database-schema)
3. [Collections & Fields](#collections--fields)
4. [Relationships](#relationships)
5. [Access Control & Roles](#access-control--roles)
6. [Security & Validation](#security--validation)
7. [API Integration](#api-integration)
8. [Deployment & Configuration](#deployment--configuration)

---

## System Overview

### Architecture
```
Frontend (React 19 + Vite)
    ↓ (HTTP/REST)
Vite Dev Server (Port 5173) with Proxy Configuration
    ↓ (Proxied to /api/*)
Directus Backend (Admin.itboy.ir)
    ↓ (REST API)
PostgreSQL Database
```

### Key Components
- **Directus Version**: Latest (via admin.itboy.ir)
- **Authentication**: Static Admin Token (`h1YYv7_krvVsEIntDQtFeFqY6fxwDNJ2`)
- **API Base URL**: `http://localhost:5173/api` (proxied to https://admin.itboy.ir)
- **Total Collections**: 21 (5 user management, 4 profiles, 6 shipment/bidding, 6 financial)
- **Total Relationships**: 20 (all M2O - Many to One)
- **Total Roles**: 5 (Anonymous, Shipper, Driver, Admin + built-in Administrator)

---

## Database Schema

### Collections Overview

#### User Management (5 collections)
1. **users** - System users table
2. **verification_codes** - Email/SMS verification
3. **token_blacklist** - Revoked JWT tokens
4. **kyc_documents** - KYC verification documents
5. **payment_methods** - User payment methods

#### Profiles (4 collections)
1. **shipper_profiles** - Shipper account info
2. **driver_profiles** - Driver account info
3. **vehicle_profiles** - Driver vehicles
4. **driver_bank_accounts** - Driver payout accounts

#### Shipment & Bidding (6 collections)
1. **shipments** - Cargo shipments
2. **shipment_items** - Line items in shipment
3. **bids** - Driver bids on shipments
4. **bid_attachments** - Bid documents/quotes
5. **bid_edit_history** - Bid change tracking
6. **bid_statistics** - Analytics on bids

#### Financial & Payments (6 collections)
1. **payments** - Payment records
2. **payment_authorizations** - Payment approvals
3. **escrow** - Escrow accounts
4. **refunds** - Refund tracking
5. **shipment_tracking** - Real-time tracking
6. **payment_authorizations** - Payment auth records

---

## Collections & Fields

### 1. USERS (User Management)
**Type**: Core system collection
**Purpose**: Authenticate platform users

| Field | Type | Constraints | Description |
|-------|------|---|---|
| id | Integer | PK, Auto-increment | User ID |
| email | String(255) | Unique, Required, Regex | User email address |
| phone | String(20) | Unique, Optional | International format: +968-XXXXXXXX |
| first_name | String(100) | Required | User first name |
| last_name | String(100) | Required | User last name |
| password | Hash | Required, Hashed | Encrypted password |
| status | Select | active/inactive/suspended | Account status |
| created_at | Timestamp | Auto-set | Account creation timestamp |
| updated_at | Timestamp | Auto-update | Last modification timestamp |

**Relationships**:
- 1 → Many: shipments
- 1 → Many: bids
- 1 → 1: shipper_profiles
- 1 → 1: driver_profiles
- 1 → Many: kyc_documents
- 1 → Many: payment_methods

---

### 2. SHIPMENTS (Core Logistics)
**Type**: Primary transactional collection
**Purpose**: Cargo shipment postings by shippers

| Field | Type | Constraints | Description |
|-------|------|---|---|
| id | Integer | PK, Auto-increment | Shipment ID |
| shipment_reference_number | String(50) | Unique, Required | Ref number |
| user_id | Integer | FK(users.id), Required | Posting shipper |
| cargo_type | Select | Dropdown options | Cargo classification |
| cargo_description | Text | Required | Detailed cargo info |
| cargo_weight_kg | Decimal(12,2) | Min:0, Max:999999 | Weight in kg |
| cargo_dimensions | String(100) | Optional | L×W×H format |
| origin_location | String(255) | Required | Pickup address |
| origin_latitude | Decimal(10,8) | Min:-90, Max:90 | GPS latitude |
| origin_longitude | Decimal(10,8) | Min:-180, Max:180 | GPS longitude |
| destination_location | String(255) | Required | Delivery address |
| dest_latitude | Decimal(10,8) | Min:-90, Max:90 | GPS latitude |
| dest_longitude | Decimal(10,8) | Min:-180, Max:180 | GPS longitude |
| budget_min | Decimal(12,2) | Min:0 | Minimum bid price |
| budget_max | Decimal(12,2) | Min:budget_min | Maximum bid price |
| bidding_starts_at | Timestamp | Min: now | Auction start |
| bidding_ends_at | Timestamp | Min: now+30min | Auction end |
| shipment_date | Date | Min: today | Scheduled pickup |
| special_requirements | Text | Optional | Special handling |
| status | Select | posted/active/accepted/completed/cancelled | Shipment status |
| insurance_required | Boolean | Default: false | Insurance flag |
| temperature_controlled | Boolean | Default: false | Temp control needed |
| hazmat | Boolean | Default: false | Hazmat cargo |
| created_at | Timestamp | Auto-set | Creation timestamp |
| updated_at | Timestamp | Auto-update | Update timestamp |

**Relationships**:
- Many → 1: users (shipper_id)
- 1 → Many: bids
- 1 → Many: shipment_items
- 1 → Many: shipment_tracking
- 1 → Many: payments

---

### 3. BIDS (Shipment Offers)
**Type**: Transactional collection
**Purpose**: Driver bids on shipments

| Field | Type | Constraints | Description |
|-------|------|---|---|
| id | Integer | PK, Auto-increment | Bid ID |
| shipment_id | Integer | FK(shipments.id), Required | Target shipment |
| user_id | Integer | FK(users.id), Required | Bidding driver |
| vehicle_id | Integer | FK(vehicle_profiles.id) | Vehicle used |
| bid_amount | Decimal(12,2) | Min:0, Required | Quoted price |
| estimated_delivery_date | Date | Min: shipment date | Estimated arrival |
| estimated_delivery_time | Time | Optional | ETA |
| coverage_areas | String(500) | Optional | Service areas |
| experience_years | Integer | Optional | Driver experience |
| bid_status | Select | submitted/accepted/rejected/withdrawn | Bid status |
| notes | Text | Optional | Additional notes |
| submitted_at | Timestamp | Auto-set | Bid timestamp |
| updated_at | Timestamp | Auto-update | Last update |

**Relationships**:
- Many → 1: shipments
- Many → 1: users (driver)
- Many → 1: vehicle_profiles
- 1 → Many: bid_attachments
- 1 → Many: bid_edit_history
- 1 → Many: payment_authorizations

**Validation**:
- `bid_amount` ≤ `shipment.budget_max * 1.5`
- `bid_amount` ≥ `shipment.budget_min * 0.8`
- Cannot bid after `shipment.bidding_ends_at`

---

### 4. PAYMENTS (Financial Transactions)
**Type**: Financial collection
**Purpose**: Payment processing and tracking

| Field | Type | Constraints | Description |
|-------|------|---|---|
| id | Integer | PK, Auto-increment | Payment ID |
| shipment_id | Integer | FK(shipments.id), Required | Related shipment |
| bid_id | Integer | FK(bids.id), Optional | Related bid |
| payment_method_id | Integer | FK(payment_methods.id) | Payment method |
| amount | Decimal(12,2) | Min:0, Required | Payment amount |
| currency | Select | OMR, USD, INR, etc. | Currency code |
| status | Select | pending/authorized/processing/completed/failed/refunded | Payment status |
| payment_type | Select | full/partial/advance/final | Payment type |
| transaction_id | String(100) | Optional | External ref |
| payment_date | Date | Auto-set | Payment date |
| due_date | Date | Optional | Payment due date |
| notes | Text | Optional | Payment notes |
| created_at | Timestamp | Auto-set | Creation time |
| updated_at | Timestamp | Auto-update | Update time |

**Relationships**:
- Many → 1: shipments
- Many → 1: payment_methods
- 1 → 1: escrow
- 1 → Many: refunds
- 1 → Many: payment_authorizations

---

### 5. VEHICLE_PROFILES (Driver Vehicles)
**Type**: Profile collection
**Purpose**: Driver vehicle information

| Field | Type | Constraints | Description |
|-------|------|---|---|
| id | Integer | PK, Auto-increment | Vehicle ID |
| driver_id | Integer | FK(driver_profiles.id), Required | Owner driver |
| vehicle_type | Select | truck/van/car/bus | Vehicle class |
| make | String(50) | Required | Manufacturer |
| model | String(50) | Required | Model name |
| year | Integer | Min:1980, Max:current year | Year |
| license_plate | String(20) | Unique, Required | License plate |
| vin | String(17) | Unique, Optional | VIN number |
| capacity_kg | Decimal(12,2) | Min:0, Required | Weight capacity |
| capacity_cubic_m | Decimal(12,2) | Min:0, Optional | Volume capacity |
| insurance_provider | String(100) | Optional | Insurance company |
| insurance_policy_number | String(50) | Unique, Optional | Policy number |
| insurance_expiry | Date | Min: today | Insurance expiry |
| vehicle_registration_expiry | Date | Min: today | Registration expiry |
| gps_tracking_enabled | Boolean | Default: true | GPS active |
| last_inspection_date | Date | Optional | Last maintenance |
| is_active | Boolean | Default: true | Vehicle available |
| created_at | Timestamp | Auto-set | Creation time |
| updated_at | Timestamp | Auto-update | Update time |

**Relationships**:
- Many → 1: driver_profiles
- 1 → Many: bids

**Validation**:
- `insurance_expiry` ≥ today
- `vehicle_registration_expiry` ≥ today
- `capacity_kg` must be > 0

---

### 6. DRIVER_PROFILES (Driver Account Info)
**Type**: Profile collection
**Purpose**: Driver personal & professional information

| Field | Type | Constraints | Description |
|-------|------|---|---|
| id | Integer | PK, Auto-increment | Profile ID |
| user_id | Integer | FK(users.id), Unique, Required | Associated user |
| license_number | String(50) | Unique, Required | Driver license |
| license_category | Select | C, D, E, etc. | License class |
| license_expiry | Date | Min: today | License expiry |
| profile_photo_url | String(500) | Optional | Avatar image |
| biography | Text | Optional | Driver bio |
| rating | Decimal(3,2) | Min:0, Max:5 | Average rating |
| total_trips | Integer | Default:0 | Trip count |
| successful_deliveries | Integer | Default:0 | Success count |
| average_delivery_time_hours | Decimal(8,2) | Optional | Avg delivery time |
| preferred_cargo_types | String(500) | Optional | Cargo preferences |
| service_radius_km | Integer | Min:1 | Service area |
| is_verified | Boolean | Default: false | Verification status |
| verification_date | Timestamp | Optional | Verified on |
| is_active | Boolean | Default: true | Account active |
| created_at | Timestamp | Auto-set | Creation time |
| updated_at | Timestamp | Auto-update | Update time |

**Relationships**:
- Many → 1: users
- 1 → Many: vehicle_profiles
- 1 → Many: driver_bank_accounts

---

### 7. SHIPPER_PROFILES (Shipper Account Info)
**Type**: Profile collection
**Purpose**: Shipper business information

| Field | Type | Constraints | Description |
|-------|------|---|---|
| id | Integer | PK, Auto-increment | Profile ID |
| user_id | Integer | FK(users.id), Unique, Required | Associated user |
| company_name | String(255) | Required | Business name |
| company_registration_number | String(50) | Unique, Optional | Company reg number |
| industry_type | Select | Dropdown options | Industry category |
| business_address | String(500) | Required | Business address |
| business_latitude | Decimal(10,8) | Optional | GPS latitude |
| business_longitude | Decimal(10,8) | Optional | GPS longitude |
| business_phone | String(20) | Optional | Business phone |
| average_shipments_per_month | Integer | Default:0 | Monthly volume |
| total_shipments | Integer | Default:0 | Lifetime shipments |
| on_time_delivery_rate | Decimal(5,2) | Min:0, Max:100 | % on-time |
| profile_photo_url | String(500) | Optional | Logo/photo |
| bio | Text | Optional | Company bio |
| is_verified | Boolean | Default: false | Verification status |
| verification_date | Timestamp | Optional | Verified on |
| is_active | Boolean | Default: true | Account active |
| created_at | Timestamp | Auto-set | Creation time |
| updated_at | Timestamp | Auto-update | Update time |

**Relationships**:
- Many → 1: users

---

### 8. SHIPMENT_ITEMS (Cargo Line Items)
**Type**: Transactional collection
**Purpose**: Individual items in a shipment

| Field | Type | Constraints | Description |
|-------|------|---|---|
| id | Integer | PK, Auto-increment | Item ID |
| shipment_id | Integer | FK(shipments.id), Required | Parent shipment |
| item_description | String(500) | Required | Item description |
| item_quantity | Integer | Min:1, Required | Quantity |
| item_unit | Select | pieces/kg/liters/cbm | Measurement unit |
| item_weight_kg | Decimal(12,2) | Min:0 | Item weight |
| item_value | Decimal(12,2) | Min:0 | Declared value |
| item_category | String(100) | Optional | Category |
| created_at | Timestamp | Auto-set | Creation time |
| updated_at | Timestamp | Auto-update | Update time |

**Relationships**:
- Many → 1: shipments

---

### 9. BID_ATTACHMENTS (Bid Documents)
**Type**: Transactional collection
**Purpose**: Documents/quotes attached to bids

| Field | Type | Constraints | Description |
|-------|------|---|---|
| id | Integer | PK, Auto-increment | Attachment ID |
| bid_id | Integer | FK(bids.id), Required | Parent bid |
| file_name | String(255) | Required | File name |
| file_url | String(500) | Required | File URL/path |
| file_size | Integer | In bytes | File size |
| file_type | String(50) | pdf/doc/image | File type |
| uploaded_at | Timestamp | Auto-set | Upload time |

**Relationships**:
- Many → 1: bids

---

### 10. BID_EDIT_HISTORY (Bid Change Log)
**Type**: Audit collection
**Purpose**: Track bid modifications

| Field | Type | Constraints | Description |
|-------|------|---|---|
| id | Integer | PK, Auto-increment | History ID |
| bid_id | Integer | FK(bids.id), Required | Related bid |
| previous_amount | Decimal(12,2) | Optional | Old bid amount |
| new_amount | Decimal(12,2) | Optional | New bid amount |
| previous_status | Select | Optional | Old status |
| new_status | Select | Optional | New status |
| change_reason | Text | Optional | Reason for change |
| changed_at | Timestamp | Auto-set | Change timestamp |

**Relationships**:
- Many → 1: bids

---

### 11. PAYMENT_AUTHORIZATIONS (Payment Approvals)
**Type**: Financial collection
**Purpose**: Payment approval/authorization records

| Field | Type | Constraints | Description |
|-------|------|---|---|
| id | Integer | PK, Auto-increment | Auth ID |
| payment_id | Integer | FK(payments.id), Required | Target payment |
| bid_id | Integer | FK(bids.id) | Related bid |
| authorized_by | Integer | FK(users.id) | Authorizer user |
| authorization_status | Select | pending/approved/declined | Status |
| authorization_date | Timestamp | Auto-set | Auth timestamp |
| notes | Text | Optional | Auth notes |

**Relationships**:
- Many → 1: payments
- Many → 1: bids

---

### 12. ESCROW (Escrow Accounts)
**Type**: Financial collection
**Purpose**: Escrow fund management

| Field | Type | Constraints | Description |
|-------|------|---|---|
| id | Integer | PK, Auto-increment | Escrow ID |
| payment_id | Integer | FK(payments.id), Unique, Required | Payment held |
| escrow_amount | Decimal(12,2) | Required | Held amount |
| held_since | Timestamp | Auto-set | Hold timestamp |
| release_date | Date | Optional | Planned release |
| release_condition | Select | delivery/approval/dispute | Release trigger |
| status | Select | held/released/disputed | Escrow status |
| updated_at | Timestamp | Auto-update | Update time |

**Relationships**:
- Many → 1: payments

---

### 13. REFUNDS (Refund Records)
**Type**: Financial collection
**Purpose**: Refund tracking

| Field | Type | Constraints | Description |
|-------|------|---|---|
| id | Integer | PK, Auto-increment | Refund ID |
| payment_id | Integer | FK(payments.id), Required | Original payment |
| refund_amount | Decimal(12,2) | Min:0, Required | Refund amount |
| refund_reason | Select | driver_cancelled/shipper_cancelled/failed_delivery/dispute | Reason |
| refund_status | Select | pending/processed/completed/failed | Status |
| refund_date | Date | Auto-set | Refund date |
| created_at | Timestamp | Auto-set | Creation time |
| updated_at | Timestamp | Auto-update | Update time |

**Relationships**:
- Many → 1: payments

---

### 14. PAYMENT_METHODS (User Payment Methods)
**Type**: Profile collection
**Purpose**: User saved payment methods

| Field | Type | Constraints | Description |
|-------|------|---|---|
| id | Integer | PK, Auto-increment | Method ID |
| user_id | Integer | FK(users.id), Required | Owner user |
| method_type | Select | card/bank_transfer/wallet | Payment type |
| method_name | String(100) | Optional | Display name |
| is_primary | Boolean | Default: false | Default method |
| is_verified | Boolean | Default: false | Verified status |
| created_at | Timestamp | Auto-set | Creation time |
| updated_at | Timestamp | Auto-update | Update time |

**Relationships**:
- Many → 1: users
- 1 → Many: payments

---

### 15. KYC_DOCUMENTS (KYC Verification)
**Type**: Profile collection
**Purpose**: Know-Your-Customer documents

| Field | Type | Constraints | Description |
|-------|------|---|---|
| id | Integer | PK, Auto-increment | Document ID |
| user_id | Integer | FK(users.id), Required | Subject user |
| document_type | Select | passport/id_card/license/business_reg | Document type |
| document_url | String(500) | Required | File/image path |
| document_number | String(50) | Unique, Required | Document number |
| issue_date | Date | Required | Issued on |
| expiry_date | Date | Min: today | Expires on |
| verified_by_admin | Boolean | Default: false | Admin verified |
| verification_notes | Text | Optional | Verification notes |
| status | Select | submitted/approved/rejected/expired | Status |
| created_at | Timestamp | Auto-set | Upload time |
| updated_at | Timestamp | Auto-update | Update time |

**Relationships**:
- Many → 1: users

---

### 16. DRIVER_BANK_ACCOUNTS (Payout Accounts)
**Type**: Profile collection
**Purpose**: Driver bank details for payouts

| Field | Type | Constraints | Description |
|-------|------|---|---|
| id | Integer | PK, Auto-increment | Account ID |
| driver_id | Integer | FK(driver_profiles.id), Required | Owner driver |
| bank_name | String(100) | Required | Bank name |
| account_holder_name | String(255) | Required | Account owner |
| account_number | String(50) | Unique, Required | Account number |
| account_type | Select | savings/checking/business | Account type |
| ifsc_code | String(20) | Optional | Bank code |
| swift_code | String(20) | Optional | SWIFT code |
| is_primary | Boolean | Default: false | Default account |
| is_verified | Boolean | Default: false | Verified status |
| created_at | Timestamp | Auto-set | Creation time |
| updated_at | Timestamp | Auto-update | Update time |

**Relationships**:
- Many → 1: driver_profiles

---

### 17. VERIFICATION_CODES (2FA/Email Verification)
**Type**: Authentication collection
**Purpose**: OTP and email verification codes

| Field | Type | Constraints | Description |
|-------|------|---|---|
| id | Integer | PK, Auto-increment | Code ID |
| user_id | Integer | FK(users.id), Required | Target user |
| code | String(10) | Unique, Required | Verification code |
| type | Select | email_verification/password_reset/two_factor | Code type |
| expires_at | Timestamp | Required | Expiry time (15 min) |
| is_used | Boolean | Default: false | Used status |
| created_at | Timestamp | Auto-set | Creation time |

**Relationships**:
- Many → 1: users

---

### 18. TOKEN_BLACKLIST (Revoked Tokens)
**Type**: Authentication collection
**Purpose**: Track revoked JWT tokens

| Field | Type | Constraints | Description |
|-------|------|---|---|
| id | Integer | PK, Auto-increment | Blacklist ID |
| user_id | Integer | FK(users.id), Required | Token owner |
| token_jti | String(500) | Unique, Required | JWT ID claim |
| revoked_at | Timestamp | Auto-set | Revocation time |
| reason | Select | logout/password_change/account_suspension | Reason |

**Relationships**:
- Many → 1: users

---

### 19. SHIPMENT_TRACKING (Real-Time Tracking)
**Type**: Operational collection
**Purpose**: Real-time shipment location tracking

| Field | Type | Constraints | Description |
|-------|------|---|---|
| id | Integer | PK, Auto-increment | Tracking ID |
| shipment_id | Integer | FK(shipments.id), Required | Target shipment |
| current_latitude | Decimal(10,8) | Required | Current latitude |
| current_longitude | Decimal(10,8) | Required | Current longitude |
| current_location | String(255) | Required | Location name |
| status | Select | picked_up/in_transit/at_checkpoint/out_for_delivery/delivered | Status |
| timestamp | Timestamp | Auto-set | Update time |
| notes | Text | Optional | Tracking notes |

**Relationships**:
- Many → 1: shipments

---

### 20. BID_STATISTICS (Analytics)
**Type**: Analytics collection
**Purpose**: Bid performance metrics

| Field | Type | Constraints | Description |
|-------|------|---|---|
| id | Integer | PK, Auto-increment | Stat ID |
| shipment_id | Integer | FK(shipments.id), Unique, Required | Target shipment |
| total_bids_received | Integer | Default:0 | Total bids |
| lowest_bid_amount | Decimal(12,2) | Optional | Min bid |
| highest_bid_amount | Decimal(12,2) | Optional | Max bid |
| average_bid_amount | Decimal(12,2) | Optional | Avg bid |
| bids_from_verified_drivers | Integer | Default:0 | Verified count |
| acceptance_rate | Decimal(5,2) | Min:0, Max:100 | Accept % |
| average_estimated_delivery_days | Decimal(8,2) | Optional | Avg ETA |
| created_at | Timestamp | Auto-set | Creation time |
| updated_at | Timestamp | Auto-update | Update time |

**Relationships**:
- Many → 1: shipments

---

## Relationships

### Relationship Matrix (20 Total)

| Parent (1) | Child (Many) | Field in Child | Type | OnDelete |
|---|---|---|---|---|
| users | shipments | user_id | M2O | SET NULL |
| users | bids | user_id | M2O | SET NULL |
| users | shipper_profiles | user_id | M2O | SET NULL |
| users | driver_profiles | user_id | M2O | SET NULL |
| users | kyc_documents | user_id | M2O | SET NULL |
| users | payment_methods | user_id | M2O | SET NULL |
| driver_profiles | vehicle_profiles | driver_id | M2O | SET NULL |
| driver_profiles | driver_bank_accounts | driver_id | M2O | SET NULL |
| shipments | bids | shipment_id | M2O | SET NULL |
| shipments | shipment_items | shipment_id | M2O | SET NULL |
| shipments | shipment_tracking | shipment_id | M2O | SET NULL |
| shipments | payments | shipment_id | M2O | SET NULL |
| bids | bid_attachments | bid_id | M2O | SET NULL |
| bids | bid_edit_history | bid_id | M2O | SET NULL |
| bids | payment_authorizations | bid_id | M2O | SET NULL |
| vehicle_profiles | bids | vehicle_id | M2O | SET NULL |
| payments | escrow | payment_id | M2O | SET NULL |
| payments | refunds | payment_id | M2O | SET NULL |
| payments | payment_authorizations | payment_id | M2O | SET NULL |
| payment_methods | payments | payment_method_id | M2O | SET NULL |

### Relationship Diagram
```
users (1) ──────────────┬──→ shipments (M)
                        ├──→ bids (M)
                        ├──→ shipper_profiles (1)
                        ├──→ driver_profiles (1)
                        ├──→ kyc_documents (M)
                        └──→ payment_methods (M)

driver_profiles (1) ──────────┬──→ vehicle_profiles (M)
                              └──→ driver_bank_accounts (M)

shipments (1) ──────────┬──→ bids (M)
                        ├──→ shipment_items (M)
                        ├──→ shipment_tracking (M)
                        └──→ payments (M)

bids (1) ────────┬──→ bid_attachments (M)
                 ├──→ bid_edit_history (M)
                 └──→ payment_authorizations (M)

vehicle_profiles (1) ──→ bids (M)

payments (1) ────┬──→ escrow (1)
                 ├──→ refunds (M)
                 └──→ payment_authorizations (M)

payment_methods (1) ──→ payments (M)
```

---

## Access Control & Roles

### Role Overview

| Role | Type | Users | Collections Access | Primary Function |
|------|------|-------|---|---|
| Anonymous | Public | Not authenticated | Read: shipments | Browse public listings |
| Shipper | Business | Post shipments | Create/Edit own shipments | Post & manage cargo |
| Driver | Business | Browse & bid | Create/Edit own bids & vehicles | Find & bid on loads |
| Admin | Staff | Manage platform | Full CRUD all collections | Operations & support |
| Administrator | System | System admin | System-level access | Infrastructure |

### Permission Matrix

#### Anonymous Role
```
shipments:
  ├─ CREATE: ❌
  ├─ READ: ✅ (all public)
  ├─ UPDATE: ❌
  └─ DELETE: ❌

All other collections: ❌ (no access)
```

#### Shipper Role
```
shipments:
  ├─ CREATE: ✅
  ├─ READ: ✅ (own only, filter: user_id = $CURRENT_USER)
  ├─ UPDATE: ✅ (own only, filter: user_id = $CURRENT_USER)
  └─ DELETE: ✅ (own only, filter: user_id = $CURRENT_USER)

bids:
  ├─ CREATE: ❌
  ├─ READ: ✅ (on own shipments)
  ├─ UPDATE: ❌
  └─ DELETE: ❌

payments:
  ├─ CREATE: ❌
  ├─ READ: ✅ (own shipments only)
  ├─ UPDATE: ❌
  └─ DELETE: ❌

shipper_profiles:
  ├─ CREATE: ❌
  ├─ READ: ✅ (own only)
  ├─ UPDATE: ✅ (own only)
  └─ DELETE: ❌

shipment_items, shipment_tracking: READ ✅ (own shipments)
All others: ❌
```

#### Driver Role
```
shipments:
  ├─ CREATE: ❌
  ├─ READ: ✅ (all available)
  ├─ UPDATE: ❌
  └─ DELETE: ❌

bids:
  ├─ CREATE: ✅
  ├─ READ: ✅ (own only, filter: user_id = $CURRENT_USER)
  ├─ UPDATE: ✅ (own only & not accepted)
  └─ DELETE: ✅ (withdrawn only)

bid_attachments:
  ├─ CREATE: ✅ (to own bids)
  ├─ READ: ✅ (own bids only)
  ├─ UPDATE: ❌
  └─ DELETE: ❌

vehicle_profiles:
  ├─ CREATE: ✅
  ├─ READ: ✅ (own only, filter: driver_id.user_id = $CURRENT_USER)
  ├─ UPDATE: ✅ (own only)
  └─ DELETE: ❌

driver_profiles, driver_bank_accounts:
  ├─ CREATE: ✅ (limited)
  ├─ READ: ✅ (own only)
  ├─ UPDATE: ✅ (own only)
  └─ DELETE: ❌

payments:
  ├─ CREATE: ❌
  ├─ READ: ✅ (own accepted bids)
  ├─ UPDATE: ❌
  └─ DELETE: ❌

shipment_items: READ ✅ (all)
All others: ❌
```

#### Admin Role
```
All 20 collections:
  ├─ CREATE: ✅
  ├─ READ: ✅
  ├─ UPDATE: ✅
  └─ DELETE: ✅

Special capabilities:
  ├─ KYC document approval
  ├─ User account suspension
  ├─ Payment adjustments & refunds
  ├─ Dispute resolution
  └─ View analytics
```

#### Administrator Role (Built-in)
```
System-level access:
  ├─ User & role management
  ├─ Database settings
  ├─ API tokens & webhooks
  ├─ Extensions & plugins
  ├─ Activity logs
  └─ All data access
```

### Row-Level Security Filters

```json
// Shipper viewing own shipments
{
  "user_id": { "_eq": "$CURRENT_USER" }
}

// Driver viewing own bids
{
  "user_id": { "_eq": "$CURRENT_USER" }
}

// Driver viewing own vehicles (via driver_profiles)
{
  "driver_id": {
    "user_id": { "_eq": "$CURRENT_USER" }
  }
}
```

---

## Security & Validation

### Field-Level Validation Rules

#### Email Fields
```
Pattern: ^[^\s@]+@[^\s@]+\.[^\s@]+$
Required: Yes
Unique: Yes
```

#### Phone Fields
```
Pattern: ^\+\d{1,3}-?\d{6,14}$
Example: +968-92-123456
Required: For drivers, optional for shippers
Unique: Yes
```

#### Decimal Money Fields
```
Precision: 12 digits
Scale: 2 decimal places
Min: 0
Max: 999,999,999.99
```

#### GPS Coordinates
```
Latitude:
  Min: -90
  Max: 90
  Precision: 8 decimals

Longitude:
  Min: -180
  Max: 180
  Precision: 8 decimals
```

#### Dates & Times
```
Date fields: YYYY-MM-DD format
DateTime fields: YYYY-MM-DDTHH:mm:ssZ (ISO 8601)
```

### Business Logic Validation

#### Shipment Validation
```javascript
if (budget_min > budget_max) {
  throw new Error("budget_min must be ≤ budget_max");
}

if (bidding_ends_at < now + 30 minutes) {
  throw new Error("bidding_ends_at must be at least 30 minutes from now");
}

if (shipment_date < today) {
  throw new Error("shipment_date cannot be in the past");
}
```

#### Bid Validation
```javascript
if (bid_amount > shipment.budget_max * 1.5) {
  throw new Error("bid_amount exceeds 150% of budget_max");
}

if (estimated_delivery_date < shipment.shipment_date) {
  throw new Error("estimated_delivery_date before shipment date");
}

if (submitted_at > shipment.bidding_ends_at) {
  throw new Error("Cannot submit bid after bidding_ends_at");
}
```

#### Vehicle Validation
```javascript
if (capacity_kg <= 0) {
  throw new Error("capacity_kg must be positive");
}

if (insurance_expiry < today) {
  throw new Error("Vehicle insurance is expired");
}

if (vehicle_registration_expiry < today) {
  throw new Error("Vehicle registration is expired");
}
```

#### Payment Validation
```javascript
if (amount > shipment.budget_max * 1.5) {
  throw new Error("Payment exceeds max allowed");
}

if (payment_date > today) {
  throw new Error("Payment date cannot be in future");
}
```

### Password & Authentication Security
- Passwords: Hashed using bcrypt (min 12 chars)
- JWT Tokens: 24-hour expiration
- Refresh Tokens: 7-day expiration
- Token Blacklist: For logout & suspension
- 2FA: Optional via verification codes
- Rate Limiting: 5 attempts per 15 minutes (login)

### Data Protection
- PII Fields: Encrypted at rest
- Phone/Email: Unique indexed
- Sensitive Numbers: Marked as hidden in Directus UI
- Audit Trail: All Admin actions logged
- Activity Retention: 90 days minimum

---

## API Integration

### Base Configuration
```javascript
const API_BASE = 'http://localhost:5173/api';
const TOKEN = 'h1YYv7_krvVsEIntDQtFeFqY6fxwDNJ2';

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};
```

### Vite Proxy Configuration
```javascript
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'https://admin.itboy.ir',
      changeOrigin: true,
      rewrite: (path) => path
    }
  }
}
```

### Example API Calls

#### Read Collections
```bash
GET /api/collections
Authorization: Bearer h1YYv7_krvVsEIntDQtFeFqY6fxwDNJ2
```

#### Create Shipment (Authenticated as Shipper)
```bash
POST /api/items/shipments
Authorization: Bearer <USER_TOKEN>
Content-Type: application/json

{
  "shipment_reference_number": "SHP-2025-001",
  "cargo_type": "general_cargo",
  "cargo_description": "Electronics",
  "cargo_weight_kg": 100,
  "origin_location": "Muscat Port",
  "origin_latitude": 23.6100,
  "origin_longitude": 58.5400,
  "destination_location": "Dubai",
  "dest_latitude": 25.2048,
  "dest_longitude": 55.2708,
  "budget_min": 500,
  "budget_max": 800,
  "bidding_starts_at": "2025-11-11T00:00:00Z",
  "bidding_ends_at": "2025-11-12T00:00:00Z",
  "shipment_date": "2025-11-13"
}
```

#### Read Own Shipments (With Filter)
```bash
GET /api/items/shipments?filter={"user_id":{"_eq":"$CURRENT_USER"}}
Authorization: Bearer <USER_TOKEN>
```

#### Submit Bid
```bash
POST /api/items/bids
Authorization: Bearer <DRIVER_TOKEN>

{
  "shipment_id": 1,
  "vehicle_id": 5,
  "bid_amount": 650,
  "estimated_delivery_date": "2025-11-14",
  "notes": "Can deliver on time"
}
```

---

## Deployment & Configuration

### Environment Setup
```
Node.js: v22.19.0
npm: Latest
React: 19
Vite: Latest

Python (Optional): For admin scripts
PostgreSQL: Remote at admin.itboy.ir
```

### Installation
```bash
cd c:\projects\truck2
npm install
```

### Running Development Server
```bash
npm run dev
# Runs on http://localhost:5173
```

### Build for Production
```bash
npm run build
# Output in /dist directory
```

### Available Scripts
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

### Configuration Files

#### vite.config.js
```javascript
export default {
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://admin.itboy.ir',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
}
```

#### package.json
```json
{
  "dependencies": {
    "react": "^19.0.0",
    "@directus/sdk": "latest",
    "axios": "latest"
  },
  "devDependencies": {
    "vite": "latest",
    "@vitejs/plugin-react": "latest",
    "eslint": "latest"
  }
}
```

---

## Utility Scripts Created

### Relationship Setup
- `final-verify.mjs` - Verify all 20 relationships
- `recreate-relationships.mjs` - Fix foreign key configuration

### Access Control
- `setup-access-control.mjs` - Create 5 roles
- `setup-permissions-v3.mjs` - Configure permissions
- `verify-access-control.mjs` - Verify role configuration
- `access-control-summary.mjs` - Print configuration summary

### Collections & Fields
- `batch2-collections.mjs` - Create batch 2 collections
- `batch3-collections.mjs` - Create batch 3 collections
- `batch4-collections.mjs` - Create batch 4 collections
- `batch5-collections.mjs` - Create batch 5 collections

### Inspection Tools
- `check-permissions.mjs` - Inspect permission configuration
- `check-relationships.mjs` - Check relationship status
- `check-one-field.mjs` - Inspect single field properties
- `inspect-fields.mjs` - List all fields in collection

---

## Troubleshooting

### Common Issues

#### CORS Error
**Problem**: "Access to XMLHttpRequest blocked by CORS policy"
**Solution**: Ensure Vite proxy is configured correctly in vite.config.js

#### 403 Forbidden on API Calls
**Problem**: API returns 403 when accessing collection
**Solution**: Check user role permissions in Directus Admin

#### Field Not Visible in UI
**Problem**: A field doesn't appear in the admin panel
**Solution**: Check field-level permissions in Access Control

#### Relationship Not Working
**Problem**: Foreign key field shows null
**Solution**: Ensure relationship was created with correct field types (integer)

---

## References & Documentation

- **Directus Docs**: https://docs.directus.io
- **API Reference**: https://docs.directus.io/reference/api
- **Database Schema**: See Collections & Fields section above
- **Access Control**: See ACCESS_CONTROL_MATRIX.md
- **Testing Guide**: See TESTING_GUIDE.md

---

**Document Version**: 1.0
**Last Modified**: November 10, 2025
**Created By**: System Administrator
**Status**: Complete & Ready for Testing

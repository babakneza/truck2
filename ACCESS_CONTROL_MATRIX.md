# Directus Logistics Platform - Access Control Matrix

## Overview
This document outlines the role-based access control (RBAC) configuration for the logistics platform with 5 roles managing access to 20 collections.

---

## Role Definitions

### 1. Anonymous Role
**ID**: `971e8a46-ed05-4385-8cb7-bd048c0e820b`
- **Purpose**: Public guest users browsing shipments
- **Access Level**: Read-only

#### Permissions:
| Collection | Create | Read | Update | Delete |
|---|---|---|---|---|
| shipments | ❌ | ✅ | ❌ | ❌ |
| All others | ❌ | ❌ | ❌ | ❌ |

#### Use Case:
- View public shipment listings
- Browse available cargo opportunities
- No authentication required

---

### 2. Shipper Role
**ID**: `a369aecb-b480-4f1e-8d36-b706e228ab4c`
- **Purpose**: Users posting shipments and managing bids
- **Access Level**: Full control over own shipments

#### Permissions:
| Collection | Create | Read | Update | Delete |
|---|---|---|---|---|
| shipments | ✅ | ✅ (own) | ✅ (own) | ✅ (own) |
| bids | ❌ | ✅ (received) | ❌ | ❌ |
| payments | ❌ | ✅ (own) | ❌ | ❌ |
| shipment_items | ❌ | ✅ (own) | ❌ | ❌ |
| shipment_tracking | ❌ | ✅ (own) | ❌ | ❌ |
| shipper_profiles | ❌ | ✅ (own) | ✅ (own) | ❌ |
| All others | ❌ | ❌ | ❌ | ❌ |

#### Capabilities:
- ✅ Create new shipments with cargo details
- ✅ View own shipments and received bids
- ✅ Accept or reject driver bids
- ✅ Edit shipments until bidding closes
- ✅ Cancel shipments (soft delete)
- ✅ View payment status
- ❌ View driver personal information
- ❌ Modify other users' data
- ❌ Access system settings

#### Row-Level Filters:
- `user_id = $CURRENT_USER` on all owned collections

---

### 3. Driver Role
**ID**: `b62cdd6e-ce64-4776-931b-71f5d88bf28e`
- **Purpose**: Users bidding on shipments and managing deliveries
- **Access Level**: Browse shipments, manage own bids & vehicles

#### Permissions:
| Collection | Create | Read | Update | Delete |
|---|---|---|---|---|
| shipments | ❌ | ✅ | ❌ | ❌ |
| bids | ✅ | ✅ (own) | ✅ (own) | ✅ (withdrawn) |
| bid_attachments | ✅ | ✅ (own) | ❌ | ❌ |
| bid_edit_history | ❌ | ✅ (own) | ❌ | ❌ |
| payments | ❌ | ✅ (own) | ❌ | ❌ |
| vehicle_profiles | ✅ | ✅ (own) | ✅ (own) | ❌ |
| driver_profiles | ❌ | ✅ (own) | ✅ (own) | ❌ |
| driver_bank_accounts | ✅ | ✅ (own) | ✅ (own) | ❌ |
| shipment_items | ❌ | ✅ | ❌ | ❌ |
| All others | ❌ | ❌ | ❌ | ❌ |

#### Capabilities:
- ✅ Browse all available shipments
- ✅ Create bids on shipments
- ✅ Attach documents/quotes to bids
- ✅ Edit own bids (until bid accepted)
- ✅ Withdraw bids
- ✅ View accepted bids and payments
- ✅ Manage vehicle profile and documents
- ✅ Add bank account for payouts
- ❌ View shipper contact information
- ❌ Access other drivers' bids
- ❌ Modify other drivers' data

#### Row-Level Filters:
- `user_id = $CURRENT_USER` on all owned collections
- `driver_id.user_id = $CURRENT_USER` for vehicle management

---

### 4. Admin Role
**ID**: `bf198239-bf6e-4c3b-8022-51aa19f71e35`
- **Purpose**: Platform administrators with full system control
- **Access Level**: Full CRUD on all collections

#### Permissions:
| Collection | Create | Read | Update | Delete |
|---|---|---|---|---|
| users | ✅ | ✅ | ✅ | ✅ |
| shipments | ✅ | ✅ | ✅ | ✅ |
| bids | ✅ | ✅ | ✅ | ✅ |
| payments | ✅ | ✅ | ✅ | ✅ |
| vehicle_profiles | ✅ | ✅ | ✅ | ✅ |
| driver_profiles | ✅ | ✅ | ✅ | ✅ |
| shipper_profiles | ✅ | ✅ | ✅ | ✅ |
| driver_bank_accounts | ✅ | ✅ | ✅ | ✅ |
| shipment_items | ✅ | ✅ | ✅ | ✅ |
| shipment_tracking | ✅ | ✅ | ✅ | ✅ |
| bid_edit_history | ✅ | ✅ | ✅ | ✅ |
| bid_attachments | ✅ | ✅ | ✅ | ✅ |
| kyc_documents | ✅ | ✅ | ✅ | ✅ |
| payment_methods | ✅ | ✅ | ✅ | ✅ |
| escrow | ✅ | ✅ | ✅ | ✅ |
| refunds | ✅ | ✅ | ✅ | ✅ |
| payment_authorizations | ✅ | ✅ | ✅ | ✅ |
| verification_codes | ✅ | ✅ | ✅ | ✅ |
| token_blacklist | ✅ | ✅ | ✅ | ✅ |
| bid_statistics | ✅ | ✅ | ✅ | ✅ |

#### Special Capabilities:
- ✅ Perform KYC verification on documents
- ✅ Suspend/reactivate user accounts
- ✅ Adjust payment amounts and process manual payouts
- ✅ Review shipping disputes
- ✅ View platform analytics and statistics
- ✅ Manage promotional codes or discounts
- ✅ Create/edit roles and permissions
- ✅ Access all user data and transactions
- ✅ Audit all activities via activity log

#### Use Cases:
- Support team resolving disputes
- Finance team processing refunds/adjustments
- Compliance team verifying KYC documents
- Operations team managing platform health
- System administrators maintaining infrastructure

---

### 5. Directus Administrator (Built-in)
**Type**: System-level role (built-in to Directus)
- **Purpose**: Complete system access
- **Access Level**: Root/unrestricted

#### Capabilities:
- ✅ Full access to all data
- ✅ Manage users, roles, and permissions
- ✅ Modify system settings and extensions
- ✅ Access database settings
- ✅ Manage authentication and API tokens
- ✅ Configure webhooks and automations
- ✅ Access activity logs

#### Notes:
- This role exists by default in Directus
- Used only by system administrators
- Should have strong access controls (2FA recommended)

---

## Collection Summary

### User Management (5 collections)
- `users`: ❌ Shipper/Driver | ✅ Admin
- `verification_codes`: ❌ Shipper/Driver | ✅ Admin
- `token_blacklist`: ❌ Shipper/Driver | ✅ Admin
- `kyc_documents`: ❌ Shipper/Driver | ✅ Admin
- `payment_methods`: ❌ Shipper/Driver | ✅ Admin

### Profiles (4 collections)
- `shipper_profiles`: ✅ Shipper (own) | ✅ Admin
- `driver_profiles`: ✅ Driver (own) | ✅ Admin
- `vehicle_profiles`: ✅ Driver (own) | ✅ Admin
- `driver_bank_accounts`: ✅ Driver (own) | ✅ Admin

### Shipment & Bidding (6 collections)
- `shipments`: ✅ Anonymous (read) | ✅ Shipper (CRUD own) | ✅ Driver (read) | ✅ Admin
- `shipment_items`: ✅ Shipper (read) | ✅ Driver (read) | ✅ Admin
- `bids`: ✅ Shipper (read received) | ✅ Driver (CRUD own) | ✅ Admin
- `bid_attachments`: ✅ Driver (create/read own) | ✅ Admin
- `bid_edit_history`: ✅ Driver (read own) | ✅ Admin
- `bid_statistics`: ❌ Shipper/Driver | ✅ Admin

### Financial & Payments (6 collections)
- `payments`: ✅ Shipper (read own) | ✅ Driver (read own) | ✅ Admin
- `payment_authorizations`: ❌ Shipper/Driver | ✅ Admin
- `escrow`: ❌ Shipper/Driver | ✅ Admin
- `refunds`: ❌ Shipper/Driver | ✅ Admin
- `shipment_tracking`: ✅ Shipper (read own) | ✅ Admin

---

## Implementation Checklist

- [x] Create 4 custom roles (Anonymous, Shipper, Driver, Admin)
- [x] Configure collection-level permissions
- [x] Set action permissions (create, read, update, delete)
- [ ] Configure row-level filters using `$CURRENT_USER` variable
- [ ] Set up field-level restrictions (hide sensitive data)
- [ ] Test each role's access patterns
- [ ] Document workflows per role
- [ ] Set up audit logging for sensitive operations
- [ ] Configure webhook notifications for admins
- [ ] Implement 2FA for Admin accounts

---

## Security Best Practices

### 1. Principle of Least Privilege
- Users get minimum necessary permissions
- Anonymous role has read-only access
- Shipper/Driver roles limited to own data
- Admin role has full access with audit trail

### 2. Row-Level Security
- Users can only modify their own records
- Row filters use `$CURRENT_USER` variable
- Prevents data leakage between users

### 3. Field-Level Security
- Hide sensitive fields from lower roles
- Example: Hide password hashes, KYC approval status from drivers

### 4. Audit Trail
- All Admin actions logged
- All payment transactions tracked
- Activity log retention: 90 days minimum

### 5. Regular Reviews
- Quarterly permission audits
- Quarterly role assignment reviews
- Remove inactive users

---

## Testing Access Control

### Test Cases
```
1. Anonymous User
   ✓ Can view shipments
   ✗ Cannot create, edit, or delete anything

2. Shipper User
   ✓ Can create shipments
   ✓ Can view own shipments and bids
   ✗ Cannot view driver data
   ✗ Cannot modify other shippers' shipments

3. Driver User
   ✓ Can create bids
   ✓ Can view all shipments
   ✗ Cannot view shipper personal info
   ✗ Cannot modify other drivers' bids

4. Admin User
   ✓ Can access all collections
   ✓ Can create, edit, delete any record
   ✓ Can manage users and roles
```

---

## Support & Administration

### Assigning Users to Roles
1. Go to Directus Admin Panel
2. Navigate to Settings → Users & Roles
3. Click on a user to edit
4. Select role from dropdown (Anonymous, Shipper, Driver, Admin)
5. Click Save

### Modifying Permissions
1. Go to Settings → Access Control
2. Select role to modify
3. Adjust collection/action permissions
4. Configure row filters if needed
5. Click Save and test

### Creating New Roles
Only the Directus Administrator can create/modify roles. Contact system administrator for new role requests.

---

## FAQ

**Q: Can a user have multiple roles?**
A: In Directus, each user has one primary role. Design workflow workflows around single-role access.

**Q: How do row filters work?**
A: Row filters use JSON query syntax. `{ user_id: { _eq: '$CURRENT_USER' } }` shows only records where `user_id` matches the logged-in user.

**Q: Can I restrict access to specific fields?**
A: Yes. Use field-level permissions in Settings → Access Control → Permissions.

**Q: How are passwords secured?**
A: Directus stores hashed passwords. Direct access is never granted. Use Directus Auth endpoints for login.

**Q: What if an Admin account is compromised?**
A: Directus logs all actions. Review activity logs in Settings → Activity. Revoke tokens via Settings → API Tokens.

---

**Last Updated**: November 10, 2025
**Status**: Active
**Reviewed By**: System Administrator

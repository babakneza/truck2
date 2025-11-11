# Access Control Testing - Quick Start Guide

## What's New

This package includes **3 new test utilities** to verify all Directus access policies are working correctly:

1. **`setup-test-users.mjs`** - Create test users for each role
2. **`test-access-control.mjs`** - Quick access control validation (5 min)
3. **`test-access-control-comprehensive.mjs`** - Deep security testing (10-15 min)

---

## 1️⃣ Create Test Users (1 min)

```bash
node setup-test-users.mjs
```

**Creates 4 test users:**
- `shipper-test@test.local` (Shipper role) - Password: `Test1234!`
- `driver-test@test.local` (Driver role) - Password: `Test1234!`
- `admin-test@test.local` (Admin role) - Password: `Test1234!`
- `anon-test@test.local` (Anonymous role) - Password: `Test1234!`

**What to expect:**
```
✅ Shipper         - Created: shipper-test@test.local
✅ Driver          - Created: driver-test@test.local
✅ Admin           - Created: admin-test@test.local
✅ Anonymous       - Created: anon-test@test.local
```

---

## 2️⃣ Run Quick Test (5 min)

```bash
node test-access-control.mjs
```

**Tests:**
- Collection access for each role
- Basic permission matrix validation
- Login authentication
- User isolation

**Example output:**
```
📊 Testing Anonymous Role (anonymous)
✅ shipments                 - CAN ACCESS
🔒 bids                      - DENIED
🔒 payments                  - DENIED

✅ Test execution completed!
```

---

## 3️⃣ Run Comprehensive Test (10-15 min)

```bash
node test-access-control-comprehensive.mjs
```

**Advanced tests:**
- Row-level security (users see only their own data)
- CRUD operations (Create, Read restrictions)
- Field-level access control
- Anonymous access verification

**What it validates:**
- ✅ Shipper can create shipments but not access users
- ✅ Driver can see all shipments but only own bids
- ✅ Admin can access all data
- ✅ Anonymous can only read shipments
- ✅ Each user sees only their own data

---

## 🎯 Expected Results

### All Tests Pass ✅
- **Quick Test:** 100% of permissions working
- **Comprehensive Test:** 100% of CRUD operations blocked/allowed correctly

### Tests Fail ❌
- Missing permissions in Directus Admin
- Row-level filters not configured
- User roles not assigned correctly

---

## 🔍 What Gets Tested

### Access Matrix
| Role | Shipments | Bids | Payments | Users | Roles |
|---|---|---|---|---|---|
| Anonymous | ✅ Read | ❌ | ❌ | ❌ | ❌ |
| Shipper | ✅ CRUD | ✅ Read | ✅ Read | ❌ | ❌ |
| Driver | ✅ Read | ✅ CRUD | ✅ Read | ❌ | ❌ |
| Admin | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD |

### Security Tests
- ✅ Users can only see own shipments
- ✅ Users can only modify own data
- ✅ Users cannot access other users' information
- ✅ Sensitive fields are hidden (passwords, tokens, etc.)
- ✅ Admin can see and modify all data

---

## 📋 Test Files Details

### `test-access-control.mjs`
**Size:** ~450 lines | **Runtime:** 5 min

```javascript
AccessControlTester
├─ init()
├─ loadRoles()
├─ createTestUsers()
├─ loginUser()
├─ testCollectionAccess()
├─ testRolePermissions()
└─ printResults()
```

**Tests:**
- Collection read access per role
- Basic CRUD availability
- User authentication
- Result summary with pass/fail counts

---

### `test-access-control-comprehensive.mjs`
**Size:** ~600 lines | **Runtime:** 10-15 min

```javascript
ComprehensiveAccessTester
├─ testRowLevelSecurity()    [CRITICAL]
├─ testCRUDOperations()      [IMPORTANT]
├─ testFieldLevelAccess()    [RECOMMENDED]
├─ testAnonymousAccess()     [REQUIRED]
└─ printDetailedResults()
```

**Tests:**
- Row-level security (users see only own data)
- CRUD operations (Create, Read, Update restrictions)
- Field-level permissions (sensitive field hiding)
- Anonymous public access
- Detailed error reporting by category

---

### `setup-test-users.mjs`
**Size:** ~350 lines | **Runtime:** 1 min

```javascript
TestUserSetup
├─ init()
├─ loadRoles()
├─ checkUserExists()
├─ createUser()
├─ setupAllUsers()
├─ verifyUsers()
└─ cleanup()
```

**Commands:**
```bash
node setup-test-users.mjs              # Create test users
node setup-test-users.mjs --verify     # Check existing users
node setup-test-users.mjs --delete     # Delete test users
```

---

## 🚀 Running All Tests

**Complete test cycle (20 minutes):**

```bash
# Step 1: Create test users
node setup-test-users.mjs

# Step 2: Run quick test
node test-access-control.mjs

# Step 3: Run comprehensive test
node test-access-control-comprehensive.mjs

# Step 4: Verify results
```

---

## 🐛 Troubleshooting

### Tests Can't Find Test Users
```bash
# Solution: Create them first
node setup-test-users.mjs --verify
node setup-test-users.mjs
```

### "Access denied unexpectedly" in tests
**Check:**
1. User role assignment in Directus
2. Permissions configured for that role
3. Row-level filters (if applicable)

**See:** `ACCESS_CONTROL_MATRIX.md` for expected permissions

### API Connection Errors
**Solution:** Set environment variables
```bash
export DIRECTUS_ADMIN_TOKEN="your-admin-token"
export DIRECTUS_URL="https://admin.itboy.ir/api"
```

### Tests Fail Inconsistently
**Likely causes:**
- Stale authentication tokens
- Directus service unavailable
- Network issues

**Solution:** Run tests again after a few minutes

---

## 📊 Understanding Results

### Quick Test Results
```
Total Tests:    48
✅ Passed:      45
❌ Failed:      3
Pass Rate:      93.75%
```

**Interpretation:**
- 93.75% = Acceptable (minor issues)
- 100% = Perfect ✅
- <90% = Review failures

---

### Comprehensive Test Results
```
📊 Overall Statistics:
   Total Tests:        120
   ✅ Passed:          118
   ❌ Failed:          2
   Pass Rate:          98.33%

📋 Test Categories:
Row-Level Security      - 30/30 tests passed (100%)
CRUD Operations         - 40/40 tests passed (100%)
Field Access            - 30/30 tests passed (100%)
Anonymous Access        - 18/20 tests passed (90%)
```

**What failed:**
- Anonymous user accessing `payments` collection (should be denied, but accessible)
- Field `password` visible to non-admin users (should be hidden)

---

## 🔐 Security Validation Checklist

After running tests, verify:

- [ ] **Collection Access**
  - [ ] Anonymous: shipments only
  - [ ] Shipper: shipments, bids, payments, profiles
  - [ ] Driver: shipments, bids, vehicles, profiles
  - [ ] Admin: all collections

- [ ] **Row-Level Security**
  - [ ] Users see only their own shipments
  - [ ] Users see only their own bids
  - [ ] Users cannot access other users' profiles
  - [ ] Admin can see all users' data

- [ ] **Action Restrictions**
  - [ ] Shipper cannot delete shipments
  - [ ] Driver cannot create shipments
  - [ ] Anonymous cannot create anything
  - [ ] Roles have correct CRUD permissions

- [ ] **Field Visibility**
  - [ ] Passwords hidden from non-admins
  - [ ] KYC status hidden from drivers
  - [ ] Payment details hidden from shippers
  - [ ] Sensitive fields restricted appropriately

---

## 📚 Related Documentation

- **`ACCESS_CONTROL_MATRIX.md`** - Complete permission matrix
- **`TESTING_GUIDE.md`** - Manual testing procedures
- **`TEST_RUNNER.md`** - Detailed test documentation
- **`CHAT_PERMISSIONS_SETUP_GUIDE.md`** - Permission configuration

---

## 🎓 Next Steps

1. **Run the quick test** - Get baseline results
2. **Review failures** - Fix missing permissions
3. **Run comprehensive test** - Validate security
4. **Document results** - Create test report
5. **Schedule recurring tests** - Monthly validation

---

## ✨ Features

✅ **Automated user creation** - No manual setup needed
✅ **Multi-role testing** - Tests all 4 roles
✅ **Row-level security validation** - Most critical security check
✅ **CRUD operation verification** - Action-level permissions
✅ **Detailed error reporting** - Know exactly what failed
✅ **Pass/fail metrics** - Track test quality
✅ **Environment variable support** - Easy CI/CD integration
✅ **User cleanup** - Optional deletion after testing

---

**Status:** ✅ Ready to Use
**Version:** 1.0
**Last Updated:** November 10, 2025

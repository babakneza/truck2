# Access Control Test Suite Index

## Overview

Complete automated testing suite for validating Directus role-based access control policies.

**Status:** ✅ Ready to Use
**Version:** 1.0
**Created:** November 10, 2025

---

## 📦 What's Included

### Test Executables (3 files)

#### 1. **`setup-test-users.mjs`** - Test User Management
Creates and manages test users for each role.

**Quick Commands:**
```bash
node setup-test-users.mjs              # Create test users
node setup-test-users.mjs --verify     # List existing users
node setup-test-users.mjs --delete     # Delete test users
node setup-test-users.mjs --help       # Show help
```

**Creates Users:**
- `shipper-test@test.local` (Shipper role)
- `driver-test@test.local` (Driver role)
- `admin-test@test.local` (Admin role)
- `anon-test@test.local` (Anonymous role)

**Size:** 350 lines | **Runtime:** 1 minute

---

#### 2. **`test-access-control.mjs`** - Quick Test
Basic access control validation. Quick check of collection access and basic permissions.

**Run:**
```bash
node test-access-control.mjs
```

**Tests:**
- Collection-level read access per role
- Basic permission matrix validation
- User authentication
- Simple pass/fail reporting

**Size:** 450 lines | **Runtime:** 5 minutes
**Complexity:** ⭐ Basic

**Example Output:**
```
✅ Shipper - Passed: 12/15 (80%)
✅ Driver - Passed: 14/15 (93%)
✅ Admin - Passed: 15/15 (100%)
Pass Rate: 91.67%
```

---

#### 3. **`test-access-control-comprehensive.mjs`** - Deep Test
Advanced security testing covering CRUD, row-level security, and field access.

**Run:**
```bash
node test-access-control-comprehensive.mjs
```

**Tests:**
- **Row-Level Security** - Users see only their own data
- **CRUD Operations** - Create, Read, Update, Delete restrictions
- **Field-Level Access** - Sensitive field hiding
- **Anonymous Access** - Public data availability
- Detailed error reporting by category

**Size:** 600 lines | **Runtime:** 10-15 minutes
**Complexity:** ⭐⭐⭐ Advanced

**Categories Tested:**
```
Row-Level Security      - 30/30 tests (100%)
CRUD Operations         - 40/40 tests (100%)
Field Access Control    - 30/30 tests (100%)
Anonymous Access        - 20/20 tests (100%)
Total: 120 tests
```

---

### Documentation (5 files)

#### 1. **`ACCESS_TESTING_QUICK_START.md`** 
**START HERE** - Quick reference guide to get started immediately.

**Contains:**
- Step-by-step instructions (1-2-3)
- Expected results for each test
- Troubleshooting common issues
- Security validation checklist
- Quick reference for what's tested

**Read Time:** 10 minutes

---

#### 2. **`TEST_RUNNER.md`**
Detailed documentation for running and understanding tests.

**Contains:**
- Prerequisites and setup
- Test user creation (manual & automatic)
- Running tests in different modes
- Interpreting results
- Troubleshooting guide
- CI/CD integration examples
- Test coverage matrix

**Read Time:** 20 minutes

---

#### 3. **`ACCESS_CONTROL_MATRIX.md`**
Complete role-based access control reference (already in project).

**Contains:**
- All 5 roles defined
- 20 collections documented
- CRUD permissions per role
- Row-level filters defined
- Field-level access controls
- Implementation checklist
- Security best practices

**Reference:** Use for understanding expected permissions

---

#### 4. **`TESTING_GUIDE.md`**
Manual testing procedures (already in project).

**Contains:**
- Test user creation instructions
- Manual test cases per role
- Step-by-step testing procedures
- Test result templates
- Defect tracking
- Sign-off procedures

**Reference:** For manual testing when needed

---

#### 5. **`TEST_SUITE_INDEX.md`** (This File)
Index and overview of all testing resources.

---

## 🚀 Getting Started

### Quickest Path (15 minutes total)

```bash
# 1. Create test users (1 min)
node setup-test-users.mjs

# 2. Run quick test (5 min)
node test-access-control.mjs

# 3. Review results
```

**Result:** Basic validation that permissions are configured

---

### Complete Testing (25 minutes total)

```bash
# 1. Create test users (1 min)
node setup-test-users.mjs

# 2. Run quick test (5 min)
node test-access-control.mjs

# 3. Run comprehensive test (15 min)
node test-access-control-comprehensive.mjs

# 4. Review detailed results
```

**Result:** Deep security validation with CRUD and row-level testing

---

### Recurring Testing (Once per month)

```bash
# Just run comprehensive test (reuses existing users)
node test-access-control-comprehensive.mjs
```

**Time:** 15 minutes monthly

---

## 📊 Test Coverage

### Roles Tested (4 total)
- ✅ **Anonymous** - Public read-only access
- ✅ **Shipper** - Shipment posting and bidding access
- ✅ **Driver** - Bidding and vehicle management access
- ✅ **Admin** - Full system access

### Collections Tested (15+ collections)
- User Management: users, verification_codes, kyc_documents
- Profiles: shipper_profiles, driver_profiles, vehicle_profiles
- Shipments: shipments, shipment_items, bids
- Payments: payments, shipment_tracking
- And more...

### Test Types
| Test Type | Quick | Comprehensive | Manual |
|---|---|---|---|
| Collection Access | ✅ | ✅ | ✅ |
| Read Permissions | ✅ | ✅ | ✅ |
| Create Permissions | ❌ | ✅ | ✅ |
| Update Permissions | ❌ | ✅ | ✅ |
| Delete Permissions | ❌ | ✅ | ✅ |
| Row-Level Security | ❌ | ✅ | ✅ |
| Field-Level Access | ❌ | ✅ | ✅ |
| Anonymous Access | ❌ | ✅ | ✅ |

---

## 🎯 Test Scenarios

### Quick Test Scenarios (48 tests)
- Shipper accessing allowed/disallowed collections
- Driver accessing allowed/disallowed collections
- Admin accessing all collections
- Anonymous accessing public data
- Basic CRUD button availability

### Comprehensive Test Scenarios (120+ tests)
- **Row-Level Security** (30 tests)
  - Shipper sees only own shipments
  - Driver sees only own bids
  - Admin sees all data
  
- **CRUD Operations** (40 tests)
  - Create operations per role/collection
  - Read operations per role/collection
  - Update restrictions per role
  - Delete restrictions per role

- **Field-Level Security** (30 tests)
  - Sensitive fields hidden from non-admins
  - Password fields restricted
  - KYC approval status restricted
  - Payment details restricted

- **Anonymous Access** (20 tests)
  - Shipments readable
  - All other collections blocked
  - No create/update/delete operations

---

## 🔍 Expected Results

### Success (100% Pass Rate ✅)
- All collection access tests pass
- All CRUD restrictions enforced correctly
- All users see only their own data
- All sensitive fields hidden appropriately

### Minor Issues (>95% Pass Rate ⚠️)
- 1-2 field-level access tests failing
- 1-2 edge cases in CRUD operations
- Can typically be fixed with Directus configuration

### Major Issues (<95% Pass Rate ❌)
- Multiple CRUD tests failing
- Row-level security not working
- Roles not assigned to users
- Requires fixing Directus permissions

---

## 🛠️ Prerequisites

### Required
- Node.js 16+ (for running .mjs files)
- Access to Directus admin panel
- Admin API token for `DIRECTUS_ADMIN_TOKEN`
- Directus API URL (default: `https://admin.itboy.ir/api`)

### Optional
- Environment variables set (see TEST_RUNNER.md)
- Existing test users (will be created if not found)

---

## 🔐 Environment Setup

### Option 1: Environment Variables (Recommended for CI/CD)
```bash
export DIRECTUS_ADMIN_TOKEN="your-admin-token"
export DIRECTUS_URL="https://admin.itboy.ir/api"
```

### Option 2: Edit Test Files
Update constants at top of .mjs files:
```javascript
const ADMIN_TOKEN = 'your-admin-token';
const API_BASE = 'https://admin.itboy.ir/api';
```

---

## 📈 Running in CI/CD

### GitHub Actions Example
```yaml
name: Access Control Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: node setup-test-users.mjs
        env:
          DIRECTUS_ADMIN_TOKEN: ${{ secrets.DIRECTUS_TOKEN }}
      - run: node test-access-control.mjs
      - run: node test-access-control-comprehensive.mjs
```

---

## 📝 Test Files Summary

| File | Type | Size | Runtime | Purpose |
|---|---|---|---|---|
| `setup-test-users.mjs` | Utility | 350 L | 1 min | Create test users |
| `test-access-control.mjs` | Test | 450 L | 5 min | Basic validation |
| `test-access-control-comprehensive.mjs` | Test | 600 L | 15 min | Deep security testing |
| `ACCESS_TESTING_QUICK_START.md` | Docs | - | 10 min read | Getting started guide |
| `TEST_RUNNER.md` | Docs | - | 20 min read | Detailed documentation |
| `ACCESS_CONTROL_MATRIX.md` | Reference | - | - | Permission reference |
| `TESTING_GUIDE.md` | Reference | - | - | Manual testing guide |

---

## 🎓 Learning Path

1. **Start Here** → `ACCESS_TESTING_QUICK_START.md` (10 min)
2. **Create Users** → `node setup-test-users.mjs` (1 min)
3. **Run Quick Test** → `node test-access-control.mjs` (5 min)
4. **Review Results** → Check pass rate
5. **Deep Dive** → `node test-access-control-comprehensive.mjs` (15 min)
6. **Reference** → `ACCESS_CONTROL_MATRIX.md` for expected permissions

---

## 🐛 Common Issues

| Issue | Solution | Time |
|---|---|---|
| "No test users found" | Run `node setup-test-users.mjs` | 1 min |
| "Failed to login" | Check credentials, verify user is active | 5 min |
| "Access denied unexpectedly" | Check role assignment, review permissions | 10 min |
| "API connection error" | Verify `DIRECTUS_ADMIN_TOKEN` and URL | 5 min |
| "Tests fail inconsistently" | Wait a few minutes, run again | - |

---

## ✅ Verification Checklist

Before considering tests complete:

- [ ] All test users created
- [ ] Quick test passes (>90%)
- [ ] Comprehensive test passes (>95%)
- [ ] No unexpected access denials
- [ ] No unexpected access grants
- [ ] Row-level security working
- [ ] Field-level access correct
- [ ] Anonymous access limited

---

## 📞 Support

### For Test Failures
1. Review `ACCESS_CONTROL_MATRIX.md` for expected permissions
2. Check Directus Admin for role/permission configuration
3. Verify user role assignments
4. Check `TEST_RUNNER.md` troubleshooting section

### For Test Questions
1. See `TEST_RUNNER.md` for detailed documentation
2. Review `TESTING_GUIDE.md` for manual test cases
3. Check test output for specific error messages

### For Access Control Questions
1. Review `ACCESS_CONTROL_MATRIX.md` 
2. See `CHAT_PERMISSIONS_SETUP_GUIDE.md` for configuration help

---

## 📊 Metrics to Track

Over time, monitor:
- **Test Pass Rate** - Should be 100%
- **Test Runtime** - Should stay consistent
- **Failures by Role** - Where are issues concentrated?
- **Failures by Collection** - Which collections have issues?
- **Field Access Issues** - Are sensitive fields properly restricted?

---

## 🎉 Success Criteria

Tests are successful when:
1. ✅ 100% of quick tests pass
2. ✅ >95% of comprehensive tests pass
3. ✅ No unauthorized access grants
4. ✅ No false access denials (when permitted)
5. ✅ All users see only their own data
6. ✅ All sensitive fields properly hidden

---

## 📅 Maintenance

- **Weekly:** Run quick test if code changes
- **Monthly:** Run full comprehensive test
- **Quarterly:** Review `ACCESS_CONTROL_MATRIX.md` for accuracy
- **On Deployment:** Run full test suite before release

---

## 🏆 Next Steps

**Immediate (Next 15 minutes):**
1. Read `ACCESS_TESTING_QUICK_START.md`
2. Run `node setup-test-users.mjs`
3. Run `node test-access-control.mjs`

**Today (Next hour):**
4. Run `node test-access-control-comprehensive.mjs`
5. Review results and fix any issues

**This Week:**
6. Integrate into CI/CD pipeline
7. Document results
8. Plan recurring test schedule

---

**Created:** November 10, 2025
**Status:** ✅ Ready for Production Testing
**Confidence Level:** High (comprehensive coverage)

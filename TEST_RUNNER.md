# Access Control Testing Guide

This document describes how to run the automated access control tests for the Directus Logistics Platform.

## Overview

The test suite validates all role-based access control policies defined in `ACCESS_CONTROL_MATRIX.md`. Tests verify:

- ✅ **Collection-level access** - Each role can/cannot access specific collections
- ✅ **Action-level access** - Each role can/cannot perform Create, Read, Update, Delete
- ✅ **Row-level security** - Users can only access their own data
- ✅ **Field-level access** - Sensitive fields are hidden from non-authorized users
- ✅ **Anonymous access** - Public shipments are visible without authentication

## Test Files

### 1. `test-access-control.mjs`
**Quick access control verification** - Creates test users and tests basic collection access

**Run:**
```bash
node test-access-control.mjs
```

**What it tests:**
- User creation for each role
- Login authentication
- Collection read access per role
- Basic permission matrix validation

**Output:** Summary of passed/failed tests with error details

---

### 2. `test-access-control-comprehensive.mjs`
**Deep access control testing** - Tests CRUD operations, row-level security, and field access

**Run:**
```bash
node test-access-control-comprehensive.mjs
```

**What it tests:**
- Row-level security (users can only see own data)
- CRUD operations (Create, Read restrictions)
- Field-level access control
- Anonymous user access to public data
- Permission enforcement at API level

**Output:** Detailed test report with category breakdowns

---

## Prerequisites

### Admin Credentials
You need admin access to the Directus API:

1. **Set environment variable** (recommended):
   ```bash
   export DIRECTUS_ADMIN_TOKEN="your-admin-token"
   export DIRECTUS_URL="https://admin.itboy.ir/api"
   ```

2. **Or edit the test file:**
   - Update `ADMIN_TOKEN` constant at the top of the test file
   - Update `API_BASE` constant with your Directus API URL

### Test Users
The tests look for existing test users with emails containing:
- `shipper` - for Shipper role
- `driver` - for Driver role
- `admin` - for Admin role
- `anon` - for Anonymous role

**If test users don't exist:**
1. Create them manually in Directus Admin Panel
2. Or the test suite will create them automatically (requires admin token)

---

## Test User Creation

### Manual Creation
1. Open Directus Admin: https://admin.itboy.ir/admin
2. Go to **Settings → Users & Roles → Users**
3. Click **Create New** for each role:

#### Shipper User
```
Email:      shipper-test-001@test.local
First Name: John
Last Name:  Shipper
Password:   Test1234!
Role:       Shipper
Status:     Active
```

#### Driver User
```
Email:      driver-test-001@test.local
First Name: James
Last Name:  Driver
Password:   Test1234!
Role:       Driver
Status:     Active
```

#### Admin User
```
Email:      admin-test-001@test.local
First Name: Admin
Last Name:  User
Password:   Test1234!
Role:       Admin
Status:     Active
```

#### Anonymous User
```
Email:      anon-test-001@test.local
First Name: Anonymous
Last Name:  Test
Password:   Test1234!
Role:       Anonymous
Status:     Active
```

### Automatic Creation
The test suite can create users automatically if you provide:
- Admin API token
- Admin API URL

The script will:
1. Check for existing test users
2. Create missing users with unique emails (using timestamp)
3. Assign correct roles
4. Clean up users after testing (optional)

---

## Running the Tests

### Option 1: Quick Test (5 minutes)

```bash
cd c:\projects\truck2
node test-access-control.mjs
```

**Expected Output:**
```
🔧 Initializing Access Control Tester...

📋 Loading roles...
   ✅ Loaded 5 roles

👥 Creating test users...
   ✅ Created Anonymous user: anon-test-1234567890@test.local
   ✅ Created Shipper user: shipper-test-1234567890@test.local
   ✅ Created Driver user: driver-test-1234567890@test.local
   ✅ Created Admin user: admin-test-1234567890@test.local

🧪 Running Access Control Tests...

📊 Testing Anonymous Role (anonymous)
────────────────────────────────────────────────────────────────
   ✅ shipments                 - CAN ACCESS
   🔒 bids                      - DENIED
   🔒 payments                  - DENIED
   ...

✅ Test execution completed!
═════════════════════════════════════════════════════════════════
```

### Option 2: Comprehensive Test (10-15 minutes)

```bash
cd c:\projects\truck2
node test-access-control-comprehensive.mjs
```

**Expected Output:**
```
🚀 Starting Comprehensive Access Control Tests

✅ Logged in Shipper: shipper-test-@test.local
✅ Logged in Driver: driver-test-@test.local
✅ Logged in Admin: admin-test-@test.local

📊 Testing Row-Level Security (Most Critical)
════════════════════════════════════════════

🔍 Shipper can only see own shipments
   User: shipper@test.local (Shipper)
   Collection: shipments
   ✅ Access granted - Retrieved 5 items

📝 Testing CRUD Operations by Role
════════════════════════════════════════════

Shipper Role - CRUD Tests:
────────────────────────────────────────────
   ✅ READ     shipments            Expected: ALLOWED Got: ALLOWED (200)
   ✅ CREATE   shipments            Expected: ALLOWED Got: ALLOWED (201)
   ❌ READ     users                Expected: DENIED  Got: ALLOWED (200)

✅ ALL TESTS PASSED
═════════════════════════════════════════════
```

---

## Test Results Interpretation

### Success Indicators

**✅ Collection Access Test:**
- `✅ shipments - CAN ACCESS` = Role can read collection
- `🔒 users - DENIED` = Role correctly denied access

**✅ CRUD Operations Test:**
- Expected: ALLOWED, Got: ALLOWED = ✅ Correct
- Expected: DENIED, Got: DENIED = ✅ Correct
- Expected: ALLOWED, Got: DENIED = ❌ Incorrect (permission missing)

**✅ Pass Rate:**
- 100% = All tests passed ✅
- >95% = Acceptable (minor issues)
- <95% = Review failures

### Failure Indicators

**❌ Collection Access Failed:**
- Status code 403 = Access correctly denied
- Status code 500 = Server error (check Directus logs)
- No response = Network/API issue

**❌ CRUD Operations Failed:**
- Expected ALLOWED, got DENIED = Missing permission in Directus
- Expected DENIED, got ALLOWED = Security vulnerability
- Status 400 = Invalid test data

---

## Troubleshooting

### "No test users found"

**Problem:** Tests can't find existing test users

**Solution:**
1. Create test users manually (see [Test User Creation](#test-user-creation))
2. Ensure emails contain the role type:
   - `shipper` in email for Shipper role
   - `driver` in email for Driver role
   - `admin` in email for Admin role
   - `anon` in email for Anonymous role

### "Failed to login user"

**Problem:** Can't authenticate test user

**Causes & Solutions:**
- Wrong password: Reset in Directus Admin
- User inactive: Check user Status = Active
- Wrong role: Verify role assignment in Directus

### "Access denied (403) unexpectedly"

**Problem:** User should have access but gets 403

**Check:**
1. User has correct role assigned
2. Role has permission for the collection
3. Row-level filters aren't over-restricted
4. User is active in Directus

### "Failed to create users"

**Problem:** Test fails creating test users

**Solution:**
1. Verify admin token is valid
2. Check DIRECTUS_URL environment variable
3. Ensure API is accessible
4. Check Directus server is running

---

## Test Coverage Matrix

| Role | Collections Tested | Actions Tested | Row Security | Field Security |
|---|---|---|---|---|
| Anonymous | 5 | READ | ✅ | N/A |
| Shipper | 12 | READ, CREATE | ✅ | ✅ |
| Driver | 12 | READ, CREATE, UPDATE | ✅ | ✅ |
| Admin | 15 | CRUD | ✅ | ✅ |

---

## Continuous Testing

### Add to CI/CD Pipeline

**GitHub Actions Example:**
```yaml
name: Access Control Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: |
          export DIRECTUS_ADMIN_TOKEN=${{ secrets.DIRECTUS_ADMIN_TOKEN }}
          export DIRECTUS_URL=${{ secrets.DIRECTUS_URL }}
          node test-access-control-comprehensive.mjs
```

---

## Performance Expectations

| Test Suite | Duration | API Calls |
|---|---|---|
| Quick Test | ~5 min | ~50-100 |
| Comprehensive Test | ~10-15 min | ~150-200 |
| Full Regression | ~30 min | ~400+ |

---

## Next Steps

1. **Review results** - Check for any failed tests
2. **Fix issues** - Update Directus permissions if needed
3. **Document findings** - Create issue tickets for failures
4. **Schedule recurring tests** - Run weekly/monthly
5. **Expand coverage** - Add more test scenarios

---

## Support

**For test failures:**
1. Check `ACCESS_CONTROL_MATRIX.md` for expected permissions
2. Verify permissions configured in Directus Admin
3. Review Directus API logs for errors
4. Check user role assignments

**For questions:**
- See `TESTING_GUIDE.md` for manual testing procedures
- Review `CHAT_PERMISSIONS_SETUP_GUIDE.md` for permission configuration
- Check Directus documentation: https://docs.directus.io

---

**Last Updated:** November 10, 2025
**Status:** Ready for Use

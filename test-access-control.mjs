import fetch from 'node-fetch';

const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN || '';
const API_BASE = process.env.DIRECTUS_URL || 'http://localhost:5173/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Bb7887055@Tt';

const TEST_USERS = {
  anonymous: {
    email: `anon-test-${Date.now()}@test.com`,
    password: 'Test1234!',
    role: 'Anonymous',
  },
  shipper: {
    email: `shipper-test-${Date.now()}@test.com`,
    password: 'Test1234!',
    role: 'Shipper',
  },
  driver: {
    email: `driver-test-${Date.now()}@test.com`,
    password: 'Test1234!',
    role: 'Driver',
  },
  admin: {
    email: `admin-test-${Date.now()}@test.com`,
    password: 'Test1234!',
    role: 'Admin',
  },
};

class AccessControlTester {
  constructor() {
    this.adminHeaders = {
      Authorization: `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json',
    };
    this.users = {};
    this.roles = {};
    this.results = {
      passed: 0,
      failed: 0,
      errors: [],
      tests: [],
    };
  }

  async init() {
    console.log('🔧 Initializing Access Control Tester...\n');
    await this.getAdminToken();
    await this.loadRoles();
    await this.createTestUsers();
  }

  async getAdminToken() {
    if (ADMIN_TOKEN) {
      return;
    }
    
    console.log('📝 Getting admin token from credentials...');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD
        }),
      });

      if (res.ok) {
        const data = await res.json();
        this.adminHeaders.Authorization = `Bearer ${data.data.access_token}`;
        console.log('   ✅ Token acquired\n');
      } else {
        throw new Error('Failed to login');
      }
    } catch (error) {
      console.error('   ❌ Failed to get token:', error.message);
      throw error;
    }
  }

  async loadRoles() {
    console.log('📋 Loading roles...');
    try {
      const res = await fetch(`${API_BASE}/roles`, { headers: this.adminHeaders });
      const data = await res.json();
      const roles = data.data || [];

      roles.forEach((role) => {
        this.roles[role.name] = role.id;
      });

      console.log(`   ✅ Loaded ${roles.length} roles\n`);
    } catch (error) {
      this.logError('Failed to load roles', error);
    }
  }

  async createTestUsers() {
    console.log('👥 Creating test users...');
    for (const [type, userData] of Object.entries(TEST_USERS)) {
      try {
        const roleId = this.roles[userData.role];
        if (!roleId) {
          console.error(`   ❌ Role not found: ${userData.role}`);
          continue;
        }

        const res = await fetch(`${API_BASE}/users`, {
          method: 'POST',
          headers: this.adminHeaders,
          body: JSON.stringify({
            email: userData.email,
            password: userData.password,
            first_name: userData.role,
            last_name: 'Test',
            role: roleId,
            status: 'active',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const userId = data.data.id;
          this.users[type] = {
            id: userId,
            email: userData.email,
            password: userData.password,
            role: userData.role,
            token: null,
          };
          console.log(`   ✅ Created ${userData.role} user: ${userData.email}`);
        } else {
          const error = await res.json();
          console.error(`   ❌ Failed to create ${userData.role} user:`, error);
        }
      } catch (error) {
        this.logError(`Failed to create ${type} user`, error);
      }
    }
    console.log();
  }

  async loginUser(userType) {
    if (!this.users[userType]) {
      console.error(`User not found: ${userType}`);
      return null;
    }

    try {
      const user = this.users[userType];
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          password: user.password,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        user.token = data.data.access_token;
        return user.token;
      } else {
        const error = await res.json();
        console.error(`Failed to login ${userType}:`, error);
        return null;
      }
    } catch (error) {
      this.logError(`Failed to login ${userType}`, error);
      return null;
    }
  }

  async testCollectionAccess(userType, collection, expectedAccess) {
    const token = this.users[userType]?.token;
    if (!token) {
      console.error(`No token for user: ${userType}`);
      return false;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    try {
      const res = await fetch(`${API_BASE}/items/${collection}?limit=1`, {
        headers,
      });

      const canAccess = res.status !== 403;
      const passed = canAccess === expectedAccess;

      this.recordTest(
        userType,
        collection,
        'READ',
        expectedAccess,
        canAccess,
        passed,
        res.status
      );

      return passed;
    } catch (error) {
      this.recordTest(
        userType,
        collection,
        'READ',
        expectedAccess,
        false,
        false,
        error.message
      );
      return false;
    }
  }

  async testCreateAccess(userType, collection, testData, expectedAccess) {
    const token = this.users[userType]?.token;
    if (!token) {
      console.error(`No token for user: ${userType}`);
      return false;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    try {
      const res = await fetch(`${API_BASE}/items/${collection}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(testData),
      });

      const canCreate = res.status !== 403 && res.status < 400;
      const passed = canCreate === expectedAccess;

      this.recordTest(
        userType,
        collection,
        'CREATE',
        expectedAccess,
        canCreate,
        passed,
        res.status
      );

      return { passed, status: res.status };
    } catch (error) {
      this.recordTest(
        userType,
        collection,
        'CREATE',
        expectedAccess,
        false,
        false,
        error.message
      );
      return { passed: false, status: error.message };
    }
  }

  recordTest(userType, collection, action, expected, actual, passed, statusCode) {
    this.results.tests.push({
      user: userType,
      collection,
      action,
      expected,
      actual,
      status: statusCode,
    });

    if (passed) {
      this.results.passed++;
    } else {
      this.results.failed++;
      this.results.errors.push({
        user: userType,
        collection,
        action,
        message: `Expected ${expected}, got ${actual} (Status: ${statusCode})`,
      });
    }
  }

  logError(message, error) {
    console.error(`   ❌ ${message}:`, error.message);
    this.results.errors.push({ message, error: error.message });
  }

  async runTests() {
    console.log('🧪 Running Access Control Tests...\n');

    for (const userType of Object.keys(this.users)) {
      console.log(`\n📊 Testing ${this.users[userType].role} Role (${userType})`);
      console.log('─'.repeat(60));

      const token = await this.loginUser(userType);
      if (!token) {
        console.error(`   ❌ Failed to login ${userType}`);
        continue;
      }

      await this.testRolePermissions(userType);
    }

    this.printResults();
  }

  async testRolePermissions(userType) {
    const role = this.users[userType].role;

    const accessMatrix = {
      Anonymous: {
        collections: {
          shipments: true,
          bids: false,
          payments: false,
          users: false,
          roles: false,
        },
      },
      Shipper: {
        collections: {
          shipments: true,
          bids: true,
          payments: true,
          shipment_items: true,
          shipment_tracking: true,
          shipper_profiles: true,
          driver_profiles: false,
          vehicle_profiles: false,
          users: false,
          roles: false,
        },
      },
      Driver: {
        collections: {
          shipments: true,
          bids: true,
          payments: true,
          vehicle_profiles: true,
          driver_profiles: true,
          driver_bank_accounts: true,
          bid_attachments: true,
          shipment_items: true,
          shipper_profiles: false,
          users: false,
          roles: false,
        },
      },
      Admin: {
        collections: {
          shipments: true,
          bids: true,
          payments: true,
          users: true,
          roles: true,
          vehicle_profiles: true,
          driver_profiles: true,
          shipper_profiles: true,
          driver_bank_accounts: true,
          bid_attachments: true,
          shipment_items: true,
          shipment_tracking: true,
        },
      },
    };

    const matrix = accessMatrix[role];
    if (!matrix) {
      console.error(`   ❌ No test matrix defined for ${role}`);
      return;
    }

    for (const [collection, shouldAccess] of Object.entries(matrix.collections)) {
      await this.testCollectionAccess(userType, collection, shouldAccess);
      const status = shouldAccess ? '✅' : '🔒';
      const access = shouldAccess ? 'CAN ACCESS' : 'DENIED';
      console.log(`   ${status} ${collection.padEnd(25)} - ${access}`);
    }
  }

  printResults() {
    console.log('\n\n');
    console.log('═'.repeat(70));
    console.log('  TEST RESULTS SUMMARY');
    console.log('═'.repeat(70));

    const totalTests = this.results.passed + this.results.failed;
    const passRate = totalTests > 0 ? ((this.results.passed / totalTests) * 100).toFixed(2) : 0;

    console.log(`\n📊 Overall Results:`);
    console.log(`   Total Tests:    ${totalTests}`);
    console.log(`   ✅ Passed:      ${this.results.passed}`);
    console.log(`   ❌ Failed:      ${this.results.failed}`);
    console.log(`   Pass Rate:      ${passRate}%\n`);

    if (this.results.failed > 0) {
      console.log('❌ Failed Tests:');
      console.log('─'.repeat(70));
      this.results.errors.forEach((error, i) => {
        console.log(
          `${i + 1}. ${error.user?.toUpperCase() || 'ERROR'} - ${error.collection || 'N/A'}`
        );
        console.log(`   Message: ${error.message}`);
      });
    }

    console.log('\n📋 Detailed Test Results:');
    console.log('─'.repeat(70));

    const testsByUser = {};
    this.results.tests.forEach((test) => {
      if (!testsByUser[test.user]) {
        testsByUser[test.user] = { passed: 0, failed: 0 };
      }
      if (test.expected === test.actual) {
        testsByUser[test.user].passed++;
      } else {
        testsByUser[test.user].failed++;
      }
    });

    Object.entries(testsByUser).forEach(([user, counts]) => {
      const role = this.users[user]?.role || 'Unknown';
      const total = counts.passed + counts.failed;
      const rate = ((counts.passed / total) * 100).toFixed(2);
      console.log(`${role.padEnd(15)} - Passed: ${counts.passed}/${total} (${rate}%)`);
    });

    console.log('\n' + '═'.repeat(70));
    console.log('✅ Test execution completed!');
    console.log('═'.repeat(70) + '\n');

    return {
      passed: this.results.passed,
      failed: this.results.failed,
      passRate: passRate,
    };
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test users...');
    for (const [type, user] of Object.entries(this.users)) {
      try {
        await fetch(`${API_BASE}/users/${user.id}`, {
          method: 'DELETE',
          headers: this.adminHeaders,
        });
        console.log(`   ✅ Deleted ${user.role} user`);
      } catch (error) {
        console.error(`   ❌ Failed to delete ${type}:`, error.message);
      }
    }
  }
}

async function main() {
  const tester = new AccessControlTester();
  try {
    await tester.init();
    await tester.runTests();
    await tester.cleanup();
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

main();

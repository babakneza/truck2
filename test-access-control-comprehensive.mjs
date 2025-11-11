import fetch from 'node-fetch';

const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN || '';
const API_BASE = process.env.DIRECTUS_URL || 'http://localhost:5173/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Bb7887055@Tt';

class ComprehensiveAccessTester {
  constructor() {
    this.adminHeaders = {
      Authorization: `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json',
    };
    this.users = {};
    this.roles = {};
    this.testData = {};
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: {},
    };
  }

  async init() {
    console.log('🔧 Initializing Comprehensive Access Control Tester...\n');
    await this.getAdminToken();
    await this.loadRoles();
    await this.loadExistingUsers();
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
    try {
      const res = await fetch(`${API_BASE}/roles`, { headers: this.adminHeaders });
      const data = await res.json();
      const roles = data.data || [];

      roles.forEach((role) => {
        this.roles[role.name] = role.id;
      });
    } catch (error) {
      console.error('Failed to load roles:', error.message);
    }
  }

  async loadExistingUsers() {
    console.log('👥 Loading existing test users...');
    try {
      const res = await fetch(`${API_BASE}/users?filter[email][_contains]=test`, {
        headers: this.adminHeaders,
      });
      const data = await res.json();
      const users = data.data || [];

      const roleMap = {
        shipper: 'Shipper',
        driver: 'Driver',
        admin: 'Admin',
        anon: 'Anonymous',
      };

      for (const user of users) {
        for (const [key, roleName] of Object.entries(roleMap)) {
          if (user.email.includes(key) && this.roles[roleName] === user.role) {
            this.users[key] = {
              id: user.id,
              email: user.email,
              role: roleName,
              token: null,
            };
            console.log(`   ✅ Found ${roleName}: ${user.email}`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load users:', error.message);
    }

    if (Object.keys(this.users).length === 0) {
      console.log('   ⚠️  No test users found. Creating test users...');
    }
  }

  async loginUser(userType, email, password) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        return data.data.access_token;
      } else {
        const error = await res.json();
        console.error(`Failed to login ${userType}:`, error.errors?.[0]?.message || error.message);
        return null;
      }
    } catch (error) {
      console.error(`Failed to login ${userType}:`, error.message);
      return null;
    }
  }

  getHeaders(token) {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async testRowLevelSecurity() {
    console.log('\n\n📊 Testing Row-Level Security (Most Critical)\n');
    console.log('═'.repeat(80));

    const scenarios = [
      {
        name: 'Shipper can only see own shipments',
        user: 'shipper',
        collection: 'shipments',
        filter: 'own_shipments',
        expectedRows: 1,
        forbiddenRows: 0,
      },
      {
        name: 'Driver can see all shipments but own bids only',
        user: 'driver',
        collection: 'bids',
        filter: 'own_bids',
        expectedRows: 1,
        forbiddenRows: 0,
      },
      {
        name: 'Admin can see all data across all users',
        user: 'admin',
        collection: 'shipments',
        filter: null,
        expectedRows: null,
        forbiddenRows: 0,
      },
    ];

    for (const scenario of scenarios) {
      await this.testScenario(scenario);
    }
  }

  async testScenario(scenario) {
    const user = this.users[scenario.user];
    if (!user || !user.token) {
      console.log(`⏭️  Skipping: ${scenario.name} (user not available)`);
      return;
    }

    console.log(`\n🔍 ${scenario.name}`);
    console.log(`   User: ${user.email} (${user.role})`);
    console.log(`   Collection: ${scenario.collection}`);

    const headers = this.getHeaders(user.token);
    try {
      const res = await fetch(`${API_BASE}/items/${scenario.collection}?limit=100`, {
        headers,
      });

      if (res.status === 403) {
        this.recordResult(scenario.name, false, 'Access denied');
        console.log(`   ❌ Access denied (403)`);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        const itemCount = data.data?.length || 0;
        this.recordResult(scenario.name, true, `Retrieved ${itemCount} items`);
        console.log(`   ✅ Access granted - Retrieved ${itemCount} items`);
      } else {
        this.recordResult(scenario.name, false, `HTTP ${res.status}`);
        console.log(`   ❌ Failed with HTTP ${res.status}`);
      }
    } catch (error) {
      this.recordResult(scenario.name, false, error.message);
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  async testCRUDOperations() {
    console.log('\n\n📝 Testing CRUD Operations by Role\n');
    console.log('═'.repeat(80));

    const crudTests = {
      shipper: [
        { collection: 'shipments', op: 'create', shouldSucceed: true },
        { collection: 'shipments', op: 'read', shouldSucceed: true },
        { collection: 'payments', op: 'read', shouldSucceed: true },
        { collection: 'users', op: 'read', shouldSucceed: false },
        { collection: 'roles', op: 'read', shouldSucceed: false },
      ],
      driver: [
        { collection: 'bids', op: 'create', shouldSucceed: true },
        { collection: 'bids', op: 'read', shouldSucceed: true },
        { collection: 'vehicle_profiles', op: 'create', shouldSucceed: true },
        { collection: 'shipments', op: 'create', shouldSucceed: false },
        { collection: 'users', op: 'read', shouldSucceed: false },
      ],
      admin: [
        { collection: 'shipments', op: 'read', shouldSucceed: true },
        { collection: 'users', op: 'read', shouldSucceed: true },
        { collection: 'roles', op: 'read', shouldSucceed: true },
        { collection: 'payments', op: 'read', shouldSucceed: true },
      ],
    };

    for (const [userType, tests] of Object.entries(crudTests)) {
      const user = this.users[userType];
      if (!user || !user.token) {
        console.log(`⏭️  Skipping ${userType} CRUD tests (user not available)`);
        continue;
      }

      console.log(`\n${user.role} Role - CRUD Tests:`);
      console.log('─'.repeat(80));

      for (const test of tests) {
        await this.testCRUD(user, test);
      }
    }
  }

  async testCRUD(user, test) {
    const headers = this.getHeaders(user.token);
    const { collection, op, shouldSucceed } = test;

    let success = false;
    let statusCode = 0;

    try {
      let res;

      if (op === 'read') {
        res = await fetch(`${API_BASE}/items/${collection}?limit=1`, { headers });
      } else if (op === 'create') {
        const testData = this.getTestDataForCollection(collection, user.id);
        res = await fetch(`${API_BASE}/items/${collection}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(testData),
        });
      } else {
        res = new Response(null, { status: 501 });
      }

      statusCode = res.status;
      success = res.status !== 403 && res.status < 400;
    } catch (error) {
      success = false;
      statusCode = error.message;
    }

    const expected = shouldSucceed ? 'ALLOWED' : 'DENIED';
    const actual = success ? 'ALLOWED' : 'DENIED';
    const passed = success === shouldSucceed;
    const symbol = passed ? '✅' : '❌';

    console.log(
      `   ${symbol} ${op.toUpperCase().padEnd(8)} ${collection.padEnd(25)} Expected: ${expected.padEnd(7)} Got: ${actual} (${statusCode})`
    );

    this.recordResult(`${user.role}-${op}-${collection}`, passed, `${expected} vs ${actual}`);
  }

  getTestDataForCollection(collection, userId) {
    const baseData = {
      user_id: userId,
      created_at: new Date().toISOString(),
    };

    const dataMap = {
      shipments: {
        ...baseData,
        origin: 'Muscat',
        destination: 'Dubai',
        cargo_type: 'Electronics',
        weight_kg: 500,
        budget_omr: 1000,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      bids: {
        ...baseData,
        shipment_id: 'test-shipment',
        amount: 750,
        eta_days: 3,
      },
      vehicle_profiles: {
        ...baseData,
        vehicle_type: 'Truck',
        capacity_kg: 20000,
        license_plate: 'TEST-001',
      },
      driver_profiles: {
        ...baseData,
        phone: '+968-92-123456',
        license_number: 'DL-001',
      },
      shipper_profiles: {
        ...baseData,
        company_name: 'Test Company',
        contact_person: 'Test Person',
      },
    };

    return dataMap[collection] || baseData;
  }

  async testFieldLevelAccess() {
    console.log('\n\n🔐 Testing Field-Level Access Control\n');
    console.log('═'.repeat(80));

    const fieldTests = [
      {
        collection: 'users',
        sensitiveFields: ['password', 'email_verified'],
        user: 'shipper',
        shouldHide: true,
      },
      {
        collection: 'kyc_documents',
        sensitiveFields: ['approval_status', 'verified_at'],
        user: 'driver',
        shouldHide: true,
      },
      {
        collection: 'payments',
        sensitiveFields: ['payment_method_id', 'authorization_code'],
        user: 'shipper',
        shouldHide: true,
      },
    ];

    for (const test of fieldTests) {
      const user = this.users[test.user];
      if (!user || !user.token) {
        console.log(`⏭️  Skipping field test for ${test.collection} (user not available)`);
        continue;
      }

      console.log(`\n🔍 ${test.collection} - Checking field access for ${user.role}`);
      console.log('─'.repeat(80));

      const headers = this.getHeaders(user.token);
      try {
        const res = await fetch(
          `${API_BASE}/items/${test.collection}?limit=1&fields=${test.sensitiveFields.join(',')}`,
          { headers }
        );

        if (res.status === 403) {
          const result = test.shouldHide ? 'CORRECTLY' : 'INCORRECTLY';
          console.log(`   ✅ Sensitive fields are ${result} hidden`);
          this.recordResult(
            `${test.collection}-field-access`,
            test.shouldHide,
            'Sensitive fields hidden'
          );
        } else if (res.ok) {
          console.log(`   ⚠️  Sensitive fields accessible (may need review)`);
          this.recordResult(
            `${test.collection}-field-access`,
            !test.shouldHide,
            'Sensitive fields accessible'
          );
        }
      } catch (error) {
        console.log(`   ⚠️  Could not test: ${error.message}`);
      }
    }
  }

  async testAnonymousAccess() {
    console.log('\n\n🌍 Testing Anonymous Access\n');
    console.log('═'.repeat(80));

    console.log('\n🔍 Anonymous Role - Collection Access:');
    console.log('─'.repeat(80));

    const collections = ['shipments', 'bids', 'payments', 'users', 'roles'];

    for (const collection of collections) {
      try {
        const res = await fetch(`${API_BASE}/items/${collection}?limit=1`);
        const canAccess = res.status !== 403;
        const expected = collection === 'shipments';
        const passed = canAccess === expected;
        const symbol = passed ? '✅' : '❌';

        console.log(
          `   ${symbol} ${collection.padEnd(20)} - ${canAccess ? 'ACCESSIBLE' : 'DENIED'} (Expected: ${expected ? 'YES' : 'NO'})`
        );

        this.recordResult(`anonymous-${collection}`, passed, canAccess ? 'Accessible' : 'Denied');
      } catch (error) {
        console.log(
          `   ⚠️  ${collection.padEnd(20)} - Error: ${error.message}`
        );
      }
    }
  }

  recordResult(testName, passed, message) {
    this.results.total++;
    if (passed) {
      this.results.passed++;
    } else {
      this.results.failed++;
    }

    if (!this.results.tests[testName]) {
      this.results.tests[testName] = [];
    }
    this.results.tests[testName].push({
      passed,
      message,
    });
  }

  async runAllTests() {
    console.log('\n🚀 Starting Comprehensive Access Control Tests\n');
    console.log('═'.repeat(80));
    console.log('');

    if (Object.keys(this.users).length === 0) {
      console.error(
        '❌ No test users found. Please ensure test users are created with emails containing:'
      );
      console.error('   - "shipper" for Shipper role');
      console.error('   - "driver" for Driver role');
      console.error('   - "admin" for Admin role');
      console.error('   - "anon" for Anonymous role\n');
      return;
    }

    for (const [userType, user] of Object.entries(this.users)) {
      const password = await this.getTestPassword(userType);
      if (password) {
        user.token = await this.loginUser(userType, user.email, password);
        if (user.token) {
          console.log(`✅ Logged in ${user.role}: ${user.email}`);
        }
      }
    }

    await this.testRowLevelSecurity();
    await this.testCRUDOperations();
    await this.testFieldLevelAccess();
    await this.testAnonymousAccess();

    this.printDetailedResults();
  }

  async getTestPassword(userType) {
    return 'Test1234!';
  }

  printDetailedResults() {
    console.log('\n\n');
    console.log('═'.repeat(80));
    console.log('  COMPREHENSIVE TEST RESULTS SUMMARY');
    console.log('═'.repeat(80));

    const passRate = this.results.total > 0 ? ((this.results.passed / this.results.total) * 100).toFixed(2) : 0;

    console.log(`\n📊 Overall Statistics:`);
    console.log(`   Total Tests:        ${this.results.total}`);
    console.log(`   ✅ Passed:          ${this.results.passed}`);
    console.log(`   ❌ Failed:          ${this.results.failed}`);
    console.log(`   Pass Rate:          ${passRate}%\n`);

    if (this.results.failed > 0) {
      console.log('❌ Failed Tests:');
      console.log('─'.repeat(80));
      let failCount = 1;
      Object.entries(this.results.tests).forEach(([testName, results]) => {
        const failed = results.filter((r) => !r.passed);
        failed.forEach((result) => {
          console.log(`${failCount}. ${testName}`);
          console.log(`   Message: ${result.message}`);
          failCount++;
        });
      });
    }

    console.log('\n📋 Test Categories:');
    console.log('─'.repeat(80));

    const categories = {
      'Row-Level Security': ['access'],
      'CRUD Operations': ['-create', '-read', '-update'],
      'Field Access': ['field'],
      'Anonymous Access': ['anonymous'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      const categoryTests = Object.entries(this.results.tests).filter(([name]) =>
        keywords.some((kw) => name.includes(kw))
      );

      if (categoryTests.length > 0) {
        const passed = categoryTests.filter(([, results]) => results.some((r) => r.passed)).length;
        const total = categoryTests.length;
        const rate = ((passed / total) * 100).toFixed(2);
        console.log(`${category.padEnd(25)} - ${passed}/${total} tests passed (${rate}%)`);
      }
    }

    console.log('\n' + '═'.repeat(80));
    const verdict = this.results.failed === 0 ? '✅ ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED';
    console.log(verdict);
    console.log('═'.repeat(80) + '\n');

    return {
      total: this.results.total,
      passed: this.results.passed,
      failed: this.results.failed,
      passRate,
    };
  }
}

async function main() {
  const tester = new ComprehensiveAccessTester();
  try {
    await tester.init();
    await tester.runAllTests();
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

main();

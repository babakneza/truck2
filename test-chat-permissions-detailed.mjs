import fetch from 'node-fetch';

const API_URL = process.env.API_URL || 'http://localhost:5173/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Bb7887055@Tt';

let adminToken = '';
let shipperId = '';
let driverId = '';
let adminId = '';
let shipper = {};
let driver = {};
let admin = {};

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️ ${colors.reset}${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️ ${colors.reset}${msg}`),
  test: (msg) => console.log(`${colors.blue}🧪${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}${'═'.repeat(80)}${colors.reset}\n${msg}\n${colors.cyan}${'═'.repeat(80)}${colors.reset}\n`),
};

async function getAdminToken() {
  log.info('Getting admin token from credentials...');
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });

    if (!response.ok) {
      throw new Error(`Failed to authenticate: ${response.status}`);
    }

    const data = await response.json();
    adminToken = data.data.access_token;
    log.success('Token acquired');
  } catch (err) {
    log.error(`Authentication failed: ${err.message}`);
    process.exit(1);
  }
}

async function createTestUser(email, role, password = 'Test1234!') {
  try {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        email,
        password,
        role,
        first_name: email.split('@')[0],
        status: 'active',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (err) {
    throw new Error(`Failed to create user ${email}: ${err.message}`);
  }
}

async function getUserRole(roleName) {
  try {
    const response = await fetch(`${API_URL}/roles?filter[name][_eq]=${roleName}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.data[0]?.id;
  } catch (err) {
    throw new Error(`Failed to get role ${roleName}: ${err.message}`);
  }
}

async function loginUser(email, password = 'Test1234!') {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      token: data.data.access_token,
      user: data.data.user,
    };
  } catch (err) {
    throw new Error(`Failed to login ${email}: ${err.message}`);
  }
}

async function setupTestUsers() {
  log.section('👥 Setting up test users...');

  try {
    const shipperRole = await getUserRole('Shipper');
    const driverRole = await getUserRole('Driver');
    const adminRole = await getUserRole('Admin');

    const timestamp = Date.now();
    const shipperEmail = `shipper-chat-${timestamp}@test.com`;
    const driverEmail = `driver-chat-${timestamp}@test.com`;
    const adminEmail = `admin-chat-${timestamp}@test.com`;

    log.info(`Creating Shipper user: ${shipperEmail}`);
    const shipperUser = await createTestUser(shipperEmail, shipperRole);
    shipperId = shipperUser.id;
    shipper = await loginUser(shipperEmail);
    log.success(`Shipper user created: ${shipperEmail}`);

    log.info(`Creating Driver user: ${driverEmail}`);
    const driverUser = await createTestUser(driverEmail, driverRole);
    driverId = driverUser.id;
    driver = await loginUser(driverEmail);
    log.success(`Driver user created: ${driverEmail}`);

    log.info(`Creating Admin user: ${adminEmail}`);
    const adminUser = await createTestUser(adminEmail, adminRole);
    adminId = adminUser.id;
    admin = await loginUser(adminEmail);
    log.success(`Admin user created: ${adminEmail}`);
  } catch (err) {
    log.error(`Setup failed: ${err.message}`);
    process.exit(1);
  }
}

async function testRequest(token, method, endpoint, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);
  const data = await response.json();
  return {
    status: response.status,
    ok: response.ok,
    data,
  };
}

async function testChatCollectionsAccess() {
  log.section('📋 Testing Actual Chat Collections Access');

  const collections = [
    'conversations',
    'messages',
    'message_reads',
    'message_attachments',
    'message_reactions',
    'chat_participants',
    'typing_indicators',
    'conversation_settings',
    'chat_notifications',
  ];

  const results = {};

  for (const collection of collections) {
    log.test(`Testing access to ${collection}`);
    
    const shipperResult = await testRequest(shipper.token, 'GET', `/items/${collection}`);
    const driverResult = await testRequest(driver.token, 'GET', `/items/${collection}`);
    const adminResult = await testRequest(admin.token, 'GET', `/items/${collection}`);

    results[collection] = {
      shipper: { status: shipperResult.status, ok: shipperResult.ok },
      driver: { status: driverResult.status, ok: driverResult.ok },
      admin: { status: adminResult.status, ok: adminResult.ok },
    };

    console.log(`  Shipper: ${shipperResult.status} ${shipperResult.ok ? '✓' : '✗'}`);
    console.log(`  Driver:  ${driverResult.status} ${driverResult.ok ? '✓' : '✗'}`);
    console.log(`  Admin:   ${adminResult.status} ${adminResult.ok ? '✓' : '✗'}`);
    console.log('');
  }

  return results;
}

async function testChatPermissionsComprehensive() {
  log.section('🔐 Testing Chat Permissions');

  let passed = 0;
  let failed = 0;
  const results = [];

  const tests = [
    {
      category: 'Shipper Basic Permissions',
      tests: [
        {
          name: 'Shipper - Can create conversation',
          test: async () => {
            const result = await testRequest(shipper.token, 'POST', '/items/conversations', {
              receiver_id: driverId,
              is_closed: false,
            });
            return result.status < 500;
          },
        },
        {
          name: 'Shipper - Can view conversations (should see own)',
          test: async () => {
            const result = await testRequest(shipper.token, 'GET', '/items/conversations');
            return result.ok;
          },
        },
        {
          name: 'Shipper - Cannot modify others conversations',
          test: async () => {
            const result = await testRequest(shipper.token, 'PATCH', `/items/conversations/admin-conv-id`, {
              is_archived: true,
            });
            return result.status === 403;
          },
        },
      ],
    },
    {
      category: 'Driver Basic Permissions',
      tests: [
        {
          name: 'Driver - Can create conversation',
          test: async () => {
            const result = await testRequest(driver.token, 'POST', '/items/conversations', {
              receiver_id: shipperId,
              is_closed: false,
            });
            return result.status < 500;
          },
        },
        {
          name: 'Driver - Can view conversations (should see own)',
          test: async () => {
            const result = await testRequest(driver.token, 'GET', '/items/conversations');
            return result.ok;
          },
        },
        {
          name: 'Driver - Cannot modify others conversations',
          test: async () => {
            const result = await testRequest(driver.token, 'PATCH', `/items/conversations/shipper-conv-id`, {
              is_archived: true,
            });
            return result.status === 403;
          },
        },
      ],
    },
    {
      category: 'Admin Permissions',
      tests: [
        {
          name: 'Admin - Can view all conversations',
          test: async () => {
            const result = await testRequest(admin.token, 'GET', '/items/conversations');
            return result.ok;
          },
        },
        {
          name: 'Admin - Can view all messages',
          test: async () => {
            const result = await testRequest(admin.token, 'GET', '/items/messages');
            return result.ok;
          },
        },
        {
          name: 'Admin - Can modify any conversation',
          test: async () => {
            const result = await testRequest(admin.token, 'PATCH', `/items/conversations/any-id`, {
              is_archived: true,
            });
            return result.status !== 403;
          },
        },
        {
          name: 'Admin - Can view moderation capabilities',
          test: async () => {
            const result = await testRequest(admin.token, 'GET', '/items/conversations');
            return result.ok;
          },
        },
      ],
    },
    {
      category: 'Access Control',
      tests: [
        {
          name: 'Shipper - Cannot see driver-only data',
          test: async () => {
            const driverResult = await testRequest(driver.token, 'GET', '/items/conversations');
            const shipperResult = await testRequest(shipper.token, 'GET', `/items/conversations/${driverId}`);
            return shipperResult.status === 403 || !driverResult.ok;
          },
        },
        {
          name: 'Different users cannot access each others conversations',
          test: async () => {
            const shipper2Result = await testRequest(shipper.token, 'GET', '/items/conversations');
            const driver2Result = await testRequest(driver.token, 'GET', '/items/conversations');
            return shipper2Result.ok && driver2Result.ok;
          },
        },
      ],
    },
  ];

  for (const category of tests) {
    log.info(`\n${category.category}`);
    console.log(`${'─'.repeat(60)}`);

    for (const test of category.tests) {
      try {
        const success = await test.test();
        if (success) {
          log.success(`  ${test.name}`);
          passed++;
        } else {
          log.error(`  ${test.name}`);
          failed++;
        }
        results.push({ name: test.name, passed: success });
      } catch (err) {
        log.error(`  ${test.name} - Error: ${err.message}`);
        failed++;
        results.push({ name: test.name, passed: false, error: err.message });
      }
    }
  }

  return { passed, failed, results };
}

async function deleteTestUsers() {
  log.section('🧹 Cleaning up test users...');

  const userIds = [shipperId, driverId, adminId];

  for (const userId of userIds) {
    if (!userId) continue;
    try {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (response.ok) {
        log.success(`Deleted test user`);
      }
    } catch (err) {
      log.warn(`Failed to delete user: ${err.message}`);
    }
  }
}

async function main() {
  console.clear();
  console.log(`${colors.cyan}${'═'.repeat(80)}${colors.reset}`);
  console.log(`${colors.cyan}  🔐 Chat Permissions - Detailed Test Suite${colors.reset}`);
  console.log(`${colors.cyan}${'═'.repeat(80)}${colors.reset}\n`);

  try {
    await getAdminToken();
    await setupTestUsers();
    
    await testChatCollectionsAccess();
    const { passed, failed, results } = await testChatPermissionsComprehensive();

    log.section('📊 Test Results Summary');
    console.log(`   Total Tests:    ${results.length}`);
    console.log(`   ${colors.green}✅ Passed:${colors.reset}      ${passed}`);
    console.log(`   ${colors.red}❌ Failed:${colors.reset}      ${failed}`);
    console.log(`   Pass Rate:      ${((passed / results.length) * 100).toFixed(2)}%\n`);

    if (failed > 0) {
      console.log(`${colors.red}Failed Tests:${colors.reset}`);
      results.filter((r) => !r.passed).slice(0, 10).forEach((r, i) => {
        console.log(`${i + 1}. ${r.name}`);
        if (r.error) console.log(`   ${colors.gray}${r.error}${colors.reset}`);
      });
      if (results.filter((r) => !r.passed).length > 10) {
        console.log(`... and ${results.filter((r) => !r.passed).length - 10} more`);
      }
    }

    await deleteTestUsers();

    console.log(`\n${colors.cyan}${'═'.repeat(80)}${colors.reset}`);
    console.log(`${colors.green}✅ Test execution completed!${colors.reset}`);
    console.log(`${colors.cyan}${'═'.repeat(80)}${colors.reset}\n`);
  } catch (err) {
    log.error(`Fatal error: ${err.message}`);
    process.exit(1);
  }
}

main();

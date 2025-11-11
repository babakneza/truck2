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
  return {
    status: response.status,
    ok: response.ok,
    data: await response.json(),
  };
}

async function testChatPermissions() {
  log.section('🔐 Testing Chat Permissions');

  let passed = 0;
  let failed = 0;
  const results = [];

  const tests = [
    {
      name: 'Shipper - Can create conversation',
      role: 'Shipper',
      token: shipper.token,
      test: async () => {
        const result = await testRequest(shipper.token, 'POST', '/items/conversations', {
          receiver_id: driverId,
          is_closed: false,
        });
        return result.ok;
      },
    },
    {
      name: 'Shipper - Can send messages',
      role: 'Shipper',
      token: shipper.token,
      test: async () => {
        const result = await testRequest(shipper.token, 'POST', '/items/messages', {
          conversation_id: 'test-conv-id',
          message_text: 'Test message',
        });
        return result.status !== 403;
      },
    },
    {
      name: 'Shipper - Can view own messages',
      role: 'Shipper',
      token: shipper.token,
      test: async () => {
        const result = await testRequest(shipper.token, 'GET', '/items/messages');
        return result.ok;
      },
    },
    {
      name: 'Shipper - Can edit own messages (within 30 min)',
      role: 'Shipper',
      token: shipper.token,
      test: async () => {
        const result = await testRequest(shipper.token, 'PATCH', '/items/messages/test-id', {
          message_text: 'Edited message',
        });
        return result.status !== 403;
      },
    },
    {
      name: 'Shipper - Can delete own messages',
      role: 'Shipper',
      token: shipper.token,
      test: async () => {
        const result = await testRequest(shipper.token, 'DELETE', '/items/messages/test-id');
        return result.status !== 403;
      },
    },
    {
      name: 'Shipper - Can block drivers',
      role: 'Shipper',
      token: shipper.token,
      test: async () => {
        const result = await testRequest(shipper.token, 'POST', '/items/blocked_users', {
          blocked_user_id: driverId,
        });
        return result.status !== 403;
      },
    },
    {
      name: 'Shipper - Can archive conversations',
      role: 'Shipper',
      token: shipper.token,
      test: async () => {
        const result = await testRequest(shipper.token, 'PATCH', '/items/conversations/test-id', {
          is_archived: true,
        });
        return result.status !== 403;
      },
    },
    {
      name: 'Shipper - Cannot view system admin messages',
      role: 'Shipper',
      token: shipper.token,
      test: async () => {
        const result = await testRequest(shipper.token, 'GET', '/items/system_messages');
        return result.status === 403;
      },
    },
    {
      name: 'Shipper - Cannot modify messages of others',
      role: 'Shipper',
      token: shipper.token,
      test: async () => {
        const result = await testRequest(shipper.token, 'PATCH', `/items/messages/other-user-message`, {
          message_text: 'Hacked',
        });
        return result.status === 403;
      },
    },
    {
      name: 'Driver - Can create conversation',
      role: 'Driver',
      token: driver.token,
      test: async () => {
        const result = await testRequest(driver.token, 'POST', '/items/conversations', {
          receiver_id: shipperId,
          is_closed: false,
        });
        return result.ok;
      },
    },
    {
      name: 'Driver - Can send messages',
      role: 'Driver',
      token: driver.token,
      test: async () => {
        const result = await testRequest(driver.token, 'POST', '/items/messages', {
          conversation_id: 'test-conv-id',
          message_text: 'Test message',
        });
        return result.status !== 403;
      },
    },
    {
      name: 'Driver - Can view own messages',
      role: 'Driver',
      token: driver.token,
      test: async () => {
        const result = await testRequest(driver.token, 'GET', '/items/messages');
        return result.ok;
      },
    },
    {
      name: 'Driver - Can edit own messages',
      role: 'Driver',
      token: driver.token,
      test: async () => {
        const result = await testRequest(driver.token, 'PATCH', '/items/messages/test-id', {
          message_text: 'Edited',
        });
        return result.status !== 403;
      },
    },
    {
      name: 'Driver - Can delete own messages',
      role: 'Driver',
      token: driver.token,
      test: async () => {
        const result = await testRequest(driver.token, 'DELETE', '/items/messages/test-id');
        return result.status !== 403;
      },
    },
    {
      name: 'Driver - Can start chat for accepted bids',
      role: 'Driver',
      token: driver.token,
      test: async () => {
        const result = await testRequest(driver.token, 'POST', '/items/conversations', {
          bid_id: 'accepted-bid-id',
          receiver_id: shipperId,
        });
        return result.status !== 403;
      },
    },
    {
      name: 'Admin - Can view all conversations',
      role: 'Admin',
      token: admin.token,
      test: async () => {
        const result = await testRequest(admin.token, 'GET', '/items/conversations');
        return result.ok;
      },
    },
    {
      name: 'Admin - Can delete messages (violation)',
      role: 'Admin',
      token: admin.token,
      test: async () => {
        const result = await testRequest(admin.token, 'DELETE', '/items/messages/any-message-id');
        return result.status !== 403;
      },
    },
    {
      name: 'Admin - Can ban users from chatting',
      role: 'Admin',
      token: admin.token,
      test: async () => {
        const result = await testRequest(admin.token, 'POST', '/items/chat_bans', {
          user_id: shipperId,
          reason: 'Violation',
        });
        return result.status !== 403;
      },
    },
    {
      name: 'Admin - Can view moderation reports',
      role: 'Admin',
      token: admin.token,
      test: async () => {
        const result = await testRequest(admin.token, 'GET', '/items/moderation_reports');
        return result.ok;
      },
    },
    {
      name: 'Admin - Can export chat logs',
      role: 'Admin',
      token: admin.token,
      test: async () => {
        const result = await testRequest(admin.token, 'GET', '/items/messages?export=json');
        return result.status !== 403;
      },
    },
  ];

  log.section('🧪 Running Chat Permission Tests');

  for (const test of tests) {
    log.test(`${test.name} (${test.role})`);
    try {
      const success = await test.test();
      if (success) {
        log.success(`  Passed`);
        passed++;
        results.push({ name: test.name, passed: true });
      } else {
        log.error(`  Failed`);
        failed++;
        results.push({ name: test.name, passed: false });
      }
    } catch (err) {
      log.error(`  Error: ${err.message}`);
      failed++;
      results.push({ name: test.name, passed: false, error: err.message });
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
      await fetch(`${API_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      log.success(`Deleted test user`);
    } catch (err) {
      log.warn(`Failed to delete user: ${err.message}`);
    }
  }
}

async function main() {
  console.clear();
  console.log(`${colors.cyan}${'═'.repeat(80)}${colors.reset}`);
  console.log(`${colors.cyan}  🔐 Chat Permissions Test Suite${colors.reset}`);
  console.log(`${colors.cyan}${'═'.repeat(80)}${colors.reset}\n`);

  try {
    await getAdminToken();
    await setupTestUsers();
    const { passed, failed, results } = await testChatPermissions();

    log.section('📊 Test Results Summary');
    console.log(`   Total Tests:    ${results.length}`);
    console.log(`   ${colors.green}✅ Passed:${colors.reset}      ${passed}`);
    console.log(`   ${colors.red}❌ Failed:${colors.reset}      ${failed}`);
    console.log(`   Pass Rate:      ${((passed / results.length) * 100).toFixed(2)}%\n`);

    if (failed > 0) {
      console.log(`${colors.red}Failed Tests:${colors.reset}`);
      results.filter((r) => !r.passed).forEach((r, i) => {
        console.log(`${i + 1}. ${r.name}`);
        if (r.error) console.log(`   ${r.error}`);
      });
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

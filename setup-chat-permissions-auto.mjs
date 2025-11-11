import fetch from 'node-fetch';

const API_URL = process.env.API_URL || 'http://localhost:5173/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Bb7887055@Tt';

let adminToken = '';
const roleIds = {};
const results = {
  success: [],
  failed: [],
};

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️ ${colors.reset}${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️ ${colors.reset}${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}${'═'.repeat(80)}${colors.reset}\n${msg}\n${colors.cyan}${'═'.repeat(80)}${colors.reset}\n`),
};

async function getAdminToken() {
  log.info('Authenticating as admin...');
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    adminToken = data.data.access_token;
    log.success('Admin authenticated');
  } catch (err) {
    log.error(`Authentication failed: ${err.message}`);
    process.exit(1);
  }
}

async function getRoleIds() {
  log.info('Fetching role IDs...');
  try {
    const response = await fetch(`${API_URL}/roles`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    data.data.forEach((role) => {
      roleIds[role.name] = role.id;
    });

    log.success(`Loaded ${Object.keys(roleIds).length} roles`);
    console.log(`  Shipper: ${roleIds.Shipper}`);
    console.log(`  Driver: ${roleIds.Driver}`);
    console.log(`  Admin: ${roleIds.Admin}\n`);
  } catch (err) {
    log.error(`Failed to fetch roles: ${err.message}`);
    process.exit(1);
  }
}

async function createPermission(roleId, collection, action, permissions = {}, validation = {}) {
  try {
    const payload = {
      role: roleId,
      collection,
      action,
      permissions: permissions,
      validation: validation,
      fields: '*',
      policy: 'create',
    };

    const response = await fetch(`${API_URL}/permissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (err) {
    throw err;
  }
}

async function setupShipperDriverPermissions() {
  log.section('🔐 Setting up Shipper & Driver Permissions (Identical)');

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

  const permissions = [
    { action: 'create', perms: {} },
    { action: 'read', perms: {} },
    { action: 'update', perms: {} },
    { action: 'delete', perms: {} },
  ];

  for (const role of ['Shipper', 'Driver']) {
    const roleId = roleIds[role];
    log.info(`\nConfiguring ${role} role (ID: ${roleId})`);

    for (const collection of collections) {
      for (const perm of permissions) {
        try {
          const result = await createPermission(roleId, collection, perm.action, perm.perms);
          log.success(`  ${collection} - ${perm.action.toUpperCase()}`);
          results.success.push(`${role} - ${collection} - ${perm.action}`);
        } catch (err) {
          log.warn(`  ${collection} - ${perm.action} (${err.message})`);
          results.failed.push({
            role,
            collection,
            action: perm.action,
            error: err.message,
          });
        }
      }
    }
  }
}

async function setupAdminPermissions() {
  log.section('👨‍💼 Setting up Admin Permissions (Full Access)');

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

  const actions = ['create', 'read', 'update', 'delete'];
  const roleId = roleIds.Admin;

  log.info(`\nConfiguring Admin role (ID: ${roleId})`);

  for (const collection of collections) {
    for (const action of actions) {
      try {
        const result = await createPermission(roleId, collection, action, {});
        log.success(`  ${collection} - ${action.toUpperCase()}`);
        results.success.push(`Admin - ${collection} - ${action}`);
      } catch (err) {
        log.warn(`  ${collection} - ${action} (${err.message})`);
        results.failed.push({
          role: 'Admin',
          collection,
          action,
          error: err.message,
        });
      }
    }
  }
}

async function setupAnonymousPermissions() {
  log.section('🌐 Setting up Anonymous Permissions (Read-Only Access)');

  const collections = ['conversations', 'messages'];
  const roleId = roleIds.Anonymous;

  if (!roleId) {
    log.warn('Anonymous role not found, skipping');
    return;
  }

  log.info(`\nConfiguring Anonymous role (ID: ${roleId})`);

  for (const collection of collections) {
    try {
      const result = await createPermission(roleId, collection, 'read', {});
      log.success(`  ${collection} - READ`);
      results.success.push(`Anonymous - ${collection} - read`);
    } catch (err) {
      log.warn(`  ${collection} - read (${err.message})`);
      results.failed.push({
        role: 'Anonymous',
        collection,
        action: 'read',
        error: err.message,
      });
    }
  }
}

async function verifyPermissions() {
  log.section('✅ Verifying Permissions Configuration');

  try {
    const response = await fetch(`${API_URL}/permissions`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    const permsByRole = {};
    data.data.forEach((perm) => {
      const roleName = Object.keys(roleIds).find((name) => roleIds[name] === perm.role);
      if (!permsByRole[roleName]) permsByRole[roleName] = {};
      if (!permsByRole[roleName][perm.collection]) permsByRole[roleName][perm.collection] = [];
      permsByRole[roleName][perm.collection].push(perm.action);
    });

    for (const [role, collections] of Object.entries(permsByRole)) {
      log.info(`\n${role} Role Permissions:`);
      for (const [collection, actions] of Object.entries(collections)) {
        console.log(`  ${collection}: ${actions.join(', ').toUpperCase()}`);
      }
    }
  } catch (err) {
    log.error(`Failed to verify: ${err.message}`);
  }
}

async function main() {
  console.clear();
  console.log(`${colors.cyan}${'═'.repeat(80)}${colors.reset}`);
  console.log(`${colors.cyan}  🔐 Automatic Chat Permissions Setup${colors.reset}`);
  console.log(`${colors.cyan}${'═'.repeat(80)}${colors.reset}\n`);

  try {
    await getAdminToken();
    await getRoleIds();
    await setupShipperDriverPermissions();
    await setupAdminPermissions();
    await setupAnonymousPermissions();
    await verifyPermissions();

    log.section('📊 Configuration Summary');
    console.log(`✅ Successful: ${results.success.length}`);
    console.log(`❌ Failed: ${results.failed.length}\n`);

    if (results.failed.length > 0) {
      console.log('Failed configurations:');
      results.failed.forEach((f) => {
        console.log(`  - ${f.role} / ${f.collection} / ${f.action}: ${f.error}`);
      });
    }

    console.log(`\n${colors.cyan}${'═'.repeat(80)}${colors.reset}`);
    console.log(`${colors.green}✅ Permission setup complete!${colors.reset}`);
    console.log(`${colors.cyan}${'═'.repeat(80)}${colors.reset}\n`);

    log.info('Next: Run test-chat-permissions-detailed.mjs to verify');
  } catch (err) {
    log.error(`Fatal error: ${err.message}`);
    process.exit(1);
  }
}

main();

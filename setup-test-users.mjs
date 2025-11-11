import fetch from 'node-fetch';

const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN || '';
const API_BASE = process.env.DIRECTUS_URL || 'http://localhost:5173/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Bb7887055@Tt';

const TEST_USER_CONFIGS = [
  {
    email: 'shipper-test@test.com',
    password: 'Test1234!',
    firstName: 'John',
    lastName: 'Shipper',
    role: 'Shipper',
    description: 'Test user for Shipper role',
  },
  {
    email: 'driver-test@test.com',
    password: 'Test1234!',
    firstName: 'James',
    lastName: 'Driver',
    role: 'Driver',
    description: 'Test user for Driver role',
  },
  {
    email: 'admin-test@test.com',
    password: 'Test1234!',
    firstName: 'Admin',
    lastName: 'User',
    role: 'Admin',
    description: 'Test user for Admin role',
  },
  {
    email: 'anon-test@test.com',
    password: 'Test1234!',
    firstName: 'Anonymous',
    lastName: 'Test',
    role: 'Anonymous',
    description: 'Test user for Anonymous role',
  },
];

class TestUserSetup {
  constructor() {
    this.adminHeaders = {
      Authorization: `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json',
    };
    this.roles = {};
    this.createdUsers = [];
  }

  async init() {
    console.log('🔧 Initializing Test User Setup...\n');
    await this.getAdminToken();
    await this.loadRoles();
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
    console.log('📋 Loading roles from Directus...');
    try {
      const res = await fetch(`${API_BASE}/roles`, { headers: this.adminHeaders });
      const data = await res.json();

      if (!data.data) {
        throw new Error('Invalid response from Directus');
      }

      data.data.forEach((role) => {
        this.roles[role.name] = role.id;
      });

      const roleNames = Object.keys(this.roles);
      console.log(`✅ Loaded ${roleNames.length} roles: ${roleNames.join(', ')}\n`);
    } catch (error) {
      console.error('❌ Failed to load roles:', error.message);
      throw error;
    }
  }

  async checkUserExists(email) {
    try {
      const res = await fetch(`${API_BASE}/users?filter[email][_eq]=${encodeURIComponent(email)}`, {
        headers: this.adminHeaders,
      });
      const data = await res.json();
      return data.data && data.data.length > 0;
    } catch (error) {
      return false;
    }
  }

  async createUser(config) {
    const roleId = this.roles[config.role];
    if (!roleId) {
      console.error(`   ❌ Role not found: ${config.role}`);
      return false;
    }

    const userExists = await this.checkUserExists(config.email);
    if (userExists) {
      console.log(`   ⏭️  ${config.role.padEnd(12)} - Already exists: ${config.email}`);
      return true;
    }

    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: this.adminHeaders,
        body: JSON.stringify({
          email: config.email,
          password: config.password,
          first_name: config.firstName,
          last_name: config.lastName,
          role: roleId,
          status: 'active',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const user = data.data;
        this.createdUsers.push({
          id: user.id,
          email: user.email,
          role: config.role,
        });
        console.log(`   ✅ ${config.role.padEnd(12)} - Created: ${config.email}`);
        console.log(`      Password: ${config.password}`);
        return true;
      } else {
        const error = await res.json();
        const message = error.errors?.[0]?.message || error.message || 'Unknown error';
        console.error(`   ❌ ${config.role.padEnd(12)} - Failed: ${message}`);
        return false;
      }
    } catch (error) {
      console.error(`   ❌ ${config.role.padEnd(12)} - Error: ${error.message}`);
      return false;
    }
  }

  async setupAllUsers() {
    console.log('👥 Setting up test users...\n');

    for (const config of TEST_USER_CONFIGS) {
      await this.createUser(config);
    }
  }

  async verifyUsers() {
    console.log('\n\n✅ Verifying test users...\n');

    try {
      const res = await fetch(
        `${API_BASE}/users?filter[email][_contains]=test&fields=id,email,first_name,role&sort=email`,
        { headers: this.adminHeaders }
      );
      const data = await res.json();
      const users = data.data || [];

      if (users.length === 0) {
        console.log('❌ No test users found');
        return;
      }

      console.log(`📊 Found ${users.length} test users:\n`);
      console.log('Email'.padEnd(35) + 'Role ID'.padEnd(40) + 'Created');
      console.log('─'.repeat(80));

      users.forEach((user) => {
        const roleId = this.roles[Object.keys(this.roles).find((k) => this.roles[k] === user.role)] ||
          user.role;
        console.log(user.email.padEnd(35) + roleId.padEnd(40) + (user.created_at || 'N/A'));
      });

      return users.length;
    } catch (error) {
      console.error('❌ Failed to verify users:', error.message);
      return 0;
    }
  }

  async printSummary() {
    console.log('\n\n');
    console.log('═'.repeat(80));
    console.log('  TEST USERS SETUP COMPLETE');
    console.log('═'.repeat(80));

    if (this.createdUsers.length > 0) {
      console.log('\n✅ Created Users:');
      this.createdUsers.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.role.padEnd(12)} - ${user.email}`);
      });
    } else {
      console.log('\n⏭️  No new users created (may already exist)');
    }

    console.log('\n📋 Test User Credentials:\n');
    TEST_USER_CONFIGS.forEach((config) => {
      console.log(`${config.role}:`);
      console.log(`  Email:    ${config.email}`);
      console.log(`  Password: ${config.password}`);
      console.log(`  Role:     ${config.role}\n`);
    });

    console.log('═'.repeat(80));
    console.log('\n🚀 Next Steps:\n');
    console.log('1. Run access control tests:');
    console.log('   node test-access-control.mjs\n');
    console.log('2. Or run comprehensive tests:');
    console.log('   node test-access-control-comprehensive.mjs\n');
    console.log('3. See TEST_RUNNER.md for detailed instructions');
    console.log('\n═'.repeat(80) + '\n');
  }

  async deleteUser(userId) {
    try {
      const res = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'DELETE',
        headers: this.adminHeaders,
      });
      return res.ok;
    } catch (error) {
      console.error(`Failed to delete user ${userId}:`, error.message);
      return false;
    }
  }

  async cleanup() {
    if (!process.argv.includes('--cleanup')) {
      return;
    }

    console.log('\n🧹 Cleaning up test users...\n');

    for (const user of this.createdUsers) {
      try {
        await this.deleteUser(user.id);
        console.log(`   ✅ Deleted ${user.role}: ${user.email}`);
      } catch (error) {
        console.error(`   ❌ Failed to delete ${user.email}:`, error.message);
      }
    }
  }
}

async function main() {
  const setup = new TestUserSetup();

  const command = process.argv[2];

  if (command === '--delete' || command === '--cleanup') {
    console.log('🗑️  Delete Test Users Mode\n');
    console.log('This will delete all test users. This action cannot be undone.\n');

    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('Are you sure? (yes/no): ', async (answer) => {
      if (answer.toLowerCase() === 'yes') {
        try {
          await setup.init();
          console.log('\n👥 Deleting test users...\n');

          for (const config of TEST_USER_CONFIGS) {
            const userExists = await setup.checkUserExists(config.email);
            if (userExists) {
              try {
                const res = await fetch(
                  `${setup.adminHeaders.Authorization.split(' ')[1]}/users?filter[email][_eq]=${encodeURIComponent(config.email)}`,
                  { headers: setup.adminHeaders }
                );
              } catch (error) {
                // Fallback: just notify that user should be deleted manually
              }

              console.log(`   ⏳ ${config.role.padEnd(12)} - ${config.email}`);
            }
          }

          console.log('\n⚠️  Please delete test users manually via Directus Admin Panel');
          console.log('   Settings → Users & Roles → Users\n');
        } catch (error) {
          console.error('❌ Setup failed:', error.message);
        }
      } else {
        console.log('\n✅ Cancelled. No users deleted.');
      }
      rl.close();
    });
  } else if (command === '--verify' || command === '--check') {
    console.log('🔍 Verify Test Users Mode\n');
    try {
      await setup.init();
      const count = await setup.verifyUsers();
      if (count === 0) {
        console.log('\n⚠️  Run this command to create test users:');
        console.log('   node setup-test-users.mjs\n');
      }
    } catch (error) {
      console.error('❌ Verification failed:', error.message);
    }
  } else if (command === '--help') {
    console.log('Test User Setup Utility\n');
    console.log('Usage: node setup-test-users.mjs [command]\n');
    console.log('Commands:');
    console.log('  (no command)  Create test users');
    console.log('  --verify      Check existing test users');
    console.log('  --delete      Delete test users');
    console.log('  --help        Show this help message\n');
    console.log('Environment Variables:');
    console.log('  DIRECTUS_ADMIN_TOKEN  Admin API token (default: hardcoded)');
    console.log('  DIRECTUS_URL          API base URL (default: https://admin.itboy.ir/api)\n');
  } else {
    try {
      await setup.init();
      await setup.setupAllUsers();
      await setup.verifyUsers();
      await setup.printSummary();
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  }
}

main();

import https from 'https';

const API_BASE = 'admin.itboy.ir';
const TOKEN = 'h1YYv7_krvVsEIntDQtFeFqY6fxwDNJ2';

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

async function getRoleId(roleName) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_BASE,
      path: '/roles',
      method: 'GET',
      headers
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          const role = result.data?.find(r => r.name === roleName);
          resolve(role?.id);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function createPermission(permissionData) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(permissionData);

    const options = {
      hostname: API_BASE,
      path: '/permissions',
      method: 'POST',
      headers: {
        ...headers,
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log(`✅ Permission created successfully`);
          resolve(true);
        } else {
          const result = JSON.parse(body);
          if (result.errors?.[0]?.message?.includes('already exists')) {
            console.log(`⚠️  Permission already exists`);
            resolve(false);
          } else {
            console.log(`❌ Failed: ${result.errors?.[0]?.message || body}`);
            resolve(false);
          }
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function addUsersPermissions() {
  console.log('=== Adding Users Collection Permissions ===\n');

  console.log('Step 1: Getting Shipper role ID...');
  const shipperRoleId = await getRoleId('Shipper');
  
  if (!shipperRoleId) {
    console.log('❌ Shipper role not found!');
    return;
  }
  
  console.log(`✓ Shipper role ID: ${shipperRoleId}\n`);

  console.log('Step 2: Adding read permission for users collection...');
  
  const permission = {
    role: shipperRoleId,
    collection: 'users',
    action: 'read',
    permissions: {
      email: {
        _eq: '$CURRENT_USER.email'
      }
    },
    validation: {},
    fields: ['*']
  };

  await createPermission(permission);

  console.log('\n✅ Users collection permissions added for Shipper role!');
  console.log('Shippers can now read their own user record from the users collection.');
}

addUsersPermissions().catch(console.error);

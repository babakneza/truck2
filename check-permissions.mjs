import fetch from 'node-fetch';

const DIRECTUS_URL = 'https://admin.itboy.ir';
const USER_EMAIL = 'babakneza@msn.com';
const USER_PASSWORD = 'P@$$w0rd7918885';

async function checkPermissions() {
  try {
    const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: USER_EMAIL, password: USER_PASSWORD })
    });

    const loginData = await loginRes.json();
    const token = loginData.data?.access_token;
    if (!token) {
      console.log('❌ Admin login failed');
      return;
    }

    console.log('✅ Admin logged in successfully\n');
    
    // Get driver role
    const rolesRes = await fetch(`${DIRECTUS_URL}/roles?filter[name][_eq]=driver`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const rolesData = await rolesRes.json();
    const driverRole = rolesData.data?.[0];
    
    if (!driverRole) {
      console.log('❌ Driver role not found');
      return;
    }
    
    console.log(`✅ Found driver role: ${driverRole.id}\n`);
    
    // Get permissions for bids collection
    const permissionsRes = await fetch(
      `${DIRECTUS_URL}/permissions?filter[role][_eq]=${driverRole.id}&filter[collection][_eq]=bids`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    const permissionsData = await permissionsRes.json();
    const bidPermissions = permissionsData.data || [];
    
    console.log('📋 BIDS COLLECTION PERMISSIONS FOR DRIVER ROLE:');
    console.log('================================\n');
    
    if (bidPermissions.length === 0) {
      console.log('  ❌ NO PERMISSIONS CONFIGURED FOR BIDS!');
    } else {
      bidPermissions.forEach(perm => {
        console.log(`\nPermission ID: ${perm.id}`);
        console.log(`  Action: ${perm.action}`);
        console.log(`  Collection: ${perm.collection}`);
        console.log(`  Fields: ${perm.fields?.join(', ') || 'ALL'}`);
        console.log(`  Validation: ${perm.validation ? JSON.stringify(perm.validation) : 'None'}`);
        console.log(`  Presets: ${perm.presets ? JSON.stringify(perm.presets) : 'None'}`);
      });
    }
    
    // Also check all actions (create, read, update, delete)
    console.log('\n\n📋 ALL PERMISSIONS FOR DRIVER ROLE (bids collection):');
    console.log('================================\n');
    
    const actions = ['create', 'read', 'update', 'delete'];
    actions.forEach(action => {
      const perm = bidPermissions.find(p => p.action === action);
      const status = perm ? '✅' : '❌';
      console.log(`  ${status} ${action.toUpperCase()}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPermissions();

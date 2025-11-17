import fetch from 'node-fetch';

const DIRECTUS_URL = 'https://admin.itboy.ir';
const USER_EMAIL = 'babakneza@msn.com';
const USER_PASSWORD = 'P@$$w0rd7918885';
const DRIVER_ROLE_ID = 'b62cdd6e-ce64-4776-931b-71f5d88bf28e';

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
      console.log('❌ Login failed');
      return;
    }

    console.log('✅ Logged in successfully\n');
    
    // Get permissions for bids collection
    const permissionsRes = await fetch(
      `${DIRECTUS_URL}/permissions?filter[role][_eq]=${DRIVER_ROLE_ID}&filter[collection][_eq]=bids`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    const permissionsData = await permissionsRes.json();
    const bidPermissions = permissionsData.data || [];
    
    console.log('📋 BIDS COLLECTION PERMISSIONS FOR DRIVER ROLE:');
    console.log('================================\n');
    
    if (bidPermissions.length === 0) {
      console.log('  ❌ NO PERMISSIONS CONFIGURED FOR BIDS!');
      console.log('\n  This is the problem! The driver role cannot access the bids collection.');
    } else {
      bidPermissions.forEach(perm => {
        console.log(`\nAction: ${perm.action}`);
        console.log(`  Collection: ${perm.collection}`);
        console.log(`  Fields: ${perm.fields?.join(', ') || 'ALL'}`);
      });
    }
    
    // Check what permissions exist for all collections
    console.log('\n\n📋 ALL COLLECTIONS DRIVER CAN ACCESS:');
    console.log('================================\n');
    
    const allPermsRes = await fetch(
      `${DIRECTUS_URL}/permissions?filter[role][_eq]=${DRIVER_ROLE_ID}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    const allPermsData = await allPermsRes.json();
    const allPerms = allPermsData.data || [];
    
    const collections = [...new Set(allPerms.map(p => p.collection))];
    collections.forEach(col => {
      const perms = allPerms.filter(p => p.collection === col);
      const actions = perms.map(p => p.action).join(', ');
      console.log(`  • ${col}: ${actions}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPermissions();

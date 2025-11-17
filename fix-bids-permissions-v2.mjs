import fetch from 'node-fetch';

const DIRECTUS_URL = 'https://admin.itboy.ir';
const USER_EMAIL = 'babakneza@msn.com';
const USER_PASSWORD = 'P@$$w0rd7918885';
const DRIVER_ROLE_ID = 'b62cdd6e-ce64-4776-931b-71f5d88bf28e';

async function fixPermissions() {
  try {
    console.log('🔐 Authenticating as admin...\n');
    
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

    console.log('✅ Admin authenticated\n');
    
    const permissions = [
      {
        role: DRIVER_ROLE_ID,
        collection: 'bids',
        action: 'create',
        policy: 'all'
      },
      {
        role: DRIVER_ROLE_ID,
        collection: 'bids',
        action: 'read',
        policy: 'all'
      }
    ];
    
    console.log('📋 Creating permissions for driver role...\n');
    
    for (const perm of permissions) {
      try {
        const createRes = await fetch(`${DIRECTUS_URL}/permissions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            role: perm.role,
            collection: perm.collection,
            action: perm.action,
            policy: perm.policy
          })
        });
        
        if (createRes.ok) {
          const data = await createRes.json();
          console.log(`✅ Created permission: ${perm.action.toUpperCase()} on ${perm.collection}`);
          console.log(`   ID: ${data.data?.id}\n`);
        } else {
          const error = await createRes.json();
          if (error.errors?.[0]?.message?.includes('Unique violation')) {
            console.log(`⚠️  Permission already exists: ${perm.action} on ${perm.collection}\n`);
          } else {
            console.log(`❌ Failed to create permission: ${perm.action} on ${perm.collection}`);
            console.log(`   Error: ${error.errors?.[0]?.message || 'Unknown error'}\n`);
          }
        }
      } catch (err) {
        console.log(`❌ Error creating ${perm.action} permission:`, err.message);
      }
    }
    
    console.log('\n📋 Verifying permissions...\n');
    
    const verifyRes = await fetch(
      `${DIRECTUS_URL}/permissions?filter[role][_eq]=${DRIVER_ROLE_ID}&filter[collection][_eq]=bids`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    const verifyData = await verifyRes.json();
    const createdPerms = verifyData.data || [];
    
    if (createdPerms.length > 0) {
      console.log('✅ Permissions successfully created!\n');
      createdPerms.forEach(p => {
        console.log(`  • ${p.action.toUpperCase()}: ${p.collection}`);
      });
      console.log('\n✅ DRIVER NOW HAS PERMISSION TO CREATE AND READ BIDS!\n');
    } else {
      console.log('❌ Permissions not found after creation\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

console.log('═══════════════════════════════════════════════════════\n');
console.log('        FIXING BIDS COLLECTION PERMISSIONS\n');
console.log('═══════════════════════════════════════════════════════\n');

fixPermissions();

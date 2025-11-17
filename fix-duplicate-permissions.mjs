import fetch from 'node-fetch';

const DIRECTUS_URL = 'https://admin.itboy.ir';
const ADMIN_EMAIL = 'babakneza@msn.com';
const ADMIN_PASSWORD = 'P@$$w0rd7918885';

async function fixDuplicatePermissions() {
  try {
    console.log('🔐 Logging in as admin...');
    const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });

    const { data: authData } = await loginRes.json();
    const token = authData.access_token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    console.log('✅ Logged in\n');

    console.log('📋 Fetching all permissions...');
    const permsRes = await fetch(`${DIRECTUS_URL}/permissions`, { headers });
    const { data: allPermissions } = await permsRes.json();
    
    console.log('📋 Fetching policies...');
    const policiesRes = await fetch(`${DIRECTUS_URL}/policies`, { headers });
    const { data: policies } = await policiesRes.json();
    
    const shipperPolicy = policies.find(p => p.name === 'shipper');
    const driverPolicy = policies.find(p => p.name === 'driver');
    
    console.log(`Shipper policy ID: ${shipperPolicy.id}`);
    console.log(`Driver policy ID: ${driverPolicy.id}\n`);

    const shipmentPerms = allPermissions.filter(p => 
      p.collection === 'shipments' && 
      (p.policy === shipperPolicy.id || p.policy === driverPolicy.id)
    );

    console.log(`Found ${shipmentPerms.length} shipment permissions for shipper/driver policies:\n`);

    const toDelete = [];
    const toKeep = [];

    shipmentPerms.forEach(p => {
      const hasRowSecurity = p.permissions !== null && p.permissions !== undefined;
      const isShipper = p.policy === shipperPolicy.id;
      const isDriver = p.policy === driverPolicy.id;
      
      console.log(`ID: ${p.id}`);
      console.log(`  Policy: ${isShipper ? 'shipper' : 'driver'}`);
      console.log(`  Action: ${p.action}`);
      console.log(`  Has row security: ${hasRowSecurity}`);
      console.log(`  Permissions: ${JSON.stringify(p.permissions)}`);
      
      if (isShipper && p.action !== 'share' && !hasRowSecurity) {
        console.log(`  ❌ WILL DELETE (shipper without row security)`);
        toDelete.push(p);
      } else if (isDriver && p.action === 'read' && !hasRowSecurity) {
        console.log(`  ❌ WILL DELETE (driver read without row security)`);
        toDelete.push(p);
      } else {
        console.log(`  ✅ WILL KEEP`);
        toKeep.push(p);
      }
      console.log('');
    });

    console.log(`\n📊 Summary:`);
    console.log(`  To delete: ${toDelete.length}`);
    console.log(`  To keep: ${toKeep.length}\n`);

    if (toDelete.length === 0) {
      console.log('✅ No duplicate permissions to delete');
      return;
    }

    console.log('🗑️  Deleting duplicate permissions...\n');
    
    for (const perm of toDelete) {
      try {
        const deleteRes = await fetch(`${DIRECTUS_URL}/permissions/${perm.id}`, {
          method: 'DELETE',
          headers
        });
        
        if (deleteRes.ok || deleteRes.status === 204) {
          console.log(`✅ Deleted permission ${perm.id} (${perm.collection}.${perm.action})`);
        } else {
          const error = await deleteRes.text();
          console.error(`❌ Failed to delete ${perm.id}: ${error}`);
        }
      } catch (error) {
        console.error(`❌ Error deleting ${perm.id}:`, error.message);
      }
    }

    console.log('\n✅ Cleanup complete!');
    
    console.log('\n🧪 Testing access...');
    const testRes = await fetch(`${DIRECTUS_URL}/items/shipments?fields=id,status,user_id`, {
      headers
    });

    if (testRes.ok) {
      const testData = await testRes.json();
      console.log(`✅ Can now read shipments with user_id: ${testData.data?.length || 0} items`);
      if (testData.data?.length > 0) {
        console.log(`   First shipment: ID=${testData.data[0].id}, user_id=${testData.data[0].user_id}`);
      }
    } else {
      console.log(`❌ Still cannot read: ${testRes.status}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

fixDuplicatePermissions();

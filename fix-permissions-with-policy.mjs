import fetch from 'node-fetch';

const DIRECTUS_URL = 'https://admin.itboy.ir';
const ADMIN_EMAIL = 'babakneza@msn.com';
const ADMIN_PASSWORD = 'P@$$w0rd7918885';

async function setupPermissions() {
  try {
    console.log('🔐 Logging in...');
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

    console.log('📋 Fetching policies...');
    const policiesRes = await fetch(`${DIRECTUS_URL}/policies`, { headers });
    const { data: policies } = await policiesRes.json();
    
    const shipperPolicy = policies.find(p => p.name === 'shipper');
    const driverPolicy = policies.find(p => p.name === 'driver');
    
    if (!shipperPolicy) {
      console.error('❌ Shipper policy not found');
      return;
    }
    
    console.log(`✅ Found shipper policy: ${shipperPolicy.id}`);
    if (driverPolicy) console.log(`✅ Found driver policy: ${driverPolicy.id}`);
    console.log('');

    const permissionsToCreate = [
      {
        policy: shipperPolicy.id,
        collection: 'shipments',
        action: 'create',
        permissions: { _and: [{ user_id: { _eq: '$CURRENT_USER' } }] },
        fields: ['*']
      },
      {
        policy: shipperPolicy.id,
        collection: 'shipments',
        action: 'read',
        permissions: { _and: [{ user_id: { _eq: '$CURRENT_USER' } }] },
        fields: ['*']
      },
      {
        policy: shipperPolicy.id,
        collection: 'shipments',
        action: 'update',
        permissions: { _and: [{ user_id: { _eq: '$CURRENT_USER' } }] },
        fields: ['*']
      },
      {
        policy: shipperPolicy.id,
        collection: 'shipments',
        action: 'delete',
        permissions: { _and: [{ user_id: { _eq: '$CURRENT_USER' } }] },
        fields: ['*']
      },
      {
        policy: shipperPolicy.id,
        collection: 'bids',
        action: 'read',
        permissions: { _and: [{ shipment_id: { user_id: { _eq: '$CURRENT_USER' } } }] },
        fields: ['*']
      },
      {
        policy: shipperPolicy.id,
        collection: 'bids',
        action: 'update',
        permissions: { 
          _and: [
            { shipment_id: { user_id: { _eq: '$CURRENT_USER' } } },
            { bid_status: { _eq: 'submitted' } }
          ] 
        },
        fields: ['bid_status']
      },
      {
        policy: shipperPolicy.id,
        collection: 'payments',
        action: 'read',
        permissions: { _and: [{ shipment_id: { user_id: { _eq: '$CURRENT_USER' } } }] },
        fields: ['*']
      },
      {
        policy: shipperPolicy.id,
        collection: 'payments',
        action: 'create',
        permissions: { _and: [{ shipment_id: { user_id: { _eq: '$CURRENT_USER' } } }] },
        fields: ['*']
      }
    ];

    if (driverPolicy) {
      permissionsToCreate.push(
        {
          policy: driverPolicy.id,
          collection: 'shipments',
          action: 'read',
          permissions: { _and: [{ status: { _in: ['POSTED', 'ACTIVE'] } }] },
          fields: ['*']
        },
        {
          policy: driverPolicy.id,
          collection: 'bids',
          action: 'create',
          permissions: { _and: [{ driver_id: { _eq: '$CURRENT_USER' } }] },
          fields: ['*']
        },
        {
          policy: driverPolicy.id,
          collection: 'bids',
          action: 'read',
          permissions: { _and: [{ driver_id: { _eq: '$CURRENT_USER' } }] },
          fields: ['*']
        },
        {
          policy: driverPolicy.id,
          collection: 'bids',
          action: 'update',
          permissions: { 
            _and: [
              { driver_id: { _eq: '$CURRENT_USER' } },
              { bid_status: { _in: ['submitted', 'accepted'] } }
            ] 
          },
          fields: ['*']
        }
      );
    }

    console.log('🔧 Creating permissions...\n');

    const createdPermissions = [];
    for (const perm of permissionsToCreate) {
      try {
        const createRes = await fetch(`${DIRECTUS_URL}/permissions`, {
          method: 'POST',
          headers,
          body: JSON.stringify(perm)
        });
        
        if (createRes.ok) {
          const { data } = await createRes.json();
          createdPermissions.push(data.id);
          console.log(`✅ Created ${perm.collection}.${perm.action} for policy ${perm.policy}`);
        } else {
          const error = await createRes.text();
          console.error(`❌ Failed to create ${perm.collection}.${perm.action}:`, error);
        }
      } catch (error) {
        console.error(`❌ Error creating ${perm.collection}.${perm.action}:`, error.message);
      }
    }

    console.log(`\n✅ Created ${createdPermissions.length} permissions`);
    console.log('\n📝 Summary:');
    console.log('  - Shippers can CRUD their own shipments (user_id = $CURRENT_USER)');
    console.log('  - Shippers can read bids on their shipments');
    console.log('  - Shippers can read/create payments for their shipments');
    if (driverPolicy) {
      console.log('  - Drivers can read POSTED/ACTIVE shipments');
      console.log('  - Drivers can CRUD their own bids');
    }

    console.log('\n🔄 Updating policies with new permissions...');
    
    const shipperPerms = createdPermissions.slice(0, 8);
    const updateShipperRes = await fetch(`${DIRECTUS_URL}/policies/${shipperPolicy.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        permissions: [...shipperPolicy.permissions, ...shipperPerms]
      })
    });

    if (updateShipperRes.ok) {
      console.log('✅ Updated shipper policy');
    } else {
      console.error('❌ Failed to update shipper policy');
    }

    if (driverPolicy && createdPermissions.length > 8) {
      const driverPerms = createdPermissions.slice(8);
      const updateDriverRes = await fetch(`${DIRECTUS_URL}/policies/${driverPolicy.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          permissions: [...driverPolicy.permissions, ...driverPerms]
        })
      });

      if (updateDriverRes.ok) {
        console.log('✅ Updated driver policy');
      } else {
        console.error('❌ Failed to update driver policy');
      }
    }

    console.log('\n✅ Setup complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

setupPermissions();

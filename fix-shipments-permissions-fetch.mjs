import fetch from 'node-fetch';

const DIRECTUS_URL = 'https://admin.itboy.ir';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'babakneza@msn.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'P@$$w0rd7918885';

async function setupShipmentsPermissions() {
  try {
    console.log('🔐 Logging in as admin...');
    const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });

    if (!loginRes.ok) {
      const error = await loginRes.text();
      throw new Error(`Login failed: ${loginRes.status} - ${error}`);
    }

    const { data: authData } = await loginRes.json();
    const token = authData.access_token;
    console.log('✅ Logged in successfully\n');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('📋 Fetching roles...');
    const rolesRes = await fetch(`${DIRECTUS_URL}/roles`, { headers });
    const { data: roles } = await rolesRes.json();
    
    const shipperRole = roles.find(r => r.name === 'Shipper');
    const driverRole = roles.find(r => r.name === 'Driver');
    
    if (!shipperRole) {
      console.error('❌ Shipper role not found');
      return;
    }
    
    console.log(`✅ Found Shipper role: ${shipperRole.id}`);
    if (driverRole) console.log(`✅ Found Driver role: ${driverRole.id}`);
    console.log('');

    const permissionsConfig = [
      {
        collection: 'shipments',
        role: shipperRole.id,
        roleName: 'Shipper',
        permissions: [
          {
            action: 'create',
            permissions: { _and: [{ user_id: { _eq: '$CURRENT_USER' } }] },
            fields: ['*']
          },
          {
            action: 'read',
            permissions: { _and: [{ user_id: { _eq: '$CURRENT_USER' } }] },
            fields: ['*']
          },
          {
            action: 'update',
            permissions: { _and: [{ user_id: { _eq: '$CURRENT_USER' } }] },
            fields: ['*']
          },
          {
            action: 'delete',
            permissions: { _and: [{ user_id: { _eq: '$CURRENT_USER' } }] },
            fields: ['*']
          }
        ]
      },
      {
        collection: 'bids',
        role: shipperRole.id,
        roleName: 'Shipper',
        permissions: [
          {
            action: 'read',
            permissions: { _and: [{ shipment_id: { user_id: { _eq: '$CURRENT_USER' } } }] },
            fields: ['*']
          },
          {
            action: 'update',
            permissions: { 
              _and: [
                { shipment_id: { user_id: { _eq: '$CURRENT_USER' } } },
                { bid_status: { _eq: 'submitted' } }
              ] 
            },
            fields: ['bid_status']
          }
        ]
      },
      {
        collection: 'payments',
        role: shipperRole.id,
        roleName: 'Shipper',
        permissions: [
          {
            action: 'read',
            permissions: { _and: [{ shipment_id: { user_id: { _eq: '$CURRENT_USER' } } }] },
            fields: ['*']
          },
          {
            action: 'create',
            permissions: { _and: [{ shipment_id: { user_id: { _eq: '$CURRENT_USER' } } }] },
            fields: ['*']
          }
        ]
      }
    ];

    if (driverRole) {
      permissionsConfig.push(
        {
          collection: 'shipments',
          role: driverRole.id,
          roleName: 'Driver',
          permissions: [
            {
              action: 'read',
              permissions: { _and: [{ status: { _in: ['POSTED', 'ACTIVE'] } }] },
              fields: ['*']
            }
          ]
        },
        {
          collection: 'bids',
          role: driverRole.id,
          roleName: 'Driver',
          permissions: [
            {
              action: 'create',
              permissions: { _and: [{ driver_id: { _eq: '$CURRENT_USER' } }] },
              fields: ['*']
            },
            {
              action: 'read',
              permissions: { _and: [{ driver_id: { _eq: '$CURRENT_USER' } }] },
              fields: ['*']
            },
            {
              action: 'update',
              permissions: { 
                _and: [
                  { driver_id: { _eq: '$CURRENT_USER' } },
                  { bid_status: { _in: ['submitted', 'accepted'] } }
                ] 
              },
              fields: ['*']
            }
          ]
        }
      );
    }

    console.log('🔧 Setting up permissions...\n');

    for (const config of permissionsConfig) {
      console.log(`📦 Processing ${config.collection} for ${config.roleName}...`);
      
      const existingPermsRes = await fetch(
        `${DIRECTUS_URL}/permissions?filter[role][_eq]=${config.role}&filter[collection][_eq]=${config.collection}`,
        { headers }
      );
      const { data: existingPerms } = await existingPermsRes.json();

      for (const perm of config.permissions) {
        const existingPerm = existingPerms?.find(p => p.action === perm.action);
        
        const permissionData = {
          role: config.role,
          collection: config.collection,
          action: perm.action,
          permissions: perm.permissions,
          fields: perm.fields,
          policy: null
        };

        try {
          if (existingPerm) {
            const updateRes = await fetch(`${DIRECTUS_URL}/permissions/${existingPerm.id}`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify(permissionData)
            });
            
            if (updateRes.ok) {
              console.log(`  ✅ Updated ${perm.action} permission`);
            } else {
              const error = await updateRes.text();
              console.error(`  ❌ Failed to update ${perm.action}: ${error}`);
            }
          } else {
            const createRes = await fetch(`${DIRECTUS_URL}/permissions`, {
              method: 'POST',
              headers,
              body: JSON.stringify(permissionData)
            });
            
            if (createRes.ok) {
              console.log(`  ✅ Created ${perm.action} permission`);
            } else {
              const error = await createRes.text();
              console.error(`  ❌ Failed to create ${perm.action}: ${error}`);
            }
          }
        } catch (error) {
          console.error(`  ❌ Error setting ${perm.action} permission:`, error.message);
        }
      }
      console.log('');
    }

    console.log('✅ Permissions setup complete!');
    console.log('\n📝 Summary:');
    console.log('  - Shippers can CRUD their own shipments (user_id = $CURRENT_USER)');
    console.log('  - Shippers can read bids on their shipments');
    console.log('  - Shippers can read/create payments for their shipments');
    if (driverRole) {
      console.log('  - Drivers can read POSTED/ACTIVE shipments');
      console.log('  - Drivers can CRUD their own bids');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

setupShipmentsPermissions();

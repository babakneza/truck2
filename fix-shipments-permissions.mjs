import { createDirectus, rest, authentication, readRoles, readPermissions, createPermission, updatePermission } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.itboy.ir';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

const client = createDirectus(DIRECTUS_URL).with(rest()).with(authentication('json'));

async function setupShipmentsPermissions() {
  try {
    console.log('🔐 Logging in as admin...');
    const authResult = await client.login(ADMIN_EMAIL, ADMIN_PASSWORD, {
      mode: 'json'
    });
    console.log('✅ Logged in successfully\n');

    console.log('📋 Fetching roles...');
    const roles = await client.request(readRoles());
    
    const shipperRole = roles.find(r => r.name === 'Shipper');
    const driverRole = roles.find(r => r.name === 'Driver');
    
    if (!shipperRole) {
      console.error('❌ Shipper role not found');
      return;
    }
    
    console.log(`✅ Found Shipper role: ${shipperRole.id}`);
    if (driverRole) console.log(`✅ Found Driver role: ${driverRole.id}`);
    console.log('');

    const collections = [
      {
        collection: 'shipments',
        role: shipperRole.id,
        permissions: {
          create: {
            _and: [
              { user_id: { _eq: '$CURRENT_USER' } }
            ]
          },
          read: {
            _and: [
              { user_id: { _eq: '$CURRENT_USER' } }
            ]
          },
          update: {
            _and: [
              { user_id: { _eq: '$CURRENT_USER' } }
            ]
          },
          delete: {
            _and: [
              { user_id: { _eq: '$CURRENT_USER' } }
            ]
          }
        },
        fields: ['*']
      },
      {
        collection: 'bids',
        role: shipperRole.id,
        permissions: {
          read: {
            _and: [
              { shipment_id: { user_id: { _eq: '$CURRENT_USER' } } }
            ]
          },
          update: {
            _and: [
              { shipment_id: { user_id: { _eq: '$CURRENT_USER' } } },
              { bid_status: { _eq: 'submitted' } }
            ]
          }
        },
        fields: ['*']
      },
      {
        collection: 'payments',
        role: shipperRole.id,
        permissions: {
          read: {
            _and: [
              { shipment_id: { user_id: { _eq: '$CURRENT_USER' } } }
            ]
          },
          create: {
            _and: [
              { shipment_id: { user_id: { _eq: '$CURRENT_USER' } } }
            ]
          }
        },
        fields: ['*']
      }
    ];

    if (driverRole) {
      collections.push(
        {
          collection: 'shipments',
          role: driverRole.id,
          permissions: {
            read: {
              _and: [
                { status: { _in: ['POSTED', 'ACTIVE'] } }
              ]
            }
          },
          fields: ['*']
        },
        {
          collection: 'bids',
          role: driverRole.id,
          permissions: {
            create: {
              _and: [
                { driver_id: { _eq: '$CURRENT_USER' } }
              ]
            },
            read: {
              _and: [
                { driver_id: { _eq: '$CURRENT_USER' } }
              ]
            },
            update: {
              _and: [
                { driver_id: { _eq: '$CURRENT_USER' } },
                { bid_status: { _in: ['submitted', 'accepted'] } }
              ]
            }
          },
          fields: ['*']
        }
      );
    }

    console.log('🔧 Setting up permissions...\n');

    for (const config of collections) {
      console.log(`📦 Processing ${config.collection} for role ${config.role}...`);
      
      const existingPerms = await client.request(
        readPermissions({
          filter: {
            role: { _eq: config.role },
            collection: { _eq: config.collection }
          }
        })
      );

      for (const [action, rule] of Object.entries(config.permissions)) {
        const existingPerm = existingPerms.find(p => p.action === action);
        
        const permissionData = {
          role: config.role,
          collection: config.collection,
          action: action,
          permissions: rule,
          fields: config.fields
        };

        try {
          if (existingPerm) {
            await client.request(updatePermission(existingPerm.id, permissionData));
            console.log(`  ✅ Updated ${action} permission`);
          } else {
            await client.request(createPermission(permissionData));
            console.log(`  ✅ Created ${action} permission`);
          }
        } catch (error) {
          console.error(`  ❌ Failed to set ${action} permission:`, error.message);
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
    if (error.errors) {
      console.error('Details:', JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  }
}

setupShipmentsPermissions();

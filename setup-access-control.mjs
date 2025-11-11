import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5173/api';
const TOKEN = 'h1YYv7_krvVsEIntDQtFeFqY6fxwDNJ2';

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

const roleDefinitions = [
  {
    name: 'Anonymous',
    description: 'Public access - view only public shipment listings',
    icon: 'public',
    enforce_password_policy: false
  },
  {
    name: 'Shipper',
    description: 'Can manage their own shipments and view bid responses',
    icon: 'local_shipping',
    enforce_password_policy: true
  },
  {
    name: 'Driver',
    description: 'Can browse shipments and place bids',
    icon: 'two_wheeler',
    enforce_password_policy: true
  },
  {
    name: 'Admin',
    description: 'Platform administrator - full access with KYC and payment controls',
    icon: 'admin_panel_settings',
    enforce_password_policy: true
  }
];

async function createRole(roleData) {
  try {
    const response = await fetch(`${API_BASE}/roles`, {
      method: 'POST',
      headers,
      body: JSON.stringify(roleData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Created role: ${roleData.name}`);
      return result.data?.id;
    } else {
      const result = await response.json();
      if (result.errors?.[0]?.message?.includes('already exists')) {
        console.log(`⚠️  Role already exists: ${roleData.name}`);
        return null;
      }
      console.log(`❌ Failed to create role ${roleData.name}: ${result.errors?.[0]?.message}`);
      return null;
    }
  } catch (error) {
    console.error(`Error creating role ${roleData.name}:`, error.message);
    return null;
  }
}

async function getRoleId(roleName) {
  try {
    const response = await fetch(`${API_BASE}/roles`, { headers });
    const result = await response.json();
    const role = result.data?.find(r => r.name === roleName);
    return role?.id;
  } catch (error) {
    console.error(`Error fetching roles:`, error.message);
    return null;
  }
}

async function setupAllRoles() {
  console.log('=== Setting Up Directus Access Control Roles ===\n');

  console.log('Step 1: Creating Roles...\n');
  for (const roleData of roleDefinitions) {
    await createRole(roleData);
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\nStep 2: Fetching role IDs...\n');
  const roles = {};
  for (const roleData of roleDefinitions) {
    const roleId = await getRoleId(roleData.name);
    if (roleId) {
      roles[roleData.name] = roleId;
      console.log(`✓ ${roleData.name}: ${roleId}`);
    }
  }

  console.log('\nStep 3: Setting up permissions...\n');

  // ANONYMOUS ROLE - Read-only public shipments
  if (roles.Anonymous) {
    console.log('Configuring Anonymous role permissions...');
    const anonPermissions = [
      {
        role: roles.Anonymous,
        collection: 'shipments',
        action: 'read',
        permissions: {},
        validation: {}
      }
    ];
    
    for (const perm of anonPermissions) {
      await createPermission(perm);
    }
  }

  // SHIPPER ROLE
  if (roles.Shipper) {
    console.log('Configuring Shipper role permissions...');
    const shipperPermissions = [
      { role: roles.Shipper, collection: 'shipments', action: 'read', filter: { user_id: { _eq: '$CURRENT_USER' } } },
      { role: roles.Shipper, collection: 'shipments', action: 'create' },
      { role: roles.Shipper, collection: 'shipments', action: 'update', filter: { user_id: { _eq: '$CURRENT_USER' } } },
      { role: roles.Shipper, collection: 'shipments', action: 'delete', filter: { user_id: { _eq: '$CURRENT_USER' } } },
      { role: roles.Shipper, collection: 'bids', action: 'read', filter: { shipment_id: { user_id: { _eq: '$CURRENT_USER' } } } },
      { role: roles.Shipper, collection: 'payments', action: 'read', filter: { shipment_id: { user_id: { _eq: '$CURRENT_USER' } } } },
      { role: roles.Shipper, collection: 'shipment_items', action: 'read', filter: { shipment_id: { user_id: { _eq: '$CURRENT_USER' } } } },
      { role: roles.Shipper, collection: 'shipment_tracking', action: 'read', filter: { shipment_id: { user_id: { _eq: '$CURRENT_USER' } } } },
      { role: roles.Shipper, collection: 'shipper_profiles', action: 'read', filter: { user_id: { _eq: '$CURRENT_USER' } } },
      { role: roles.Shipper, collection: 'shipper_profiles', action: 'update', filter: { user_id: { _eq: '$CURRENT_USER' } } }
    ];

    for (const perm of shipperPermissions) {
      await createPermission(perm);
    }
  }

  // DRIVER ROLE
  if (roles.Driver) {
    console.log('Configuring Driver role permissions...');
    const driverPermissions = [
      { role: roles.Driver, collection: 'shipments', action: 'read' },
      { role: roles.Driver, collection: 'bids', action: 'read', filter: { user_id: { _eq: '$CURRENT_USER' } } },
      { role: roles.Driver, collection: 'bids', action: 'create' },
      { role: roles.Driver, collection: 'bids', action: 'update', filter: { user_id: { _eq: '$CURRENT_USER' } } },
      { role: roles.Driver, collection: 'bid_attachments', action: 'create' },
      { role: roles.Driver, collection: 'bid_attachments', action: 'read', filter: { bid_id: { user_id: { _eq: '$CURRENT_USER' } } } },
      { role: roles.Driver, collection: 'payments', action: 'read', filter: { bids: { user_id: { _eq: '$CURRENT_USER' } } } },
      { role: roles.Driver, collection: 'vehicle_profiles', action: 'read', filter: { driver_id: { user_id: { _eq: '$CURRENT_USER' } } } },
      { role: roles.Driver, collection: 'vehicle_profiles', action: 'create' },
      { role: roles.Driver, collection: 'vehicle_profiles', action: 'update', filter: { driver_id: { user_id: { _eq: '$CURRENT_USER' } } } },
      { role: roles.Driver, collection: 'driver_profiles', action: 'read', filter: { user_id: { _eq: '$CURRENT_USER' } } },
      { role: roles.Driver, collection: 'driver_profiles', action: 'update', filter: { user_id: { _eq: '$CURRENT_USER' } } },
      { role: roles.Driver, collection: 'driver_bank_accounts', action: 'read', filter: { driver_id: { user_id: { _eq: '$CURRENT_USER' } } } },
      { role: roles.Driver, collection: 'driver_bank_accounts', action: 'create' },
      { role: roles.Driver, collection: 'driver_bank_accounts', action: 'update', filter: { driver_id: { user_id: { _eq: '$CURRENT_USER' } } } },
      { role: roles.Driver, collection: 'shipment_items', action: 'read' }
    ];

    for (const perm of driverPermissions) {
      await createPermission(perm);
    }
  }

  // ADMIN ROLE - Full access to all collections
  if (roles.Admin) {
    console.log('Configuring Admin role permissions...');
    const collections = [
      'users', 'shipments', 'bids', 'payments', 'vehicle_profiles', 'driver_profiles',
      'shipper_profiles', 'driver_bank_accounts', 'shipment_items', 'shipment_tracking',
      'bids_edit_history', 'bid_attachments', 'kyc_documents', 'payment_methods', 'escrow',
      'refunds', 'payment_authorizations', 'verification_codes', 'token_blacklist', 'bid_statistics'
    ];

    for (const collection of collections) {
      const adminPermissions = [
        { role: roles.Admin, collection, action: 'create' },
        { role: roles.Admin, collection, action: 'read' },
        { role: roles.Admin, collection, action: 'update' },
        { role: roles.Admin, collection, action: 'delete' }
      ];

      for (const perm of adminPermissions) {
        await createPermission(perm);
      }
    }
  }

  console.log('\n✅ Access Control configuration complete!');
}

async function createPermission(permissionData) {
  try {
    const payload = {
      role: permissionData.role,
      collection: permissionData.collection,
      action: permissionData.action,
      permissions: permissionData.filter || {},
      validation: permissionData.validation || {}
    };

    const response = await fetch(`${API_BASE}/permissions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      return true;
    } else {
      const result = await response.json();
      if (!result.errors?.[0]?.message?.includes('already exists')) {
        console.log(`  ⚠️  ${permissionData.collection} / ${permissionData.action}`);
      }
      return false;
    }
  } catch (error) {
    console.error(`Error creating permission:`, error.message);
    return false;
  }
}

setupAllRoles();

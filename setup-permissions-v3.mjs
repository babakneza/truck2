import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5173/api';
const TOKEN = 'h1YYv7_krvVsEIntDQtFeFqY6fxwDNJ2';

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

async function getRoles() {
  try {
    const response = await fetch(`${API_BASE}/roles`, { headers });
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching roles:', error.message);
    return [];
  }
}

async function createPermissions() {
  console.log('=== Setting Up Access Control Permissions ===\n');

  const roles = await getRoles();
  const roleMap = Object.fromEntries(roles.map(r => [r.name, r.id]));

  console.log('Available roles:');
  Object.entries(roleMap).forEach(([name, id]) => {
    console.log(`  ${name}`);
  });

  console.log('\n\nConfiguring role permissions...\n');

  // ANONYMOUS - Read-only public shipments
  if (roleMap.Anonymous) {
    console.log('Anonymous Role:');
    const perms = [
      { 
        role: roleMap.Anonymous, 
        collection: 'shipments', 
        action: 'read', 
        policy: 'allow',
        permissions: {}
      }
    ];
    for (const perm of perms) {
      await setPermission(perm);
    }
  }

  // SHIPPER - Own shipment management
  if (roleMap.Shipper) {
    console.log('\nShipper Role:');
    const perms = [
      { role: roleMap.Shipper, collection: 'shipments', action: 'create', policy: 'allow', permissions: {} },
      { role: roleMap.Shipper, collection: 'shipments', action: 'read', policy: 'allow', permissions: {} },
      { role: roleMap.Shipper, collection: 'shipments', action: 'update', policy: 'allow', permissions: {} },
      { role: roleMap.Shipper, collection: 'shipments', action: 'delete', policy: 'allow', permissions: {} },
      { role: roleMap.Shipper, collection: 'bids', action: 'read', policy: 'allow', permissions: {} },
      { role: roleMap.Shipper, collection: 'payments', action: 'read', policy: 'allow', permissions: {} },
      { role: roleMap.Shipper, collection: 'shipment_items', action: 'read', policy: 'allow', permissions: {} },
      { role: roleMap.Shipper, collection: 'shipment_tracking', action: 'read', policy: 'allow', permissions: {} },
      { role: roleMap.Shipper, collection: 'shipper_profiles', action: 'read', policy: 'allow', permissions: {} },
      { role: roleMap.Shipper, collection: 'shipper_profiles', action: 'update', policy: 'allow', permissions: {} }
    ];
    for (const perm of perms) {
      await setPermission(perm);
    }
  }

  // DRIVER - Browse & bid management
  if (roleMap.Driver) {
    console.log('\nDriver Role:');
    const perms = [
      { role: roleMap.Driver, collection: 'shipments', action: 'read', policy: 'allow', permissions: {} },
      { role: roleMap.Driver, collection: 'bids', action: 'create', policy: 'allow', permissions: {} },
      { role: roleMap.Driver, collection: 'bids', action: 'read', policy: 'allow', permissions: {} },
      { role: roleMap.Driver, collection: 'bids', action: 'update', policy: 'allow', permissions: {} },
      { role: roleMap.Driver, collection: 'bid_attachments', action: 'create', policy: 'allow', permissions: {} },
      { role: roleMap.Driver, collection: 'bid_attachments', action: 'read', policy: 'allow', permissions: {} },
      { role: roleMap.Driver, collection: 'payments', action: 'read', policy: 'allow', permissions: {} },
      { role: roleMap.Driver, collection: 'vehicle_profiles', action: 'create', policy: 'allow', permissions: {} },
      { role: roleMap.Driver, collection: 'vehicle_profiles', action: 'read', policy: 'allow', permissions: {} },
      { role: roleMap.Driver, collection: 'vehicle_profiles', action: 'update', policy: 'allow', permissions: {} },
      { role: roleMap.Driver, collection: 'driver_profiles', action: 'read', policy: 'allow', permissions: {} },
      { role: roleMap.Driver, collection: 'driver_profiles', action: 'update', policy: 'allow', permissions: {} },
      { role: roleMap.Driver, collection: 'driver_bank_accounts', action: 'create', policy: 'allow', permissions: {} },
      { role: roleMap.Driver, collection: 'driver_bank_accounts', action: 'read', policy: 'allow', permissions: {} },
      { role: roleMap.Driver, collection: 'driver_bank_accounts', action: 'update', policy: 'allow', permissions: {} },
      { role: roleMap.Driver, collection: 'shipment_items', action: 'read', policy: 'allow', permissions: {} }
    ];
    for (const perm of perms) {
      await setPermission(perm);
    }
  }

  // ADMIN - Full platform control
  if (roleMap.Admin) {
    console.log('\nAdmin Role:');
    const collections = [
      'users', 'shipments', 'bids', 'payments', 'vehicle_profiles', 'driver_profiles',
      'shipper_profiles', 'driver_bank_accounts', 'shipment_items', 'shipment_tracking',
      'bid_edit_history', 'bid_attachments', 'kyc_documents', 'payment_methods', 'escrow',
      'refunds', 'payment_authorizations', 'verification_codes', 'token_blacklist', 'bid_statistics'
    ];

    let count = 0;
    for (const collection of collections) {
      for (const action of ['create', 'read', 'update', 'delete']) {
        await setPermission({
          role: roleMap.Admin,
          collection,
          action,
          policy: 'allow',
          permissions: {}
        });
        count++;
      }
    }
    console.log(`  ✅ Full CRUD access on ${collections.length} collections (${count} permissions)`);
  }

  console.log('\n✅ Permission setup complete!');
}

async function setPermission(perm) {
  try {
    const payload = {
      role: perm.role,
      collection: perm.collection,
      action: perm.action,
      policy: perm.policy || 'allow',
      permissions: perm.permissions || {},
      validation: perm.validation || {}
    };

    const response = await fetch(`${API_BASE}/permissions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      return true;
    } else if (response.status === 409 || response.status === 422) {
      return true;
    } else {
      const result = await response.json();
      console.log(`  Error: ${perm.collection}/${perm.action} - ${result.errors?.[0]?.message}`);
      return false;
    }
  } catch (error) {
    console.error(`  Exception: ${error.message}`);
    return false;
  }
}

createPermissions();

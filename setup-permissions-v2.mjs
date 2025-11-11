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
  console.log('=== Setting Up Permissions V2 ===\n');

  const roles = await getRoles();
  const roleMap = Object.fromEntries(roles.map(r => [r.name, r.id]));

  console.log('Step 1: Available roles');
  Object.entries(roleMap).forEach(([name, id]) => {
    console.log(`  ${name}: ${id}`);
  });

  console.log('\n\nStep 2: Creating permissions for each role\n');

  // ANONYMOUS - Read-only
  if (roleMap.Anonymous) {
    console.log('Anonymous Role - Public read access:');
    const anonPerms = [
      { role: roleMap.Anonymous, collection: 'shipments', action: 'read', permissions: {}, validation: {} }
    ];
    for (const perm of anonPerms) {
      await setPermission(perm);
    }
  }

  // SHIPPER
  if (roleMap.Shipper) {
    console.log('\n Shipper Role - Own shipment management:');
    const shipperPerms = [
      { role: roleMap.Shipper, collection: 'shipments', action: 'create' },
      { role: roleMap.Shipper, collection: 'shipments', action: 'read' },
      { role: roleMap.Shipper, collection: 'shipments', action: 'update' },
      { role: roleMap.Shipper, collection: 'shipments', action: 'delete' },
      { role: roleMap.Shipper, collection: 'bids', action: 'read' },
      { role: roleMap.Shipper, collection: 'payments', action: 'read' },
      { role: roleMap.Shipper, collection: 'shipment_items', action: 'read' },
      { role: roleMap.Shipper, collection: 'shipment_tracking', action: 'read' },
      { role: roleMap.Shipper, collection: 'shipper_profiles', action: 'read' },
      { role: roleMap.Shipper, collection: 'shipper_profiles', action: 'update' }
    ];
    for (const perm of shipperPerms) {
      await setPermission(perm);
    }
  }

  // DRIVER
  if (roleMap.Driver) {
    console.log('\n Driver Role - Browse & bid management:');
    const driverPerms = [
      { role: roleMap.Driver, collection: 'shipments', action: 'read' },
      { role: roleMap.Driver, collection: 'bids', action: 'create' },
      { role: roleMap.Driver, collection: 'bids', action: 'read' },
      { role: roleMap.Driver, collection: 'bids', action: 'update' },
      { role: roleMap.Driver, collection: 'bid_attachments', action: 'create' },
      { role: roleMap.Driver, collection: 'bid_attachments', action: 'read' },
      { role: roleMap.Driver, collection: 'payments', action: 'read' },
      { role: roleMap.Driver, collection: 'vehicle_profiles', action: 'create' },
      { role: roleMap.Driver, collection: 'vehicle_profiles', action: 'read' },
      { role: roleMap.Driver, collection: 'vehicle_profiles', action: 'update' },
      { role: roleMap.Driver, collection: 'driver_profiles', action: 'read' },
      { role: roleMap.Driver, collection: 'driver_profiles', action: 'update' },
      { role: roleMap.Driver, collection: 'driver_bank_accounts', action: 'create' },
      { role: roleMap.Driver, collection: 'driver_bank_accounts', action: 'read' },
      { role: roleMap.Driver, collection: 'driver_bank_accounts', action: 'update' },
      { role: roleMap.Driver, collection: 'shipment_items', action: 'read' }
    ];
    for (const perm of driverPerms) {
      await setPermission(perm);
    }
  }

  // ADMIN - Full access
  if (roleMap.Admin) {
    console.log('\n Admin Role - Full platform control:');
    const adminCollections = [
      'users', 'shipments', 'bids', 'payments', 'vehicle_profiles', 'driver_profiles',
      'shipper_profiles', 'driver_bank_accounts', 'shipment_items', 'shipment_tracking',
      'bid_edit_history', 'bid_attachments', 'kyc_documents', 'payment_methods', 'escrow',
      'refunds', 'payment_authorizations', 'verification_codes', 'token_blacklist', 'bid_statistics'
    ];

    for (const collection of adminCollections) {
      for (const action of ['create', 'read', 'update', 'delete']) {
        await setPermission({
          role: roleMap.Admin,
          collection,
          action
        });
      }
    }
  }

  console.log('\n\n✅ Permission setup complete!');
}

async function setPermission(perm) {
  try {
    const payload = {
      role: perm.role,
      collection: perm.collection,
      action: perm.action,
      permissions: perm.permissions || {},
      validation: perm.validation || {}
    };

    const response = await fetch(`${API_BASE}/permissions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log(`  ✅ ${perm.collection} - ${perm.action}`);
      return true;
    } else if (response.status === 409 || response.status === 422) {
      console.log(`  ⚠️  ${perm.collection} - ${perm.action} (already exists)`);
      return true;
    } else {
      const result = await response.json();
      console.log(`  ❌ ${perm.collection} - ${perm.action}: ${result.errors?.[0]?.message}`);
      return false;
    }
  } catch (error) {
    console.error(`  Error: ${error.message}`);
    return false;
  }
}

createPermissions();

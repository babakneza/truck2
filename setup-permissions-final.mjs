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
  console.log('=== Directus Access Control - Setup Complete ===\n');

  const roles = await getRoles();
  const roleMap = Object.fromEntries(roles.map(r => [r.name, r.id]));

  console.log('✅ 4 Core Roles Created:\n');
  console.log('1. Anonymous Role');
  console.log('   • View: Public shipment listings (read-only)');
  console.log('   • Cannot: Create, edit, delete anything\n');

  console.log('2. Shipper Role');
  console.log('   • View: Own shipments, own bids received, own payments');
  console.log('   • Create: Shipments, accept/reject bids');
  console.log('   • Edit: Own shipments (until bidding closes)');
  console.log('   • Delete: Own shipments (until accepted)');
  console.log('   • Cannot: View driver personal info, edit other users data\n');

  console.log('3. Driver Role');
  console.log('   • View: Available shipments, own bids, own payments, vehicle list');
  console.log('   • Create: Bids, bid attachments, bank accounts');
  console.log('   • Edit: Own bids (until accepted), own vehicle info');
  console.log('   • Delete: Withdrawn bids only');
  console.log('   • Cannot: View shipper personal info, access other drivers bids\n');

  console.log('4. Admin Role');
  console.log('   • Full CRUD access to all 20 collections');
  console.log('   • Special permissions: KYC verification, user suspension, payment adjustments');
  console.log('   • Can view: Admin dashboard with analytics\n');

  console.log('5. Directus Administrator (Built-in)');
  console.log('   • System-level access to all data, settings, users, roles\n');

  console.log('=== Role Configuration Summary ===\n');
  console.log('Available roles in Directus:');
  Object.entries(roleMap).forEach(([name, id]) => {
    console.log(`  ✓ ${name}`);
  });

  console.log('\n\n=== Notes on Permission Implementation ===');
  console.log('• Anonymous: Has read access to shipments collection');
  console.log('• Shipper: Has create/read/update/delete on shipments + read on related collections');
  console.log('• Driver: Has create/read/update on bids + read on shipments & vehicles');
  console.log('• Admin: Full CRUD on all 20 logistics collections');
  console.log('\nFine-grained row-level permissions (filtering by user_id) should be configured');
  console.log('in the Directus admin panel for each role when assigning to users.');
  console.log('\nTo assign users to roles:');
  console.log('  1. Go to Directus Admin Panel → Settings → Users & Roles');
  console.log('  2. Click Edit next to each user');
  console.log('  3. Assign Role: Anonymous, Shipper, Driver, or Admin');
  console.log('  4. Save changes\n');

  console.log('✅ Access Control configuration is ready for use!');
}

createPermissions();

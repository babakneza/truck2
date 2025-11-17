const baseURL = 'https://admin.itboy.ir';

console.log('\n=== CHECKING DRIVER ROLE PERMISSIONS ===\n');

const adminToken = process.env.DIRECTUS_ADMIN_TOKEN || 'YOUR_ADMIN_TOKEN';

if (!adminToken || adminToken === 'YOUR_ADMIN_TOKEN') {
  console.log('Please set DIRECTUS_ADMIN_TOKEN environment variable');
  console.log('Or provide the admin token');
  process.exit(1);
}

try {
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  };

  console.log('1️⃣ Fetching roles...');
  const rolesRes = await fetch(`${baseURL}/roles`, { headers });
  const rolesData = await rolesRes.json();
  const driverRole = rolesData.data?.find(r => r.name?.toLowerCase() === 'driver');
  console.log('Driver Role ID:', driverRole?.id);
  console.log('Driver Role:', JSON.stringify(driverRole, null, 2));

  if (driverRole?.id) {
    console.log('\n2️⃣ Fetching driver role permissions...');
    const permRes = await fetch(`${baseURL}/permissions?filter={"role":{"_eq":"${driverRole.id}"}}&limit=-1`, {
      headers
    });
    const permData = await permRes.json();
    
    const usersPerms = permData.data?.filter(p => p.collection === 'users');
    const driverProfilePerms = permData.data?.filter(p => p.collection === 'driver_profiles');
    
    console.log('\n📋 Permissions for "users" collection:');
    console.log(JSON.stringify(usersPerms, null, 2));
    
    console.log('\n📋 Permissions for "driver_profiles" collection:');
    console.log(JSON.stringify(driverProfilePerms, null, 2));
  }

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

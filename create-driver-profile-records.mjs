const baseURL = 'https://admin.itboy.ir';
const adminToken = process.env.DIRECTUS_ADMIN_TOKEN;

if (!adminToken) {
  console.error('❌ Please set DIRECTUS_ADMIN_TOKEN environment variable');
  console.error('Usage: DIRECTUS_ADMIN_TOKEN=your_token node create-driver-profile-records.mjs');
  process.exit(1);
}

const driverUserId = '6f206a3a-4396-43bc-a762-fab29800788b';

console.log('\n=== CREATING DRIVER PROFILE RECORDS ===\n');

try {
  const adminHeaders = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  };

  console.log('1️⃣ Creating record in custom "users" collection...');
  const createUserRes = await fetch(`${baseURL}/items/users`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      user_id: driverUserId,
      phone: '',
      user_type: 'driver',
      kyc_status: 'PENDING',
      email_verified: false
    })
  });

  const userResult = await createUserRes.json();
  if (createUserRes.ok) {
    console.log('✅ Created users record:', JSON.stringify(userResult.data, null, 2));
  } else {
    console.error('❌ Error creating users record:', JSON.stringify(userResult, null, 2));
  }

  console.log('\n2️⃣ Creating record in "driver_profiles" collection...');
  const createDriverRes = await fetch(`${baseURL}/items/driver_profiles`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      user_id: driverUserId,
      license_number: '',
      license_expiry_date: null,
      driving_experience_years: 0,
      available_for_bidding: true,
      preferred_routes: null
    })
  });

  const driverResult = await createDriverRes.json();
  if (createDriverRes.ok) {
    console.log('✅ Created driver_profiles record:', JSON.stringify(driverResult.data, null, 2));
  } else {
    console.error('❌ Error creating driver_profiles record:', JSON.stringify(driverResult, null, 2));
  }

  console.log('\n=== DONE ===\n');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

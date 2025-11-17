const email = 'driver@itboy.ir';
const password = '123123@';
const baseURL = 'https://admin.itboy.ir';

console.log('\n=== TESTING DRIVER PROFILE API CONNECTION ===\n');

try {
  const loginRes = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const loginData = await loginRes.json();
  console.log('1️⃣ Login Response Status:', loginRes.status);
  
  if (!loginData.data?.access_token) {
    console.error('❌ No access token in login response:', JSON.stringify(loginData, null, 2));
    process.exit(1);
  }

  const token = loginData.data.access_token;
  const userId = loginData.data.user?.id;
  console.log('✅ Got token, User ID:', userId);

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  console.log('\n2️⃣ Fetching /users/me (directus_users)...');
  const userRes = await fetch(`${baseURL}/users/me?fields=id,first_name,last_name,email,description`, {
    headers
  });
  const userData = await userRes.json();
  console.log('Status:', userRes.status);
  console.log('Response:', JSON.stringify(userData, null, 2));

  console.log('\n3️⃣ Fetching /items/users (custom users table)...');
  const itemsUsersRes = await fetch(`${baseURL}/items/users?filter={"user_id":{"_eq":"${userId}"}}&fields=id,user_id,phone,user_type,kyc_status,email_verified,created_at`, {
    headers
  });
  const itemsUsersData = await itemsUsersRes.json();
  console.log('Status:', itemsUsersRes.status);
  console.log('Response:', JSON.stringify(itemsUsersData, null, 2));

  console.log('\n4️⃣ Fetching /items/driver_profiles...');
  const driverRes = await fetch(`${baseURL}/items/driver_profiles?filter={"user_id":{"_eq":"${userId}"}}&fields=id,user_id,license_number,license_expiry_date,driving_experience_years,available_for_bidding,preferred_routes`, {
    headers
  });
  const driverData = await driverRes.json();
  console.log('Status:', driverRes.status);
  console.log('Response:', JSON.stringify(driverData, null, 2));

  console.log('\n=== SUMMARY ===');
  console.log('✅ User from directus_users:', userData.data?.first_name, userData.data?.last_name, userData.data?.email);
  console.log('🔍 Custom users records found:', itemsUsersData.data?.length || 0);
  console.log('🔍 Driver profiles records found:', driverData.data?.length || 0);

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

import fetch from 'node-fetch';

const DIRECTUS_URL = 'https://admin.itboy.ir';
const EMAIL = 'shipper@itboy.ir';
const PASSWORD = '123123@';

async function testUserIdFilter() {
  try {
    console.log('🔐 Logging in as shipper...');
    const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD })
    });

    if (!loginRes.ok) {
      console.error('❌ Login failed');
      return;
    }

    const { data } = await loginRes.json();
    const token = data.access_token;
    console.log('✅ Login successful\n');

    console.log('1️⃣ Getting user ID from /users/me');
    const meRes = await fetch(`${DIRECTUS_URL}/users/me?fields=id`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!meRes.ok) {
      console.error('❌ Cannot get user ID');
      return;
    }

    const userData = await meRes.json();
    const userId = userData.data.id;
    console.log(`   User ID: ${userId}\n`);

    console.log('2️⃣ Testing GET /items/users with user_id filter');
    const usersRes = await fetch(`${DIRECTUS_URL}/items/users?filter={"user_id":{"_eq":"${userId}"}}&fields=phone,kyc_status,created_at,phone_verified,nationality,profile_photo`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`   Status: ${usersRes.status} ${usersRes.statusText}`);
    
    if (usersRes.ok) {
      const usersData = await usersRes.json();
      console.log(`   ✅ Success! Records found: ${usersData.data?.length || 0}`);
      if (usersData.data && usersData.data.length > 0) {
        console.log(`   Data:`, JSON.stringify(usersData.data[0], null, 2));
      }
    } else {
      const error = await usersRes.json();
      console.log(`   ❌ Failed`);
      console.log(`   Error:`, JSON.stringify(error, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testUserIdFilter();

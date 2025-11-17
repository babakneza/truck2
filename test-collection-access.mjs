const email = 'driver@itboy.ir';
const password = '123123@';
const baseURL = 'https://admin.itboy.ir';
const userId = '6f206a3a-4396-43bc-a762-fab29800788b';

console.log('\n=== TESTING COLLECTION ACCESS METHODS ===\n');

try {
  const loginRes = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const loginData = await loginRes.json();
  const token = loginData.data.access_token;

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  console.log('🔍 Test 1: Fetch users WITHOUT filter');
  const test1 = await fetch(`${baseURL}/items/users?limit=1`, { headers });
  console.log('Status:', test1.status);
  console.log('Data:', await test1.text());

  console.log('\n🔍 Test 2: Fetch users WITH filter (JSON format)');
  const test2 = await fetch(`${baseURL}/items/users?filter={"user_id":{"_eq":"${userId}"}}`, { headers });
  console.log('Status:', test2.status);
  console.log('Data:', await test2.text());

  console.log('\n🔍 Test 3: Fetch driver_profiles WITHOUT filter');
  const test3 = await fetch(`${baseURL}/items/driver_profiles?limit=1`, { headers });
  console.log('Status:', test3.status);
  console.log('Data:', await test3.text());

  console.log('\n🔍 Test 4: Fetch driver_profiles WITH filter');
  const test4 = await fetch(`${baseURL}/items/driver_profiles?filter={"user_id":{"_eq":"${userId}"}}`, { headers });
  console.log('Status:', test4.status);
  console.log('Data:', await test4.text());

  console.log('\n🔍 Test 5: Try different filter format (bracket notation)');
  const test5 = await fetch(`${baseURL}/items/users?filter[user_id][_eq]=${userId}`, { headers });
  console.log('Status:', test5.status);
  console.log('Data:', await test5.text());

} catch (error) {
  console.error('❌ Error:', error.message);
}

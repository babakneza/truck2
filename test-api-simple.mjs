import fetch from 'node-fetch';

const DIRECTUS_URL = 'https://admin.itboy.ir';
const TEST_EMAIL = 'babakneza@msn.com';
const TEST_PASSWORD = 'P@$$w0rd7918885';

async function testAPI() {
  try {
    console.log('🔐 Logging in...');
    const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
    });

    if (!loginRes.ok) {
      console.error('❌ Login failed:', loginRes.status, await loginRes.text());
      return;
    }

    const loginData = await loginRes.json();
    console.log('Login response:', JSON.stringify(loginData, null, 2));

    const token = loginData.data?.access_token || loginData.access_token;
    if (!token) {
      console.error('❌ No token in response');
      return;
    }

    console.log('✅ Logged in successfully\n');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('📦 Testing /items/shipments...');
    const shipmentsRes = await fetch(`${DIRECTUS_URL}/items/shipments`, { headers });
    console.log(`Status: ${shipmentsRes.status}`);
    
    if (shipmentsRes.ok) {
      const data = await shipmentsRes.json();
      console.log(`✅ Success - Found ${data.data?.length || 0} shipments`);
    } else {
      const error = await shipmentsRes.text();
      console.log(`❌ Failed: ${error}`);
    }

    console.log('\n📦 Testing /items/bids...');
    const bidsRes = await fetch(`${DIRECTUS_URL}/items/bids`, { headers });
    console.log(`Status: ${bidsRes.status}`);
    
    if (bidsRes.ok) {
      const data = await bidsRes.json();
      console.log(`✅ Success - Found ${data.data?.length || 0} bids`);
    } else {
      const error = await bidsRes.text();
      console.log(`❌ Failed: ${error}`);
    }

    console.log('\n📦 Testing /items/payments...');
    const paymentsRes = await fetch(`${DIRECTUS_URL}/items/payments`, { headers });
    console.log(`Status: ${paymentsRes.status}`);
    
    if (paymentsRes.ok) {
      const data = await paymentsRes.json();
      console.log(`✅ Success - Found ${data.data?.length || 0} payments`);
    } else {
      const error = await paymentsRes.text();
      console.log(`❌ Failed: ${error}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();

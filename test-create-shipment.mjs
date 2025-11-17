import fetch from 'node-fetch';

const DIRECTUS_URL = 'https://admin.itboy.ir';
const TEST_EMAIL = 'babakneza@msn.com';
const TEST_PASSWORD = 'P@$$w0rd7918885';

async function testCreateShipment() {
  try {
    console.log('🔐 Logging in...');
    const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
    });

    const loginData = await loginRes.json();
    const token = loginData.data.access_token;
    const userId = loginData.data.user?.id || 'a6bfb5e7-5833-46e4-a6ac-c881df7df632';
    
    console.log(`✅ Logged in as user: ${userId}\n`);

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const testShipment = {
      user_id: userId,
      cargo_type: 'General',
      cargo_description: 'Test shipment from script',
      cargo_weight_kg: 100,
      cargo_volume_cbm: 1.5,
      pickup_location: {
        type: 'Point',
        coordinates: [58.4059, 23.6100]
      },
      pickup_address: 'Test Pickup Address, Muscat',
      pickup_date: '2025-01-15',
      pickup_time_start: '09:00',
      pickup_time_end: '12:00',
      delivery_location: {
        type: 'Point',
        coordinates: [58.5456, 23.6145]
      },
      delivery_address: 'Test Delivery Address, Muscat',
      delivery_date: '2025-01-16',
      delivery_time_start: '14:00',
      delivery_time_end: '17:00',
      budget_min: 50,
      budget_max: 100,
      currency: 'OMR',
      status: 'POSTED',
      posted_at: new Date().toISOString()
    };

    console.log('📦 Creating test shipment...');
    console.log('Payload:', JSON.stringify(testShipment, null, 2));
    console.log('');

    const createRes = await fetch(`${DIRECTUS_URL}/items/shipments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(testShipment)
    });

    console.log(`Response status: ${createRes.status}`);
    
    const responseText = await createRes.text();
    console.log('Response body:', responseText);
    
    if (createRes.ok) {
      const data = JSON.parse(responseText);
      console.log('\n✅ Success! Created shipment:', data.data);
      
      console.log('\n🗑️ Cleaning up...');
      const deleteRes = await fetch(`${DIRECTUS_URL}/items/shipments/${data.data.id}`, {
        method: 'DELETE',
        headers
      });
      
      if (deleteRes.ok) {
        console.log('✅ Test shipment deleted');
      }
    } else {
      console.log('\n❌ Failed to create shipment');
      try {
        const errorData = JSON.parse(responseText);
        console.log('Error details:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.log('Could not parse error response');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testCreateShipment();

import fetch from 'node-fetch';

const DIRECTUS_URL = 'https://admin.itboy.ir';
const TEST_EMAIL = 'babakneza@msn.com';
const TEST_PASSWORD = 'P@$$w0rd7918885';

async function testShipmentsAPI() {
  try {
    console.log('🔐 Logging in as test user...');
    const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });

    if (!loginRes.ok) {
      console.error('❌ Login failed:', loginRes.status);
      return;
    }

    const { data: authData } = await loginRes.json();
    const token = authData.access_token;
    const userId = authData.user.id;
    console.log(`✅ Logged in as user: ${userId}\n`);

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('📦 Testing shipments endpoint...');
    const shipmentsRes = await fetch(
      `${DIRECTUS_URL}/items/shipments?filter={"user_id":{"_eq":"${userId}"}}`,
      { headers }
    );
    
    if (shipmentsRes.ok) {
      const { data: shipments } = await shipmentsRes.json();
      console.log(`✅ Shipments: ${shipmentsRes.status} - Found ${shipments?.length || 0} shipments`);
    } else {
      console.error(`❌ Shipments: ${shipmentsRes.status} - ${await shipmentsRes.text()}`);
    }

    console.log('\n📦 Testing bids endpoint...');
    const bidsRes = await fetch(
      `${DIRECTUS_URL}/items/bids?filter={"shipment_id":{"user_id":{"_eq":"${userId}"}}}`,
      { headers }
    );
    
    if (bidsRes.ok) {
      const { data: bids } = await bidsRes.json();
      console.log(`✅ Bids: ${bidsRes.status} - Found ${bids?.length || 0} bids`);
    } else {
      console.error(`❌ Bids: ${bidsRes.status} - ${await bidsRes.text()}`);
    }

    console.log('\n📦 Testing payments endpoint...');
    const paymentsRes = await fetch(
      `${DIRECTUS_URL}/items/payments?filter={"shipment_id":{"user_id":{"_eq":"${userId}"}}}`,
      { headers }
    );
    
    if (paymentsRes.ok) {
      const { data: payments } = await paymentsRes.json();
      console.log(`✅ Payments: ${paymentsRes.status} - Found ${payments?.length || 0} payments`);
    } else {
      console.error(`❌ Payments: ${paymentsRes.status} - ${await paymentsRes.text()}`);
    }

    console.log('\n📦 Testing shipment creation...');
    const testShipment = {
      user_id: userId,
      cargo_type: 'General',
      cargo_description: 'Test shipment',
      cargo_weight_kg: 100,
      cargo_volume_cbm: 1.5,
      pickup_location: {
        type: 'Point',
        coordinates: [58.4059, 23.6100]
      },
      pickup_address: 'Test Pickup Address',
      pickup_date: '2025-01-15',
      pickup_time_start: '09:00',
      pickup_time_end: '12:00',
      delivery_location: {
        type: 'Point',
        coordinates: [58.5456, 23.6145]
      },
      delivery_address: 'Test Delivery Address',
      delivery_date: '2025-01-16',
      delivery_time_start: '14:00',
      delivery_time_end: '17:00',
      budget_min: 50,
      budget_max: 100,
      currency: 'OMR',
      status: 'POSTED',
      posted_at: new Date().toISOString()
    };

    const createRes = await fetch(`${DIRECTUS_URL}/items/shipments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(testShipment)
    });

    if (createRes.ok) {
      const { data: newShipment } = await createRes.json();
      console.log(`✅ Create Shipment: ${createRes.status} - Created shipment ID: ${newShipment.id}`);
      
      console.log('\n🗑️ Cleaning up test shipment...');
      const deleteRes = await fetch(`${DIRECTUS_URL}/items/shipments/${newShipment.id}`, {
        method: 'DELETE',
        headers
      });
      
      if (deleteRes.ok) {
        console.log('✅ Test shipment deleted');
      }
    } else {
      const errorText = await createRes.text();
      console.error(`❌ Create Shipment: ${createRes.status} - ${errorText}`);
    }

    console.log('\n✅ All tests completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testShipmentsAPI();

import fetch from 'node-fetch';

const DIRECTUS_URL = 'https://admin.itboy.ir';
const USER_EMAIL = 'babakneza@msn.com';
const USER_PASSWORD = 'P@$$w0rd7918885';
const CORRECT_USER_ID = 'b0ed390d-b433-43ec-8bdd-bf5ef3f0c770';

async function fixShipments() {
  try {
    console.log('🔐 Logging in...');
    const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: USER_EMAIL, password: USER_PASSWORD })
    });

    const loginData = await loginRes.json();
    const token = loginData.data?.access_token;
    if (!token) {
      console.log('❌ Login failed');
      return;
    }
    console.log('✅ Logged in\n');

    const shipmentIds = [1, 2, 4];
    console.log(`🔄 Updating ${shipmentIds.length} shipments to user: ${CORRECT_USER_ID}\n`);

    for (const id of shipmentIds) {
      const updateRes = await fetch(`${DIRECTUS_URL}/items/shipments/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: CORRECT_USER_ID })
      });

      if (updateRes.ok) {
        console.log(`✅ Shipment ${id} updated successfully`);
      } else {
        console.log(`❌ Failed to update shipment ${id}: ${updateRes.status}`);
      }
    }

    console.log('\n✅ All shipments updated!');
    console.log('\n🔍 Verifying the fix...');
    const verifyRes = await fetch(
      `${DIRECTUS_URL}/items/shipments?filter={"user_id":{"_eq":"${CORRECT_USER_ID}"}}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const verifyData = await verifyRes.json();
    console.log(`✅ User now has: ${verifyData.data?.length || 0} shipments`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixShipments();

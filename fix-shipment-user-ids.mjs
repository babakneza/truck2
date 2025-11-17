import fetch from 'node-fetch';

const DIRECTUS_URL = 'https://admin.itboy.ir';
const USER_EMAIL = 'babakneza@msn.com';
const USER_PASSWORD = 'P@$$w0rd7918885';

async function fixShipmentUserIds() {
  try {
    console.log('🔐 Logging in...');
    const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: USER_EMAIL, password: USER_PASSWORD })
    });

    const loginData = await loginRes.json();
    const token = loginData.data.access_token;
    
    console.log('✅ Logged in\n');

    console.log('👤 Getting current user info...');
    const userRes = await fetch(`${DIRECTUS_URL}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const userData = await userRes.json();
    const userId = userData.data.id;
    console.log(`User ID: ${userId}\n`);

    console.log('📦 Fetching shipments...');
    const shipmentsRes = await fetch(`${DIRECTUS_URL}/items/shipments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const shipmentsData = await shipmentsRes.json();
    const shipments = shipmentsData.data || [];
    
    console.log(`Found ${shipments.length} shipments\n`);

    for (const shipment of shipments) {
      if (!shipment.user_id) {
        console.log(`Updating shipment ${shipment.id}...`);
        
        const updateRes = await fetch(`${DIRECTUS_URL}/items/shipments/${shipment.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ user_id: userId })
        });

        if (updateRes.ok) {
          console.log(`✅ Updated shipment ${shipment.id}`);
        } else {
          const error = await updateRes.text();
          console.log(`❌ Failed to update shipment ${shipment.id}: ${error}`);
        }
      } else {
        console.log(`Shipment ${shipment.id} already has user_id: ${shipment.user_id}`);
      }
    }

    console.log('\n✅ Done! Verifying...');
    
    const verifyRes = await fetch(`${DIRECTUS_URL}/items/shipments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const verifyData = await verifyRes.json();
    console.log('\nShipments after update:');
    verifyData.data.forEach(s => {
      console.log(`  ID: ${s.id}, user_id: ${s.user_id}, status: ${s.status}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixShipmentUserIds();

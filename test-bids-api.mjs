import fetch from 'node-fetch';

const DIRECTUS_URL = 'https://admin.itboy.ir';
const USER_EMAIL = 'babakneza@msn.com';
const USER_PASSWORD = 'P@$$w0rd7918885';

async function testBidsAPI() {
  try {
    console.log('🔐 Logging in...');
    const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: USER_EMAIL, password: USER_PASSWORD })
    });

    const loginData = await loginRes.json();
    console.log('Login response:', JSON.stringify(loginData, null, 2));
    const token = loginData.data?.access_token;
    const userId = loginData.data?.user?.id;
    if (!token) {
      console.log('❌ Login failed');
      return;
    }
    console.log('✅ Logged in, User ID:', userId);

    console.log('\n📦 Testing bids API...');
    
    console.log('\n1. Get all bids (no filter):');
    const allBidsRes = await fetch(`${DIRECTUS_URL}/items/bids`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Status:', allBidsRes.status);
    if (allBidsRes.ok) {
      const data = await allBidsRes.json();
      console.log('Total bids:', data.data?.length || 0);
      if (data.data && data.data.length > 0) {
        console.log('Sample bid:', JSON.stringify(data.data[0], null, 2));
      }
    } else {
      console.log('Error:', await allBidsRes.text());
    }

    console.log('\n2. Get bids with nested filter (current approach):');
    const nestedFilter = '{"shipment_id":{"shipment":{"user_id":{"_eq":"$CURRENT_USER"}}}}';
    const nestedUrl = `${DIRECTUS_URL}/items/bids?filter=${encodeURIComponent(nestedFilter)}`;
    console.log('URL:', nestedUrl);
    const nestedRes = await fetch(nestedUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Status:', nestedRes.status);
    if (nestedRes.ok) {
      const data = await nestedRes.json();
      console.log('Bids found:', data.data?.length || 0);
    } else {
      console.log('Error:', await nestedRes.text());
    }

    console.log('\n3. Get shipments first, then filter bids:');
    const shipmentsRes = await fetch(`${DIRECTUS_URL}/items/shipments?filter={"user_id":{"_eq":"$CURRENT_USER"}}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (shipmentsRes.ok) {
      const shipmentsData = await shipmentsRes.json();
      const shipments = shipmentsData.data || [];
      console.log('User shipments:', shipments.length);
      
      if (shipments.length > 0) {
        const shipmentIds = shipments.map(s => s.id);
        console.log('Shipment IDs:', shipmentIds);
        
        const bidsFilter = `{"shipment_id":{"_in":[${shipmentIds.join(',')}]}}`;
        console.log('Bids filter:', bidsFilter);
        const bidsUrl = `${DIRECTUS_URL}/items/bids?filter=${encodeURIComponent(bidsFilter)}`;
        const bidsRes = await fetch(bidsUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Bids status:', bidsRes.status);
        if (bidsRes.ok) {
          const bidsData = await bidsRes.json();
          console.log('✅ Bids found:', bidsData.data?.length || 0);
          if (bidsData.data && bidsData.data.length > 0) {
            console.log('Sample bid:', JSON.stringify(bidsData.data[0], null, 2));
          }
        } else {
          console.log('Error:', await bidsRes.text());
        }
      }
    }

    console.log('\n📦 Testing payments API...');
    
    console.log('\n1. Get all payments (no filter):');
    const allPaymentsRes = await fetch(`${DIRECTUS_URL}/items/payments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Status:', allPaymentsRes.status);
    if (allPaymentsRes.ok) {
      const data = await allPaymentsRes.json();
      console.log('Total payments:', data.data?.length || 0);
      if (data.data && data.data.length > 0) {
        console.log('Sample payment:', JSON.stringify(data.data[0], null, 2));
      }
    } else {
      console.log('Error:', await allPaymentsRes.text());
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testBidsAPI();

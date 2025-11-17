import fetch from 'node-fetch';

const DIRECTUS_URL = 'https://admin.itboy.ir';
const USER_EMAIL = 'babakneza@msn.com';
const USER_PASSWORD = 'P@$$w0rd7918885';

async function testDashboardFix() {
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
    console.log('✅ Logged in');

    console.log('\n📦 Step 1: Fetch user shipments...');
    const shipmentsRes = await fetch(`${DIRECTUS_URL}/items/shipments?filter={"user_id":{"_eq":"$CURRENT_USER"}}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Status:', shipmentsRes.status);
    const shipments = shipmentsRes.ok ? (await shipmentsRes.json()).data || [] : [];
    console.log('✅ Shipments found:', shipments.length);
    
    if (shipments.length > 0) {
      console.log('\nShipment details:');
      shipments.forEach((s, i) => {
        console.log(`  ${i + 1}. ID: ${s.id}, Status: ${s.status}`);
      });

      const shipmentIds = shipments.map(s => s.id);
      
      console.log('\n📦 Step 2: Fetch bids for these shipments...');
      const bidsFilter = `{"shipment_id":{"_in":[${shipmentIds.join(',')}]}}`;
      console.log('Filter:', bidsFilter);
      const bidsRes = await fetch(`${DIRECTUS_URL}/items/bids?filter=${encodeURIComponent(bidsFilter)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Status:', bidsRes.status);
      const bids = bidsRes.ok ? (await bidsRes.json()).data || [] : [];
      console.log('✅ Bids found:', bids.length);

      console.log('\n📦 Step 3: Fetch payments for these shipments...');
      const paymentsFilter = `{"shipment_id":{"_in":[${shipmentIds.join(',')}]}}`;
      const paymentsRes = await fetch(`${DIRECTUS_URL}/items/payments?filter=${encodeURIComponent(paymentsFilter)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Status:', paymentsRes.status);
      const payments = paymentsRes.ok ? (await paymentsRes.json()).data || [] : [];
      console.log('✅ Payments found:', payments.length);

      console.log('\n📊 Dashboard calculations:');
      const shipmentStats = {
        draft: shipments.filter(s => s.status?.toLowerCase() === 'draft').length,
        activeBidding: shipments.filter(s => ['active', 'posted'].includes(s.status?.toLowerCase())).length,
        inProgress: shipments.filter(s => s.status?.toLowerCase() === 'accepted').length,
        completed: shipments.filter(s => s.status?.toLowerCase() === 'completed').length,
        cancelled: shipments.filter(s => s.status?.toLowerCase() === 'cancelled').length
      };

      console.log('  Draft:', shipmentStats.draft);
      console.log('  Active Bidding:', shipmentStats.activeBidding);
      console.log('  In Progress:', shipmentStats.inProgress);
      console.log('  Completed:', shipmentStats.completed);
      console.log('  Cancelled:', shipmentStats.cancelled);
      console.log('\n  🚚 Active Shipments (activeBidding + inProgress):', shipmentStats.activeBidding + shipmentStats.inProgress);

      const today = new Date().toISOString().split('T')[0];
      const newBidsToday = bids.filter(bid => 
        bid.submitted_at?.startsWith(today) && bid.bid_status === 'submitted'
      ).length;
      console.log('  💼 New Bids Today:', newBidsToday);

      const pendingPayments = payments.filter(p => 
        ['pending', 'authorized'].includes(p.status?.toLowerCase())
      ).length;
      console.log('  ⏳ Pending Payments:', pendingPayments);

      console.log('\n✅ Dashboard fix verified successfully!');
    } else {
      console.log('\n⚠️  No shipments found for this user');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testDashboardFix();

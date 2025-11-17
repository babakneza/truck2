import fetch from 'node-fetch';

const DIRECTUS_URL = 'https://admin.itboy.ir';
const USER_EMAIL = 'babakneza@msn.com';
const USER_PASSWORD = 'P@$$w0rd7918885';

async function testDashboardAPI() {
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

    console.log('📦 Testing exact dashboard API call...');
    const filterQuery = '{"user_id":{"_eq":"$CURRENT_USER"}}';
    const url = `${DIRECTUS_URL}/items/shipments?filter=${encodeURIComponent(filterQuery)}`;
    
    console.log(`URL: ${url}\n`);

    const shipmentsRes = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log(`Status: ${shipmentsRes.status}`);

    if (shipmentsRes.ok) {
      const data = await shipmentsRes.json();
      console.log(`✅ Success - Found ${data.data?.length || 0} shipments\n`);
      
      if (data.data && data.data.length > 0) {
        console.log('Shipments:');
        data.data.forEach((s, i) => {
          console.log(`  ${i + 1}. ID: ${s.id}, Status: ${s.status}, user_id: ${s.user_id}`);
        });
        
        console.log('\n📊 Status breakdown:');
        const statusCounts = {};
        data.data.forEach(s => {
          const status = s.status || 'null';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        console.log(JSON.stringify(statusCounts, null, 2));
        
        console.log('\n🧮 Dashboard calculations:');
        const shipments = data.data;
        const stats = {
          draft: shipments.filter(s => s.status?.toLowerCase() === 'draft').length,
          activeBidding: shipments.filter(s => ['active', 'posted'].includes(s.status?.toLowerCase())).length,
          inProgress: shipments.filter(s => s.status?.toLowerCase() === 'accepted').length,
          completed: shipments.filter(s => s.status?.toLowerCase() === 'completed').length,
          cancelled: shipments.filter(s => s.status?.toLowerCase() === 'cancelled').length
        };
        
        console.log('Draft:', stats.draft);
        console.log('Active Bidding:', stats.activeBidding);
        console.log('In Progress:', stats.inProgress);
        console.log('Completed:', stats.completed);
        console.log('Cancelled:', stats.cancelled);
        console.log('\nActive Shipments (activeBidding + inProgress):', stats.activeBidding + stats.inProgress);
      } else {
        console.log('⚠️  No shipments returned');
      }
    } else {
      const error = await shipmentsRes.text();
      console.log(`❌ Failed: ${error}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testDashboardAPI();

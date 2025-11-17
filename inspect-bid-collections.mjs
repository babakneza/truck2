import fetch from 'node-fetch';

const DIRECTUS_URL = 'https://admin.itboy.ir';
const USER_EMAIL = 'babakneza@msn.com';
const USER_PASSWORD = 'P@$$w0rd7918885';

async function inspectCollections() {
  try {
    // Login
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

    const collections = ['bids', 'bid_attachments', 'bid_edit_history'];
    
    for (const collection of collections) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📋 COLLECTION: ${collection}`);
      console.log('='.repeat(60));
      
      // Get fields info
      const fieldsRes = await fetch(`${DIRECTUS_URL}/fields/${collection}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (fieldsRes.ok) {
        const fieldsData = await fieldsRes.json();
        console.log('\n🔧 FIELDS:');
        fieldsData.data.forEach(field => {
          console.log(`\n  • ${field.field} (${field.type})`);
          if (field.schema) console.log(`    Schema:`, JSON.stringify(field.schema, null, 6));
          if (field.meta) console.log(`    Meta:`, JSON.stringify(field.meta, null, 6));
        });
      }
      
      // Get sample data
      console.log('\n\n📦 SAMPLE DATA:');
      const dataRes = await fetch(`${DIRECTUS_URL}/items/${collection}?limit=2`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (dataRes.ok) {
        const data = await dataRes.json();
        if (data.data && data.data.length > 0) {
          console.log(JSON.stringify(data.data[0], null, 2));
        } else {
          console.log('  (No records found)');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

inspectCollections();

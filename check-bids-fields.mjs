import fetch from 'node-fetch';

const DIRECTUS_URL = 'https://admin.itboy.ir';
const USER_EMAIL = 'babakneza@msn.com';
const USER_PASSWORD = 'P@$$w0rd7918885';

async function checkFields() {
  try {
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

    console.log('✅ Logged in successfully\n');
    
    const fieldsRes = await fetch(`${DIRECTUS_URL}/fields/bids`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const fieldsData = await fieldsRes.json();
    const fields = fieldsData.data || [];
    
    console.log('📋 BIDS COLLECTION FIELDS:');
    console.log('================================\n');
    
    const fieldNames = fields.map(f => f.field).sort();
    fieldNames.forEach(name => {
      const field = fields.find(f => f.field === name);
      const type = field.schema?.data_type || field.type;
      const nullable = field.schema?.is_nullable ? '(nullable)' : '(required)';
      console.log(`  • ${name.padEnd(20)} : ${type.padEnd(20)} ${nullable}`);
    });
    
    console.log('\n\n❓ FRONTEND FIELDS BEING SENT:');
    console.log('================================\n');
    const frontendFields = [
      'driver_id',
      'shipment_id',
      'quoted_price',
      'eta_datetime',
      'duration_hours',
      'vehicle_type',
      'special_handling',
      'payment_terms',
      'status',
      'attachments'
    ];
    
    frontendFields.forEach(name => {
      const found = fields.find(f => f.field === name);
      const status = found ? '✅' : '❌';
      console.log(`  ${status} ${name}`);
    });
    
    console.log('\n\n🔴 MISSING FIELDS (in frontend but not in DB):');
    console.log('================================\n');
    const missing = frontendFields.filter(f => !fields.find(db => db.field === f));
    if (missing.length === 0) {
      console.log('  (None - all fields exist!)');
    } else {
      missing.forEach(f => console.log(`  • ${f}`));
    }
    
    console.log('\n\n🟢 EXTRA FIELDS (in DB but not used by frontend):');
    console.log('================================\n');
    const extra = fields.filter(f => !frontendFields.includes(f.field));
    extra.forEach(f => console.log(`  • ${f.field}`));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkFields();

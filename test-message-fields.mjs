import axios from 'axios';

const API_URL = 'https://admin.itboy.ir';

async function testFieldAccess() {
  try {
    console.log('Testing different field combinations...\n');
    
    const loginResp = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'driver@itboy.ir',
      password: 'password123'
    });
    
    const token = loginResp.data.data.access_token;
    console.log('✅ Logged in as driver@itboy.ir\n');
    
    const fieldsToTest = [
      'id,conversation_id,content,created_at,updated_at',
      'id,conversation_id,created_by_id,content,created_at,updated_at',
      '*',
      'id,conversation_id,message_text,created_at,updated_at',
    ];
    
    for (const fields of fieldsToTest) {
      try {
        const resp = await axios.get(`${API_URL}/api/items/messages?fields=${encodeURIComponent(fields)}&limit=1`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ SUCCESS with fields: ${fields}`);
        if (resp.data.data.length > 0) {
          console.log('   Sample message:', resp.data.data[0]);
        }
      } catch (error) {
        console.log(`❌ FAILED with fields: ${fields}`);
        console.log(`   Error: ${error.response?.data?.errors?.[0]?.message || error.message}`);
      }
      console.log();
    }
    
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    process.exit(1);
  }
}

testFieldAccess();

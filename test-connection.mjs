import fetch from 'node-fetch';

const API_BASE = 'https://admin.itboy.ir/api';
const admin_email = 'admin@example.com';
const admin_password = 'Bb7887055@Tt';

async function testConnection() {
  console.log('Testing Directus API Connection...\n');
  
  try {
    console.log('1. Testing API availability...');
    const healthRes = await fetch(`${API_BASE}/server/health`);
    console.log(`   Status: ${healthRes.status}`);
    
    if (healthRes.ok) {
      const health = await healthRes.json();
      console.log(`   ✅ API is reachable`);
      console.log(`   Status: ${JSON.stringify(health, null, 2)}\n`);
    } else {
      console.log(`   ⚠️  API returned: ${healthRes.status}\n`);
    }
    
    console.log('2. Attempting to login with provided credentials...');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: admin_email,
        password: admin_password
      })
    });
    
    console.log(`   Status: ${loginRes.status}`);
    
    if (loginRes.ok) {
      const data = await loginRes.json();
      const token = data.data.access_token;
      console.log(`   ✅ Login successful!`);
      console.log(`   Token: ${token.substring(0, 20)}...`);
      
      console.log('\n3. Testing roles endpoint with new token...');
      const rolesRes = await fetch(`${API_BASE}/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   Status: ${rolesRes.status}`);
      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        console.log(`   ✅ Roles retrieved: ${rolesData.data.length} roles found`);
        rolesData.data.forEach(role => {
          console.log(`      - ${role.name} (ID: ${role.id})`);
        });
      } else {
        console.log(`   ❌ Failed to get roles`);
      }
    } else {
      const error = await loginRes.json();
      console.log(`   ❌ Login failed`);
      console.log(`   Error: ${JSON.stringify(error, null, 2)}`);
    }
    
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

testConnection();

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5173/api';
const admin_email = 'admin@example.com';
const admin_password = 'Bb7887055@Tt';

async function testLocalConnection() {
  console.log('Testing Local Directus API Connection (localhost:5173)...\n');
  
  try {
    console.log('1. Testing API availability...');
    const systemRes = await fetch(`${API_BASE}/server/info`);
    console.log(`   Status: ${systemRes.status}`);
    
    if (systemRes.ok) {
      const info = await systemRes.json();
      console.log(`   ✅ API is reachable`);
      console.log(`   Project: ${info.data?.project?.project_name || 'Unknown'}\n`);
    } else {
      const error = await systemRes.text();
      console.log(`   ⚠️  Response: ${error.substring(0, 200)}\n`);
    }
    
    console.log('2. Attempting to login...');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: admin_email,
        password: admin_password
      })
    });
    
    console.log(`   Status: ${loginRes.status}`);
    const loginData = await loginRes.json();
    
    if (loginRes.ok) {
      const token = loginData.data.access_token;
      console.log(`   ✅ Login successful!`);
      console.log(`   Token: ${token.substring(0, 20)}...\n`);
      
      console.log('3. Testing roles endpoint with new token...');
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
        console.log(`\n✅ SUCCESS! Use http://localhost:5173/api for testing`);
        console.log(`✅ Token to use: ${token}`);
      } else {
        console.log(`   ❌ Failed to get roles`);
        const error = await rolesRes.json();
        console.log(`   Error: ${JSON.stringify(error, null, 2)}`);
      }
    } else {
      console.log(`   ❌ Login failed`);
      console.log(`   Error: ${JSON.stringify(loginData, null, 2)}`);
    }
    
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

testLocalConnection();

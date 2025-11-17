import fetch from 'node-fetch';

const DIRECTUS_URL = 'https://admin.itboy.ir';
const USER_EMAIL = 'babakneza@msn.com';
const USER_PASSWORD = 'P@$$w0rd7918885';

async function listRoles() {
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

    const rolesRes = await fetch(`${DIRECTUS_URL}/roles`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const rolesData = await rolesRes.json();
    const roles = rolesData.data || [];
    
    console.log('📋 ALL ROLES:');
    console.log('================================\n');
    
    roles.forEach(role => {
      console.log(`  • ${role.name} (ID: ${role.id})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listRoles();

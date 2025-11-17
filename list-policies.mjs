import fetch from 'node-fetch';

const DIRECTUS_URL = 'https://admin.itboy.ir';
const USER_EMAIL = 'babakneza@msn.com';
const USER_PASSWORD = 'P@$$w0rd7918885';

async function listPolicies() {
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

    const policiesRes = await fetch(`${DIRECTUS_URL}/policies`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const policiesData = await policiesRes.json();
    const policies = policiesData.data || [];
    
    console.log('📋 AVAILABLE POLICIES:\n');
    policies.forEach(policy => {
      console.log(`  • ${policy.name} (ID: ${policy.id})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listPolicies();

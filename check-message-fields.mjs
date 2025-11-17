import axios from 'axios';

const DIRECTUS_URL = 'http://localhost:8055';

async function checkPermissions() {
  try {
    const loginResp = await axios.post(`${DIRECTUS_URL}/api/auth/login`, {
      email: 'admin@example.com',
      password: 'admin'
    });
    
    const token = loginResp.data.data.access_token;
    
    const permResponse = await axios.get(`${DIRECTUS_URL}/api/permissions?filter={"collection":{"_eq":"messages"},"role":{"_eq":"driver"}}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Current driver permissions for messages:');
    console.log(JSON.stringify(permResponse.data.data, null, 2));
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

checkPermissions();

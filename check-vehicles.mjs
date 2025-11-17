import fetch from 'node-fetch';

const DIRECTUS_URL = 'https://admin.itboy.ir';
const USER_EMAIL = 'babakneza@msn.com';
const USER_PASSWORD = 'P@$$w0rd7918885';

async function checkVehicles() {
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

    const vehiclesRes = await fetch(`${DIRECTUS_URL}/items/vehicle_profiles?limit=50`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const vehiclesData = await vehiclesRes.json();
    const vehicles = vehiclesData.data || [];
    
    console.log('📋 AVAILABLE VEHICLES:\n');
    vehicles.forEach(v => {
      console.log(`  ID: ${v.id}, Type: ${v.vehicle_type || 'N/A'}`);
    });
    
    if (vehicles.length === 0) {
      console.log('  (No vehicles found)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkVehicles();

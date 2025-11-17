import fetch from 'node-fetch';

const API_URL = 'https://admin.itboy.ir';

async function testLogin() {
  const credentials = [
    { email: 'shipper@itboy.ir', password: '123123@' },
    { email: 'shipper@itboy.ir', password: 'shipper123' }
  ];

  for (const cred of credentials) {
    console.log(`Testing: ${cred.email} / ${cred.password}`);
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cred)
    });
    
    console.log('Status:', res.status);
    if (res.ok) {
      const data = await res.json();
      console.log('✓ Success! User ID:', data.data.user.id);
      return;
    } else {
      const error = await res.text();
      console.log('Error:', error);
    }
    console.log('---');
  }
}

testLogin();

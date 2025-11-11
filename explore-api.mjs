import fetch from 'node-fetch';

async function explore() {
  const baseUrls = [
    'https://admin.itboy.ir/api',
    'https://admin.itboy.ir',
    'http://localhost:8055/api',
    'http://localhost:5173/api',
  ];

  for (const url of baseUrls) {
    console.log(`\nTrying: ${url}`);
    try {
      const res = await fetch(`${url}/`, { timeout: 5000 });
      console.log(`  Status: ${res.status}`);
      const text = await res.text();
      console.log(`  Response: ${text.substring(0, 200)}`);
      
      if (res.status === 200 || res.status === 404) {
        console.log(`  ✅ Server is responding`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }

  console.log('\n\nTrying alternative auth endpoints:');
  const authPaths = [
    'https://admin.itboy.ir/api/auth/login',
    'https://admin.itboy.ir/graphql',
    'https://admin.itboy.ir/auth/login',
  ];

  for (const url of authPaths) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test', password: 'test' }),
        timeout: 5000
      });
      console.log(`${url} → ${res.status}`);
    } catch (error) {
      console.log(`${url} → Error: ${error.message}`);
    }
  }
}

explore();

import https from 'https';

const TOKEN = "AkXqjTVuseEt5XaRHzvuXPyIhYzF4jgb";

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'admin.itboy.ir',
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk });
      res.on('end', () => {
        try {
          resolve({ body: JSON.parse(body), status: res.statusCode });
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function listCollections() {
  const paths = [
    '/api/collections',
    '/collections',
    '/api/schema/collections',
    '/schema/collections'
  ];
  
  for (const path of paths) {
    console.log(`\n\nTrying: ${path}`);
    console.log('═'.repeat(50));
    try {
      const response = await makeRequest(path);
      console.log('Status:', response.status);
      if (response.status === 200) {
        console.log('Full Response:');
        console.log(JSON.stringify(response.body, null, 2));
        break;
      } else {
        console.log('Response:', JSON.stringify(response.body, null, 2));
      }
    } catch (err) {
      console.error('Error:', err.message);
    }
  }
}

listCollections();

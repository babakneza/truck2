import https from 'https';

const TOKEN = "AkXqjTVuseEt5XaRHzvuXPyIhYzF4jgb";

const CHAT_COLLECTIONS = [
  'conversations',
  'messages',
  'message_reads',
  'message_attachments',
  'message_reactions',
  'chat_participants',
  'typing_indicators',
  'conversation_settings',
  'chat_notifications'
];

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
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function verifyCollections() {
  try {
    const response = await makeRequest('/collections');
    
    if (!response.data) {
      console.error('No data in response');
      return;
    }

    const allCollections = response.data.map(c => c.collection);
    
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║       CHAT SYSTEM COLLECTIONS VERIFICATION REPORT             ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    let foundCount = 0;
    console.log('Chat Collections Status:\n');

    for (const chatCol of CHAT_COLLECTIONS) {
      const exists = allCollections.includes(chatCol);
      const status = exists ? '✓ EXISTS' : '✗ MISSING';
      console.log(`  ${status.padEnd(10)} - ${chatCol}`);
      if (exists) foundCount++;
    }

    console.log('\n' + '═'.repeat(65));
    console.log(`\nSummary: ${foundCount}/${CHAT_COLLECTIONS.length} collections found\n`);

    if (foundCount === CHAT_COLLECTIONS.length) {
      console.log('✓ All chat collections are present and ready!\n');
    } else {
      console.log('✗ Some collections are missing. Missing:\n');
      CHAT_COLLECTIONS.forEach(col => {
        if (!allCollections.includes(col)) {
          console.log(`   - ${col}`);
        }
      });
    }

    // Show collection details for each found chat collection
    console.log('\n' + '═'.repeat(65));
    console.log('\nDETAILED COLLECTION INFO:\n');

    for (const chatCol of CHAT_COLLECTIONS) {
      const collectionData = response.data.find(c => c.collection === chatCol);
      if (collectionData) {
        console.log(`\n📦 ${chatCol.toUpperCase()}`);
        console.log('─'.repeat(65));
        console.log(`   Icon: ${collectionData.meta.icon || 'none'}`);
        console.log(`   Hidden: ${collectionData.meta.hidden}`);
        console.log(`   Singleton: ${collectionData.meta.singleton}`);
        console.log(`   Display Template: ${collectionData.meta.display_template || 'none'}`);
      }
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

verifyCollections();

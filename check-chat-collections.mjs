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

async function generateReport() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║          CHAT SYSTEM COLLECTIONS - AUDIT REPORT               ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    const response = await makeRequest(`/collections`);
    
    if (!response.data) {
      console.error('No data in response');
      return;
    }

    const allCollections = response.data.map(c => c.collection);
    let successCount = 0;
    const report = [];

    for (const collectionName of CHAT_COLLECTIONS) {
      const collectionData = response.data.find(c => c.collection === collectionName);
      
      if (collectionData) {
        successCount++;
        report.push({
          name: collectionName,
          status: '✓ EXISTS',
          icon: collectionData.meta.icon,
          hidden: collectionData.meta.hidden,
          singleton: collectionData.meta.singleton,
          displayTemplate: collectionData.meta.display_template
        });
      } else {
        report.push({
          name: collectionName,
          status: '✗ NOT FOUND'
        });
      }
    }

    // Detailed Report
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    DETAILED COLLECTION REPORT                 ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    for (const item of report) {
      if (item.status === '✓ EXISTS') {
        console.log(`${'═'.repeat(65)}`);
        console.log(`📦 ${item.name.toUpperCase()}`);
        console.log(`Status: ${item.status}`);
        console.log('─'.repeat(65));
        console.log(`Icon:              ${item.icon || 'none'}`);
        console.log(`Hidden:            ${item.hidden}`);
        console.log(`Singleton:         ${item.singleton}`);
        console.log(`Display Template:  ${item.displayTemplate || 'none'}`);
      } else {
        console.log(`${'═'.repeat(65)}`);
        console.log(`📦 ${item.name.toUpperCase()}`);
        console.log(`Status: ${item.status}`);
      }
    }

    // Summary
    console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                           SUMMARY                             ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log(`✓ Collections Found: ${successCount}/${CHAT_COLLECTIONS.length}`);
    
    if (successCount === CHAT_COLLECTIONS.length) {
      console.log('\n✅ All chat collections are present and ready for implementation!\n');
    } else {
      console.log('\n⚠️ Some collections are missing:\n');
      report.forEach(item => {
        if (item.status !== '✓ EXISTS') {
          console.log(`   - ${item.name}`);
        }
      });
    }

  } catch (err) {
    console.error('Fatal error:', err.message);
  }
}

generateReport();

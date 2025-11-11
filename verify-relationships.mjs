import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5173/api';
const TOKEN = 'h1YYv7_krvVsEIntDQtFeFqY6fxwDNJ2';

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

async function verifyRelationships() {
  try {
    const fieldsRes = await fetch(`${API_BASE}/fields`, { headers });
    const fieldsData = await fieldsRes.json();
    const allFields = fieldsData.data || [];

    const expectedRelationships = [
      { childCollection: 'shipments', fieldName: 'user_id', parentCollection: 'users' },
      { childCollection: 'bids', fieldName: 'user_id', parentCollection: 'users' },
      { childCollection: 'shipper_profiles', fieldName: 'user_id', parentCollection: 'users' },
      { childCollection: 'driver_profiles', fieldName: 'user_id', parentCollection: 'users' },
      { childCollection: 'kyc_documents', fieldName: 'user_id', parentCollection: 'users' },
      { childCollection: 'payment_methods', fieldName: 'user_id', parentCollection: 'users' },
      { childCollection: 'vehicle_profiles', fieldName: 'driver_id', parentCollection: 'driver_profiles' },
      { childCollection: 'driver_bank_accounts', fieldName: 'driver_id', parentCollection: 'driver_profiles' },
      { childCollection: 'bids', fieldName: 'shipment_id', parentCollection: 'shipments' },
      { childCollection: 'shipment_items', fieldName: 'shipment_id', parentCollection: 'shipments' },
      { childCollection: 'shipment_tracking', fieldName: 'shipment_id', parentCollection: 'shipments' },
      { childCollection: 'payments', fieldName: 'shipment_id', parentCollection: 'shipments' },
      { childCollection: 'bid_attachments', fieldName: 'bid_id', parentCollection: 'bids' },
      { childCollection: 'bid_edit_history', fieldName: 'bid_id', parentCollection: 'bids' },
      { childCollection: 'payment_authorizations', fieldName: 'bid_id', parentCollection: 'bids' },
      { childCollection: 'bids', fieldName: 'vehicle_id', parentCollection: 'vehicle_profiles' },
      { childCollection: 'escrow', fieldName: 'payment_id', parentCollection: 'payments' },
      { childCollection: 'refunds', fieldName: 'payment_id', parentCollection: 'payments' },
      { childCollection: 'payment_authorizations', fieldName: 'payment_id', parentCollection: 'payments' },
      { childCollection: 'payments', fieldName: 'payment_method_id', parentCollection: 'payment_methods' }
    ];

    console.log('=== Verifying Directus Relationships ===\n');

    let foundCount = 0;
    let missingCount = 0;

    expectedRelationships.forEach(rel => {
      const field = allFields.find(f => f.collection === rel.childCollection && f.field === rel.fieldName);
      
      if (field && field.schema?.foreign_key_table === rel.parentCollection) {
        console.log(`✅ ${rel.parentCollection} (1) → (Many) ${rel.childCollection}`);
        console.log(`   Field: ${rel.fieldName} | FK Table: ${field.schema?.foreign_key_table}\n`);
        foundCount++;
      } else if (field) {
        console.log(`⚠️  ${rel.parentCollection} (1) → (Many) ${rel.childCollection}`);
        console.log(`   Field exists but FK not configured. FK Table: ${field.schema?.foreign_key_table}\n`);
        missingCount++;
      } else {
        console.log(`❌ ${rel.parentCollection} (1) → (Many) ${rel.childCollection}`);
        console.log(`   Field '${rel.fieldName}' not found in ${rel.childCollection}\n`);
        missingCount++;
      }
    });

    console.log(`\n=== Summary ===`);
    console.log(`✅ Configured: ${foundCount}/${expectedRelationships.length}`);
    if (missingCount > 0) {
      console.log(`❌ Incomplete/Missing: ${missingCount}`);
    } else {
      console.log(`All relationships are properly configured!`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

verifyRelationships();

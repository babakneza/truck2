import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5173/api';
const TOKEN = 'h1YYv7_krvVsEIntDQtFeFqY6fxwDNJ2';

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

async function finalVerify() {
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

    console.log('=== Final Relationship Verification ===\n');

    let properlyConfigured = 0;
    let improperly = 0;
    let missing = 0;

    expectedRelationships.forEach(rel => {
      const field = allFields.find(f => f.collection === rel.childCollection && f.field === rel.fieldName);
      
      if (!field) {
        console.log(`❌ ${rel.parentCollection} (1) → (Many) ${rel.childCollection}`);
        console.log(`   Field not found\n`);
        missing++;
      } else if (field.type === 'integer' && field.meta?.interface === 'select-related-many') {
        console.log(`✅ ${rel.parentCollection} (1) → (Many) ${rel.childCollection}`);
        console.log(`   ${rel.fieldName}: integer, interface=select-related-many\n`);
        properlyConfigured++;
      } else {
        console.log(`⚠️  ${rel.parentCollection} (1) → (Many) ${rel.childCollection}`);
        console.log(`   ${rel.fieldName}: type=${field.type}, interface=${field.meta?.interface}\n`);
        improperly++;
      }
    });

    console.log(`=== Summary ===`);
    console.log(`✅ Properly Configured: ${properlyConfigured}/${expectedRelationships.length}`);
    if (improperly > 0) console.log(`⚠️  Improperly Configured: ${improperly}`);
    if (missing > 0) console.log(`❌ Missing: ${missing}`);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

finalVerify();

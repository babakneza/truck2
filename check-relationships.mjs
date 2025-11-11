import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5173/api';
const TOKEN = 'h1YYv7_krvVsEIntDQtFeFqY6fxwDNJ2';

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

async function checkRelationships() {
  try {
    const fieldsRes = await fetch(`${API_BASE}/fields`, { headers });
    const fieldsData = await fieldsRes.json();
    const allFields = fieldsData.data || [];

    console.log('=== Current Relationships in Directus ===\n');

    const expectedRelationships = [
      { from: 'users', to: 'shipments', type: 'one-to-many' },
      { from: 'users', to: 'bids', type: 'one-to-many' },
      { from: 'users', to: 'shipper_profiles', type: 'one-to-one' },
      { from: 'users', to: 'driver_profiles', type: 'one-to-one' },
      { from: 'users', to: 'kyc_documents', type: 'one-to-many' },
      { from: 'users', to: 'payment_methods', type: 'one-to-many' },
      { from: 'driver_profiles', to: 'vehicle_profiles', type: 'one-to-many' },
      { from: 'driver_profiles', to: 'driver_bank_accounts', type: 'one-to-many' },
      { from: 'shipments', to: 'bids', type: 'one-to-many' },
      { from: 'shipments', to: 'shipment_items', type: 'one-to-many' },
      { from: 'shipments', to: 'shipment_tracking', type: 'one-to-many' },
      { from: 'shipments', to: 'payments', type: 'one-to-many' },
      { from: 'bids', to: 'bid_attachments', type: 'one-to-many' },
      { from: 'bids', to: 'bid_edit_history', type: 'one-to-many' },
      { from: 'bids', to: 'payment_authorizations', type: 'one-to-many' },
      { from: 'vehicle_profiles', to: 'bids', type: 'one-to-many' },
      { from: 'payments', to: 'escrow', type: 'one-to-one' },
      { from: 'payments', to: 'refunds', type: 'one-to-many' },
      { from: 'payments', to: 'payment_authorizations', type: 'one-to-many' },
      { from: 'payment_methods', to: 'payments', type: 'one-to-many' }
    ];

    const foundRelationships = [];
    const missingRelationships = [];

    expectedRelationships.forEach(rel => {
      const collectionFields = allFields.filter(f => f.collection === rel.to);
      const m2oField = collectionFields.find(f => f.type === 'string' && f.field.includes(rel.from));

      if (m2oField) {
        foundRelationships.push(rel);
      } else {
        missingRelationships.push(rel);
      }
    });

    console.log('✅ Found Relationships:');
    foundRelationships.forEach(r => {
      console.log(`  ${r.from} (1) → (Many) ${r.to}`);
    });

    if (missingRelationships.length > 0) {
      console.log('\n❌ Missing/Incomplete Relationships:');
      missingRelationships.forEach(r => {
        console.log(`  ${r.from} (1) → (Many) ${r.to}`);
      });
    } else {
      console.log('\n✅ All expected relationships are configured!');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkRelationships();

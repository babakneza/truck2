import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5173/api';
const TOKEN = 'h1YYv7_krvVsEIntDQtFeFqY6fxwDNJ2';

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

const relationshipsToFix = [
  { collection: 'shipments', fieldName: 'user_id', parentCollection: 'users' },
  { collection: 'bids', fieldName: 'user_id', parentCollection: 'users' },
  { collection: 'shipper_profiles', fieldName: 'user_id', parentCollection: 'users' },
  { collection: 'driver_profiles', fieldName: 'user_id', parentCollection: 'users' },
  { collection: 'kyc_documents', fieldName: 'user_id', parentCollection: 'users' },
  { collection: 'payment_methods', fieldName: 'user_id', parentCollection: 'users' },
  { collection: 'vehicle_profiles', fieldName: 'driver_id', parentCollection: 'driver_profiles' },
  { collection: 'driver_bank_accounts', fieldName: 'driver_id', parentCollection: 'driver_profiles' },
  { collection: 'bids', fieldName: 'shipment_id', parentCollection: 'shipments' },
  { collection: 'shipment_items', fieldName: 'shipment_id', parentCollection: 'shipments' },
  { collection: 'shipment_tracking', fieldName: 'shipment_id', parentCollection: 'shipments' },
  { collection: 'payments', fieldName: 'shipment_id', parentCollection: 'shipments' },
  { collection: 'bid_attachments', fieldName: 'bid_id', parentCollection: 'bids' },
  { collection: 'bid_edit_history', fieldName: 'bid_id', parentCollection: 'bids' },
  { collection: 'payment_authorizations', fieldName: 'bid_id', parentCollection: 'bids' },
  { collection: 'bids', fieldName: 'vehicle_id', parentCollection: 'vehicle_profiles' },
  { collection: 'escrow', fieldName: 'payment_id', parentCollection: 'payments' },
  { collection: 'refunds', fieldName: 'payment_id', parentCollection: 'payments' },
  { collection: 'payment_authorizations', fieldName: 'payment_id', parentCollection: 'payments' },
  { collection: 'payments', fieldName: 'payment_method_id', parentCollection: 'payment_methods' }
];

async function fixRelationship(collection, fieldName, parentCollection) {
  try {
    const updateData = {
      schema: {
        foreign_key_table: parentCollection,
        foreign_key_column: 'id',
        on_delete: 'SET NULL'
      },
      meta: {
        interface: 'select-related-many',
        options: {
          template: null
        }
      }
    };

    const response = await fetch(`${API_BASE}/fields/${collection}/${fieldName}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updateData)
    });

    if (response.ok) {
      console.log(`✅ ${collection}.${fieldName} → ${parentCollection}.id`);
      return true;
    } else {
      const result = await response.json();
      console.log(`❌ ${collection}.${fieldName}: ${result.errors?.[0]?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.error(`Error fixing ${collection}.${fieldName}:`, error.message);
    return false;
  }
}

async function fixAllRelationships() {
  console.log('Fixing foreign key constraints in Directus...\n');

  for (const rel of relationshipsToFix) {
    await fixRelationship(rel.collection, rel.fieldName, rel.parentCollection);
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\n✅ Foreign key constraints update complete!');
}

fixAllRelationships();

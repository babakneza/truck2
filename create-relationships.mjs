import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5173/api';
const TOKEN = 'h1YYv7_krvVsEIntDQtFeFqY6fxwDNJ2';

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

const relationships = [
  { parentCollection: 'users', childCollection: 'shipments', fieldName: 'user_id' },
  { parentCollection: 'users', childCollection: 'bids', fieldName: 'user_id' },
  { parentCollection: 'users', childCollection: 'shipper_profiles', fieldName: 'user_id' },
  { parentCollection: 'users', childCollection: 'driver_profiles', fieldName: 'user_id' },
  { parentCollection: 'users', childCollection: 'kyc_documents', fieldName: 'user_id' },
  { parentCollection: 'users', childCollection: 'payment_methods', fieldName: 'user_id' },
  { parentCollection: 'driver_profiles', childCollection: 'vehicle_profiles', fieldName: 'driver_id' },
  { parentCollection: 'driver_profiles', childCollection: 'driver_bank_accounts', fieldName: 'driver_id' },
  { parentCollection: 'shipments', childCollection: 'bids', fieldName: 'shipment_id' },
  { parentCollection: 'shipments', childCollection: 'shipment_items', fieldName: 'shipment_id' },
  { parentCollection: 'shipments', childCollection: 'shipment_tracking', fieldName: 'shipment_id' },
  { parentCollection: 'shipments', childCollection: 'payments', fieldName: 'shipment_id' },
  { parentCollection: 'bids', childCollection: 'bid_attachments', fieldName: 'bid_id' },
  { parentCollection: 'bids', childCollection: 'bid_edit_history', fieldName: 'bid_id' },
  { parentCollection: 'bids', childCollection: 'payment_authorizations', fieldName: 'bid_id' },
  { parentCollection: 'vehicle_profiles', childCollection: 'bids', fieldName: 'vehicle_id' },
  { parentCollection: 'payments', childCollection: 'escrow', fieldName: 'payment_id' },
  { parentCollection: 'payments', childCollection: 'refunds', fieldName: 'payment_id' },
  { parentCollection: 'payments', childCollection: 'payment_authorizations', fieldName: 'payment_id' },
  { parentCollection: 'payment_methods', childCollection: 'payments', fieldName: 'payment_method_id' }
];

async function createRelationship(parentCollection, childCollection, fieldName) {
  try {
    const fieldData = {
      field: fieldName,
      type: 'string',
      schema: {
        name: fieldName,
        table: childCollection,
        data_type: 'uuid',
        foreign_key_table: parentCollection,
        foreign_key_column: 'id',
        on_delete: 'SET NULL'
      },
      meta: {
        interface: 'select-related-many',
        options: {
          template: null
        },
        required: true
      }
    };

    const response = await fetch(`${API_BASE}/fields/${childCollection}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(fieldData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`✅ ${parentCollection} → ${childCollection}: Added field '${fieldName}'`);
      return true;
    } else {
      console.log(`❌ ${parentCollection} → ${childCollection}: ${result.errors?.[0]?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.error(`Error creating relationship ${parentCollection} → ${childCollection}:`, error.message);
    return false;
  }
}

async function createAllRelationships() {
  console.log('Creating relationships in Directus...\n');

  for (const rel of relationships) {
    await createRelationship(rel.parentCollection, rel.childCollection, rel.fieldName);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n✅ Relationship creation complete!');
}

createAllRelationships();

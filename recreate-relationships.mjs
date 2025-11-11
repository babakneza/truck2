import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5173/api';
const TOKEN = 'h1YYv7_krvVsEIntDQtFeFqY6fxwDNJ2';

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

const relationships = [
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

async function deleteField(collection, fieldName) {
  try {
    const response = await fetch(`${API_BASE}/fields/${collection}/${fieldName}`, {
      method: 'DELETE',
      headers
    });

    if (response.ok || response.status === 204) {
      console.log(`  ✓ Deleted ${collection}.${fieldName}`);
      return true;
    } else {
      console.log(`  ✗ Failed to delete ${collection}.${fieldName}`);
      return false;
    }
  } catch (error) {
    console.log(`  ✗ Error deleting ${collection}.${fieldName}: ${error.message}`);
    return false;
  }
}

async function createForeignKeyField(collection, fieldName, parentCollection) {
  try {
    const fieldData = {
      field: fieldName,
      type: 'integer',
      schema: {
        name: fieldName,
        table: collection,
        data_type: 'integer',
        is_nullable: true,
        foreign_key_table: parentCollection,
        foreign_key_column: 'id',
        on_delete: 'SET NULL'
      },
      meta: {
        interface: 'select-related-many',
        display: 'related-values',
        options: {
          template: null
        }
      }
    };

    const response = await fetch(`${API_BASE}/fields/${collection}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(fieldData)
    });

    if (response.ok) {
      console.log(`  ✓ Created ${collection}.${fieldName} → ${parentCollection}.id`);
      return true;
    } else {
      const result = await response.json();
      console.log(`  ✗ Failed: ${result.errors?.[0]?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`  ✗ Error creating field: ${error.message}`);
    return false;
  }
}

async function recreateRelationships() {
  console.log('=== Recreating Foreign Key Relationships ===\n');

  console.log('Step 1: Deleting existing incorrect fields...\n');
  for (const rel of relationships) {
    await deleteField(rel.collection, rel.fieldName);
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\nStep 2: Recreating with proper foreign key configuration...\n');
  for (const rel of relationships) {
    await createForeignKeyField(rel.collection, rel.fieldName, rel.parentCollection);
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\n✅ Relationship recreation complete!');
}

recreateRelationships();

import fetch from 'node-fetch';

const DIRECTUS_URL = 'https://admin.itboy.ir';
const ADMIN_EMAIL = 'babakneza@msn.com';
const ADMIN_PASSWORD = 'P@$$w0rd7918885';

async function createUserIdField() {
  try {
    console.log('🔐 Logging in as admin...');
    const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });

    const { data: authData } = await loginRes.json();
    const token = authData.access_token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    console.log('✅ Logged in\n');

    console.log('📋 Creating user_id field in shipments collection...');
    
    const fieldData = {
      field: 'user_id',
      type: 'uuid',
      schema: {
        is_nullable: true
      },
      meta: {
        interface: 'select-dropdown-m2o',
        special: ['m2o'],
        options: {
          template: '{{first_name}} {{last_name}}'
        },
        display: 'related-values',
        display_options: {
          template: '{{first_name}} {{last_name}}'
        },
        readonly: false,
        hidden: false,
        width: 'half',
        note: 'The user (shipper) who created this shipment'
      }
    };

    const createRes = await fetch(`${DIRECTUS_URL}/fields/shipments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(fieldData)
    });

    if (createRes.ok) {
      const result = await createRes.json();
      console.log('✅ Created user_id field');
      console.log(JSON.stringify(result, null, 2));
    } else {
      const error = await createRes.text();
      console.error(`❌ Failed to create field: ${createRes.status}`);
      console.error(error);
    }

    console.log('\n📋 Creating foreign key relationship...');
    
    const relationData = {
      collection: 'shipments',
      field: 'user_id',
      related_collection: 'directus_users'
    };

    const relationRes = await fetch(`${DIRECTUS_URL}/relations`, {
      method: 'POST',
      headers,
      body: JSON.stringify(relationData)
    });

    if (relationRes.ok) {
      const result = await relationRes.json();
      console.log('✅ Created relationship');
      console.log(JSON.stringify(result, null, 2));
    } else {
      const error = await relationRes.text();
      console.error(`❌ Failed to create relationship: ${relationRes.status}`);
      console.error(error);
    }

    console.log('\n✅ Setup complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

createUserIdField();

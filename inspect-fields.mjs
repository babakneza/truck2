import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5173/api';
const TOKEN = 'h1YYv7_krvVsEIntDQtFeFqY6fxwDNJ2';

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

async function inspectFields() {
  try {
    const response = await fetch(`${API_BASE}/fields/shipments`, { headers });
    const data = await response.json();
    const fields = data.data || [];

    console.log('Sample fields from shipments collection:\n');
    
    const sampleFields = fields.slice(0, 5);
    sampleFields.forEach(field => {
      console.log(`Field: ${field.field}`);
      console.log(`  Type: ${field.type}`);
      console.log(`  Schema:`, JSON.stringify(field.schema, null, 2));
      console.log(`  Meta Interface: ${field.meta?.interface}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

inspectFields();

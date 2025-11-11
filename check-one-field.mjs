import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5173/api';
const TOKEN = 'h1YYv7_krvVsEIntDQtFeFqY6fxwDNJ2';

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

async function checkField() {
  try {
    const response = await fetch(`${API_BASE}/fields/shipments/user_id`, { headers });
    const data = await response.json();
    const field = data.data;

    console.log('Field: shipments.user_id');
    console.log('Full field data:');
    console.log(JSON.stringify(field, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkField();

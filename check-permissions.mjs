import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5173/api';
const TOKEN = 'h1YYv7_krvVsEIntDQtFeFqY6fxwDNJ2';

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

async function checkPermissions() {
  try {
    const response = await fetch(`${API_BASE}/permissions`, { headers });
    const data = await response.json();
    
    console.log('Total permissions configured:', data.data?.length || 0);
    console.log('\nFirst 5 permissions:');
    
    const perms = data.data || [];
    perms.slice(0, 5).forEach((perm, i) => {
      console.log(`${i + 1}. Role: ${perm.role}, Collection: ${perm.collection}, Action: ${perm.action}`);
    });

    const rolesRes = await fetch(`${API_BASE}/roles`, { headers });
    const rolesData = await rolesRes.json();
    const roles = rolesData.data || [];

    console.log('\n\nPermissions by Role:');
    roles.forEach(role => {
      const rolePerms = perms.filter(p => p.role === role.id);
      if (rolePerms.length > 0) {
        console.log(`\n${role.name} (${role.id}):`);
        const actionCounts = {};
        rolePerms.forEach(p => {
          actionCounts[p.action] = (actionCounts[p.action] || 0) + 1;
        });
        Object.entries(actionCounts).forEach(([action, count]) => {
          console.log(`  ${action}: ${count} collections`);
        });
      }
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkPermissions();

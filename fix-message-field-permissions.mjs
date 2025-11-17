import axios from 'axios';

const API_URL = 'https://admin.itboy.ir';
const token = 'AkXqjTVuseEt5XaRHzvuXPyIhYzF4jgb';

const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};

async function fixPermissions() {
  try {
    console.log('Fetching driver role permissions for messages...');
    
    const permsResp = await axios.get(`${API_URL}/permissions?filter={"collection":{"_eq":"messages"},"role":{"name":{"_eq":"Driver"}},"action":{"_eq":"read"}}`, { headers });
    
    if (!permsResp.data.data || permsResp.data.data.length === 0) {
      console.log('❌ No read permission found for driver on messages');
      console.log('Creating new permission...');
      
      const roles = await axios.get(`${API_URL}/roles?filter={"name":{"_eq":"Driver"}}`, { headers });
      const driverRoleId = roles.data.data[0].id;
      
      const createResp = await axios.post(`${API_URL}/permissions`, {
        role: driverRoleId,
        collection: 'messages',
        action: 'read',
        permissions: {},
        validation: {},
        fields: '*',
        policy: 'create'
      }, { headers });
      
      console.log('✅ Created read permission with fields: * ');
      return;
    }
    
    const perm = permsResp.data.data[0];
    console.log('Current permission:', {
      id: perm.id,
      fields: perm.fields,
      permissions: perm.permissions
    });
    
    console.log('Updating to include all fields...');
    const updateResp = await axios.patch(`${API_URL}/permissions/${perm.id}`, {
      fields: '*',
      permissions: {}
    }, { headers });
    
    console.log('✅ Updated permission to include all fields');
    console.log('Result:', {
      fields: updateResp.data.data.fields,
      permissions: updateResp.data.data.permissions
    });
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

fixPermissions();

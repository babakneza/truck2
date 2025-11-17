import axios from 'axios'

const API_URL = 'https://admin.itboy.ir'
const token = 'AkXqjTVuseEt5XaRHzvuXPyIhYzF4jgb'

const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}

const driverRoleId = 'b62cdd6e-ce64-4776-931b-71f5d88bf28e'

const actions = ['read', 'create', 'update', 'delete']

try {
  console.log('📝 Setting up permissions for driver role on conversations...\n')
  
  for (const action of actions) {
    try {
      console.log(`  Creating ${action} permission...`)
      await axios.post(`${API_URL}/permissions`, {
        role: driverRoleId,
        collection: 'conversations',
        action: action,
        permissions: {},
        validation: {}
      }, { headers })
      console.log(`  ✅ ${action} permission created`)
    } catch (err) {
      if (err.response?.status === 400) {
        console.log(`  ⚠️  ${action} permission already exists`)
      } else {
        throw err
      }
    }
  }
  
  console.log('\n✅ All permissions configured for driver role on conversations')
  console.log('\n📝 Setting up permissions for driver role on messages...\n')
  
  for (const action of actions) {
    try {
      console.log(`  Creating ${action} permission...`)
      await axios.post(`${API_URL}/permissions`, {
        role: driverRoleId,
        collection: 'messages',
        action: action,
        permissions: {},
        validation: {}
      }, { headers })
      console.log(`  ✅ ${action} permission created`)
    } catch (err) {
      if (err.response?.status === 400) {
        console.log(`  ⚠️  ${action} permission already exists`)
      } else {
        throw err
      }
    }
  }
  
  console.log('\n✅ All permissions configured!')
  console.log('\n📋 Next: Refresh driver browser and try accessing chat again')
  
} catch (error) {
  console.error('❌ Error:', error.response?.data || error.message)
  process.exit(1)
}

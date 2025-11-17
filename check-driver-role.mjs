import axios from 'axios'

const API_URL = 'https://admin.itboy.ir'
const token = 'AkXqjTVuseEt5XaRHzvuXPyIhYzF4jgb'

const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}

try {
  console.log('🔍 Fetching all roles...')
  const rolesResponse = await axios.get(`${API_URL}/roles`, { headers })
  
  console.log('\nAvailable roles:')
  rolesResponse.data.data?.forEach(role => {
    console.log(`  - ${role.name} (ID: ${role.id})`)
  })
  
  const driverRole = rolesResponse.data.data?.find(r => r.name.toLowerCase() === 'driver')
  
  if (!driverRole) {
    console.log('\n❌ Driver role not found!')
    process.exit(1)
  }
  
  console.log(`\n✅ Driver role ID: ${driverRole.id}`)
  
  console.log('\n🔍 Fetching permissions for driver role on conversations...')
  const permResponse = await axios.get(
    `${API_URL}/permissions?filter={"role":{"_eq":"${driverRole.id}"},"collection":{"_eq":"conversations"}}`,
    { headers }
  )
  
  if (permResponse.data.data?.length === 0) {
    console.log('❌ No permissions configured for driver role on conversations!')
    console.log('\n📝 Creating permissions...')
    
    const permData = {
      role: driverRole.id,
      collection: 'conversations',
      action: 'read',
      permissions: {}
    }
    
    const createPerm = await axios.post(`${API_URL}/permissions`, permData, { headers })
    console.log('✅ Read permission created')
    
    const createPerm2 = await axios.post(`${API_URL}/permissions`, {
      role: driverRole.id,
      collection: 'conversations',
      action: 'create',
      permissions: {}
    }, { headers })
    console.log('✅ Create permission created')
  } else {
    console.log('✅ Permissions already exist:')
    permResponse.data.data?.forEach(perm => {
      console.log(`  - Action: ${perm.action}`)
    })
  }
  
} catch (error) {
  console.error('❌ Error:', error.response?.data || error.message)
  process.exit(1)
}

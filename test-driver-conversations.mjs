import axios from 'axios'

const API_URL = 'https://admin.itboy.ir'
const token = 'AkXqjTVuseEt5XaRHzvuXPyIhYzF4jgb'

const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}

try {
  console.log('🔍 Getting driver ID...')
  
  const driverResponse = await axios.get(`${API_URL}/users?filter={"email":{"_eq":"driver2@itboy.ir"}}`, { headers })
  const driverId = driverResponse.data.data?.[0]?.id
  
  console.log(`✅ Driver ID: ${driverId}`)
  
  console.log('\n🔍 Fetching conversations for driver...')
  
  const filter = {
    _or: [
      { initiator_id: { _eq: driverId } },
      { receiver_id: { _eq: driverId } }
    ]
  }
  
  const convResponse = await axios.get(
    `${API_URL}/items/conversations?filter=${encodeURIComponent(JSON.stringify(filter))}`,
    { headers }
  )
  
  console.log(`✅ Conversations found: ${convResponse.data.data?.length || 0}`)
  console.log('\nConversations:')
  convResponse.data.data?.forEach(conv => {
    console.log(`  - ID: ${conv.id}, Initiator: ${conv.initiator_id}, Receiver: ${conv.receiver_id}`)
  })
  
  console.log('\n🔍 Checking permissions for driver role on conversations collection...')
  
  const rolesResponse = await axios.get(`${API_URL}/roles?filter={"name":{"_eq":"driver"}}`, { headers })
  const driverRole = rolesResponse.data.data?.[0]
  
  if (driverRole) {
    console.log(`✅ Driver Role ID: ${driverRole.id}`)
    
    const permResponse = await axios.get(
      `${API_URL}/permissions?filter={"role":{"_eq":"${driverRole.id}"},"collection":{"_eq":"conversations"}}`,
      { headers }
    )
    
    const hasRead = permResponse.data.data?.some(p => p.action === 'read')
    console.log(`  - Read permission: ${hasRead ? '✅ YES' : '❌ NO'}`)
    
    if (permResponse.data.data?.length > 0) {
      console.log('  - Permissions:', JSON.stringify(permResponse.data.data, null, 2))
    } else {
      console.log('  - No permissions configured for driver role on conversations')
    }
  }
  
} catch (error) {
  console.error('❌ Error:', error.response?.data || error.message)
  process.exit(1)
}

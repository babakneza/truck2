import axios from 'axios'

const API_URL = 'https://admin.itboy.ir'
const token = process.env.DIRECTUS_TOKEN

if (!token) {
  console.error('❌ DIRECTUS_TOKEN environment variable not set')
  process.exit(1)
}

const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}

try {
  console.log('🔍 Getting driver and shipper user IDs...')
  
  const driverResponse = await axios.get(`${API_URL}/users?filter={"email":{"_eq":"driver2@itboy.ir"}}`, { headers })
  const shipperResponse = await axios.get(`${API_URL}/users?filter={"email":{"_eq":"shipper@itboy.ir"}}`, { headers })
  
  const driverId = driverResponse.data.data?.[0]?.id
  const shipperId = shipperResponse.data.data?.[0]?.id
  
  if (!driverId || !shipperId) {
    console.error('❌ Could not find driver or shipper user')
    console.error('Driver:', driverId)
    console.error('Shipper:', shipperId)
    process.exit(1)
  }
  
  console.log(`✅ Driver ID: ${driverId}`)
  console.log(`✅ Shipper ID: ${shipperId}`)
  
  console.log('📝 Creating conversation...')
  
  const conversationData = {
    initiator_id: driverId,
    receiver_id: shipperId,
    conversation_type: 'GENERAL',
    is_active: true
  }
  
  const createResponse = await axios.post(`${API_URL}/items/conversations`, conversationData, { headers })
  
  const conversationId = createResponse.data.data?.id
  
  console.log(`✅ Conversation created: ${conversationId}`)
  console.log(`\n📋 Test Instructions:`)
  console.log(`1. Login as driver2@itboy.ir in one browser`)
  console.log(`2. Login as shipper@itboy.ir in another browser`)
  console.log(`3. Open the Chat page in both browsers`)
  console.log(`4. You should see a conversation between the two users`)
  console.log(`5. Send messages from both sides to test real-time messaging`)
  
} catch (error) {
  console.error('❌ Error:', error.response?.data || error.message)
  process.exit(1)
}

import axios from 'axios'

const API_URL = 'https://admin.itboy.ir'
const token = 'AkXqjTVuseEt5XaRHzvuXPyIhYzF4jgb'

const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}

try {
  console.log('🔍 Getting driver@itboy.ir and shipper@itboy.ir IDs...')
  
  const driverResponse = await axios.get(`${API_URL}/users?filter={"email":{"_eq":"driver@itboy.ir"}}`, { headers })
  const shipperResponse = await axios.get(`${API_URL}/users?filter={"email":{"_eq":"shipper@itboy.ir"}}`, { headers })
  
  const driverId = driverResponse.data.data?.[0]?.id
  const shipperId = shipperResponse.data.data?.[0]?.id
  
  console.log(`✅ Driver ID: ${driverId}`)
  console.log(`✅ Shipper ID: ${shipperId}`)
  
  if (!driverId || !shipperId) {
    throw new Error('Could not find driver or shipper')
  }
  
  console.log('\n📝 Creating conversation...')
  
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
  console.log(`1. Refresh driver@itboy.ir browser`)
  console.log(`2. Refresh shipper@itboy.ir browser`)
  console.log(`3. Both should see the conversation`)
  console.log(`4. Send messages to test real-time chat`)
  
} catch (error) {
  console.error('❌ Error:', error.response?.data || error.message)
  process.exit(1)
}

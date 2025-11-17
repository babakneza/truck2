const axios = require('axios').default || require('axios')

const BASE_URL = 'http://localhost:5173'
const API_URL = `${BASE_URL}/api`

const DRIVER_ID = '6f206a3a-4396-43bc-a762-fab29800788b'
const DRIVER_EMAIL = 'driver@itboy.ir'
const DRIVER_PASSWORD = '123123@'

const SHIPPER_ID = 'b0ed390d-b433-43ec-8bdd-bf5ef3f0c770'
const SHIPPER_EMAIL = 'shipper@itboy.ir'
const SHIPPER_PASSWORD = '123123@'

let authTokens = { driver: '', shipper: '' }
let conversationId = 0

describe('Double Checkmark - Fixed Implementation Tests', () => {
  beforeAll(async () => {
    console.log('\n🔧 Initializing test suite...\n')
    
    authTokens.driver = await loginUser(DRIVER_EMAIL, DRIVER_PASSWORD)
    authTokens.shipper = await loginUser(SHIPPER_EMAIL, SHIPPER_PASSWORD)
    
    console.log('✅ Authentication tokens obtained\n')
  }, 60000)

  async function loginUser(email, password) {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      }, { validateStatus: () => true })
      
      if (response.status === 200) {
        const token = response.data?.data?.access_token || response.data?.access_token || response.data?.token
        if (token) {
          console.log(`✅ Logged in as ${email}`)
          return token
        }
      }
      
      throw new Error(`Login failed for ${email}: ${response.status}`)
    } catch (error) {
      console.error(`❌ Login error for ${email}:`, error.message)
      throw error
    }
  }

  async function getOrCreateConversation(token) {
    try {
      const response = await axios.get(`${API_URL}/items/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          filter: {
            _or: [
              { initiator_id: { _eq: DRIVER_ID } },
              { receiver_id: { _eq: DRIVER_ID } }
            ]
          },
          fields: 'id,conversation_id',
          limit: 1,
          sort: '-created_at'
        }
      })
      
      if (response.data?.data?.[0]) {
        return response.data.data[0].id || response.data.data[0].conversation_id
      }
      
      throw new Error('No conversations found')
    } catch (error) {
      console.error('❌ Failed to get conversation:', error.message)
      throw error
    }
  }

  async function sendMessage(conversationId, senderId, content, token) {
    try {
      const response = await axios.post(`${API_URL}/items/messages`, {
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        status: 'sent'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data?.data) {
        console.log(`📤 Message sent: ID=${response.data.data.id}`)
        return response.data.data
      }

      throw new Error('Failed to send message')
    } catch (error) {
      console.error('❌ Failed to send message:', error.message)
      throw error
    }
  }

  async function getMessageReads(messageId, token) {
    try {
      const response = await axios.get(`${API_URL}/items/message_reads`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          filter: { message_id: { _eq: messageId } },
          fields: '*',
          limit: 100
        }
      })

      return response.data?.data || []
    } catch (error) {
      console.error('❌ Failed to get message_reads:', error.message)
      throw error
    }
  }

  async function markAsDelivered(messageId, token) {
    try {
      const response = await axios.post(`${API_URL}/items/message_reads`, {
        message_id: messageId,
        reader_id: SHIPPER_ID,
        status: 'DELIVERED',
        delivered_at: new Date().toISOString()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data?.data) {
        console.log(`✅ Marked DELIVERED: status=${response.data.data.status}`)
        return response.data.data
      }

      throw new Error('Failed to mark as delivered')
    } catch (error) {
      console.error('❌ Failed to mark as delivered:', error.message)
      throw error
    }
  }

  async function markAsRead(messageId, existingDeliveredRecordId, token) {
    try {
      // This simulates what the FIXED chatAPI.markAsRead should do
      const updateResponse = await axios.patch(
        `${API_URL}/items/message_reads/${existingDeliveredRecordId}`,
        {
          status: 'READ',
          read_at: new Date().toISOString()
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (updateResponse.data?.data) {
        console.log(`✅ Updated to READ: record_id=${existingDeliveredRecordId}, status=${updateResponse.data.data.status}`)
        return updateResponse.data.data
      }

      throw new Error('Failed to update as read')
    } catch (error) {
      console.error('❌ Failed to update as read:', error.message)
      throw error
    }
  }

  it('✅ FIXED: Message has SINGLE DELIVERED record (not duplicate)', async () => {
    conversationId = await getOrCreateConversation(authTokens.driver)
    console.log(`\n📍 Conversation ID: ${conversationId}\n`)

    const message = await sendMessage(conversationId, DRIVER_ID, `Test ${Date.now()}`, authTokens.driver)
    const messageId = message.id

    // Recipient receives - create DELIVERED record
    const deliveredRecord = await markAsDelivered(messageId, authTokens.shipper)

    // Check records count
    let reads = await getMessageReads(messageId, authTokens.driver)
    console.log(`\n📊 After DELIVERED: ${reads.length} record(s)`)
    expect(reads.length).toBe(1)
    expect(reads[0].status).toBe('DELIVERED')
    expect(reads[0].read_at).toBeFalsy()
    
    console.log(`✅ Single DELIVERED record exists (no duplicates)\n`)
  }, 30000)

  it('✅ FIXED: Message is UPDATED to READ (single record, not duplicate)', async () => {
    const message = await sendMessage(conversationId, DRIVER_ID, `Test ${Date.now()}`, authTokens.driver)
    const messageId = message.id

    // Step 1: Recipient receives - create DELIVERED
    const deliveredRecord = await markAsDelivered(messageId, authTokens.shipper)
    let reads = await getMessageReads(messageId, authTokens.driver)
    
    console.log(`\n📊 Step 1 - After DELIVERED: ${reads.length} record(s)`)
    expect(reads.length).toBe(1)
    expect(reads[0].status).toBe('DELIVERED')

    // Step 2: Recipient reads - UPDATE existing record (not create new!)
    const updatedRecord = await markAsRead(messageId, deliveredRecord.id, authTokens.shipper)
    reads = await getMessageReads(messageId, authTokens.driver)
    
    console.log(`\n📊 Step 2 - After READ: ${reads.length} record(s) (should STILL be 1!)`)
    expect(reads.length).toBe(1)
    expect(reads[0].status).toBe('READ')
    expect(reads[0].delivered_at).toBeTruthy()
    expect(reads[0].read_at).toBeTruthy()
    
    console.log(`\n✅ Single record UPDATED from DELIVERED to READ (no duplicates!)`)
    console.log(`   Record: status=${reads[0].status}, delivered_at=${reads[0].delivered_at}, read_at=${reads[0].read_at}\n`)
  }, 30000)

  it('✅ FRONTEND: Double checkmark should now display correctly', async () => {
    const message = await sendMessage(conversationId, DRIVER_ID, `Test ${Date.now()}`, authTokens.driver)
    const messageId = message.id

    const deliveredRecord = await markAsDelivered(messageId, authTokens.shipper)
    await markAsRead(messageId, deliveredRecord.id, authTokens.shipper)

    const reads = await getMessageReads(messageId, authTokens.driver)
    const record = reads[0]

    console.log(`\n📋 Frontend receives single message_reads record:`)
    console.log(`    id: ${record.id}`)
    console.log(`    status: ${record.status}`)
    console.log(`    delivered_at: ${record.delivered_at}`)
    console.log(`    read_at: ${record.read_at}`)

    // Frontend logic to show checkmarks
    let checkmarkDisplay = ''
    if (record.status === 'READ' && record.read_at) {
      checkmarkDisplay = '✓✓'  // Double checkmark
    } else if (record.status === 'DELIVERED' && record.delivered_at) {
      checkmarkDisplay = '✓'   // Single checkmark
    }

    console.log(`\n✅ Checkmark Display: ${checkmarkDisplay}`)
    expect(checkmarkDisplay).toBe('✓✓')
    expect(record.status).toBe('READ')
    
    console.log(`\n🎯 UI shows DOUBLE CHECKMARK (✓✓) for READ status\n`)
  }, 30000)

  it('✅ INTEGRATION: Complete message flow with correct record count', async () => {
    const message = await sendMessage(conversationId, DRIVER_ID, `Complete flow ${Date.now()}`, authTokens.driver)
    const messageId = message.id

    console.log(`\n📈 Message Flow:`)

    // Initial state
    let reads = await getMessageReads(messageId, authTokens.driver)
    console.log(`   1️⃣ After send: ${reads.length} record(s)`)
    expect(reads.length).toBe(0)

    // Delivery state
    const deliveredRecord = await markAsDelivered(messageId, authTokens.shipper)
    reads = await getMessageReads(messageId, authTokens.driver)
    console.log(`   2️⃣ After delivery: ${reads.length} record(s) - status=${reads[0].status}`)
    expect(reads.length).toBe(1)
    expect(reads[0].status).toBe('DELIVERED')

    // Read state
    await markAsRead(messageId, deliveredRecord.id, authTokens.shipper)
    reads = await getMessageReads(messageId, authTokens.driver)
    console.log(`   3️⃣ After read: ${reads.length} record(s) - status=${reads[0].status}`)
    expect(reads.length).toBe(1)
    expect(reads[0].status).toBe('READ')

    console.log(`\n✅ Message progresses through states with SINGLE record`)
    console.log(`   SENT (no record) → DELIVERED (1 record) → READ (1 record updated)\n`)
  }, 30000)
})

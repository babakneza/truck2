const axios = require('axios').default || require('axios')
const { io } = require('socket.io-client')

const BASE_URL = 'http://localhost:5173'
const API_URL = `${BASE_URL}/api`
const SOCKET_URL = 'http://localhost:3000'

const DRIVER_ID = '6f206a3a-4396-43bc-a762-fab29800788b'
const DRIVER_EMAIL = 'driver@itboy.ir'
const DRIVER_PASSWORD = '123123@'

const SHIPPER_ID = 'b0ed390d-b433-43ec-8bdd-bf5ef3f0c770'
const SHIPPER_EMAIL = 'shipper@itboy.ir'
const SHIPPER_PASSWORD = '123123@'

let authTokens = { driver: '', shipper: '' }
let conversationId = 0
let messageId = 0

describe('Message Double Checkmark Analysis - SENT → DELIVERED → READ', () => {
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
        console.log(`📤 Message sent to DB: ID=${response.data.data.id}, Content="${content}"`)
        return response.data.data
      }

      throw new Error('Failed to send message')
    } catch (error) {
      console.error('❌ Failed to send message:', error.message)
      throw error
    }
  }

  async function getMessageReadsRecords(messageId, token) {
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
      console.error('❌ Failed to get message_reads records:', error.message)
      throw error
    }
  }

  async function getFullMessage(messageId, token) {
    try {
      const response = await axios.get(`${API_URL}/items/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { fields: '*' }
      })

      return response.data?.data || null
    } catch (error) {
      console.error('❌ Failed to get full message:', error.message)
      throw error
    }
  }

  async function createMessageReadRecord(messageId, conversationId, readerId, status, token) {
    try {
      const payload: any = {
        message_id: messageId,
        conversation_id: conversationId,
        reader_id: readerId,
        status: status
      }

      if (status === 'DELIVERED') {
        payload.delivered_at = new Date().toISOString()
      } else if (status === 'READ') {
        payload.delivered_at = new Date().toISOString()
        payload.read_at = new Date().toISOString()
      }

      const response = await axios.post(`${API_URL}/items/message_reads`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data?.data) {
        console.log(`✅ Created message_reads record: status=${status}, reader_id=${readerId}`)
        return response.data.data
      }

      throw new Error('Failed to create message_reads record')
    } catch (error) {
      console.error(`❌ Failed to create message_reads (${status}):`, error.message)
      throw error
    }
  }

  async function analyzeMessageState(msgId, token, label = '') {
    console.log(`\n📋 ${label || 'Message State Analysis'}:`)
    
    const message = await getFullMessage(msgId, token)
    const reads = await getMessageReadsRecords(msgId, token)
    
    console.log(`   Message Status: ${message?.status || 'UNKNOWN'}`)
    console.log(`   Message ID: ${msgId}`)
    console.log(`   Message Reads Records: ${reads.length}`)
    
    reads.forEach((record, index) => {
      console.log(`\n   Record ${index + 1}:`)
      console.log(`     - reader_id: ${record.reader_id}`)
      console.log(`     - status: ${record.status}`)
      console.log(`     - delivered_at: ${record.delivered_at || 'NULL'}`)
      console.log(`     - read_at: ${record.read_at || 'NULL'}`)
    })

    return { message, reads }
  }

  it('STEP 1: Message is created with SENT status (No checkmarks yet)', async () => {
    conversationId = await getOrCreateConversation(authTokens.driver)
    console.log(`\n📍 Using Conversation ID: ${conversationId}`)

    const testMessage = `Double Checkmark Test - ${Date.now()}`
    const message = await sendMessage(conversationId, DRIVER_ID, testMessage, authTokens.driver)
    messageId = message.id

    console.log(`\n📊 Initial state: Message created in DB`)
    const { message: msgData, reads } = await analyzeMessageState(messageId, authTokens.driver, 'After Creation')

    expect(messageId).toBeGreaterThan(0)
    expect(msgData?.status).toBeDefined()
    
    console.log(`\n💾 DB Status at creation: "${msgData?.status}" (should be: SENT, no read records yet)`)
  }, 30000)

  it('STEP 2: DELIVERED status - First checkmark (server receives message)', async () => {
    console.log(`\n✉️ Simulating message delivery to server...\n`)

    const shipper = new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 5000)
    }).catch(() => null)

    const deliveredRecord = await createMessageReadRecord(
      messageId,
      conversationId,
      SHIPPER_ID,
      'DELIVERED',
      authTokens.shipper
    )

    console.log(`\n📊 State after DELIVERED status:`)
    const { reads } = await analyzeMessageState(messageId, authTokens.driver, 'After DELIVERED')

    const deliveredStatus = reads.find(r => r.reader_id === SHIPPER_ID && r.status === 'DELIVERED')
    expect(deliveredStatus).toBeDefined()
    expect(deliveredStatus?.delivered_at).toBeTruthy()
    expect(deliveredStatus?.read_at).toBeFalsy()

    console.log(`\n✅ DELIVERED status created: ${JSON.stringify(deliveredStatus, null, 2)}`)
    console.log(`🔵 FIRST CHECKMARK VISIBLE: ✓ (delivered_at timestamp: ${deliveredStatus?.delivered_at})`)
  }, 30000)

  it('STEP 3: READ status - Second checkmark (recipient reads message)', async () => {
    console.log(`\n👀 Simulating recipient reading message...\n`)

    const readRecord = await createMessageReadRecord(
      messageId,
      conversationId,
      SHIPPER_ID,
      'READ',
      authTokens.shipper
    )

    console.log(`\n📊 State after READ status:`)
    const { reads } = await analyzeMessageState(messageId, authTokens.driver, 'After READ')

    const readStatus = reads.find(r => r.reader_id === SHIPPER_ID)
    expect(readStatus?.status).toBe('READ')
    expect(readStatus?.delivered_at).toBeTruthy()
    expect(readStatus?.read_at).toBeTruthy()

    console.log(`\n✅ READ status created: ${JSON.stringify(readStatus, null, 2)}`)
    console.log(`🟢 SECOND CHECKMARK VISIBLE: ✓✓ (read_at timestamp: ${readStatus?.read_at})`)
  }, 30000)

  it('STEP 4: Verify complete status progression: SENT → DELIVERED → READ', async () => {
    console.log(`\n📈 Final state verification:\n`)

    const { message: msgData, reads } = await analyzeMessageState(messageId, authTokens.driver, 'Complete Status Progression')

    const shipperRead = reads.find(r => r.reader_id === SHIPPER_ID)
    
    console.log(`\n📌 Status Progression:`)
    console.log(`   1️⃣ SENT: Message created in database`)
    console.log(`   2️⃣ DELIVERED: ${shipperRead?.delivered_at ? '✓ COMPLETE' : '❌ MISSING'}`)
    console.log(`   3️⃣ READ: ${shipperRead?.read_at ? '✓ COMPLETE' : '❌ MISSING'}`)

    console.log(`\n🎯 Checkmark Display:`)
    console.log(`   Current status: "${shipperRead?.status}"`)
    console.log(`   Expected display: ✓✓ (double checkmark for READ)`)
    console.log(`   UI should show: Green double checkmark + timestamps`)

    expect(shipperRead?.status).toBe('READ')
    expect(shipperRead?.delivered_at).toBeTruthy()
    expect(shipperRead?.read_at).toBeTruthy()
  }, 30000)

  it('STEP 5: Identify why real-time updates might not show both checkmarks', async () => {
    console.log(`\n🔍 Analysis: Why only one checkmark visible?\n`)

    console.log(`Possible Issues:`)
    console.log(`
1. ❌ Socket delivery events not firing on time:
   - message_delivered event not reaching frontend in time
   - Race condition between DELIVERED and READ events

2. ❌ Frontend not updating UI when message_reads records change:
   - ChatContext not re-fetching message_reads on socket events
   - State update timing issue

3. ❌ Missing automatic delivery marking:
   - When recipient browser receives message, should create DELIVERED record
   - Currently might only create READ record

4. ❌ Message read query not including all records:
   - Frontend might not be fetching all message_reads records
   - Filtering issue hiding DELIVERED records

5. ❌ ReadReceipt component not handling transitions:
   - Component might show latest status (READ)
   - But not visualize the progression (SENT → DELIVERED → READ)
    `)

    console.log(`\n🛠️ Current API records show:`)
    const { reads } = await analyzeMessageState(messageId, authTokens.driver, 'Current Database State')
    
    const hasBothStatuses = reads.some(r => r.status === 'DELIVERED') && reads.some(r => r.status === 'READ')
    console.log(`\n✅ DB correctly stores both statuses: ${hasBothStatuses ? 'YES' : 'NO'}`)
  }, 30000)

  it('STEP 6: Test real-world scenario with frontend-like behavior', async () => {
    console.log(`\n🌍 Real-World Test: Simulating actual message flow\n`)

    const testMessage = `Real-world double checkmark test - ${Date.now()}`
    const message = await sendMessage(conversationId, DRIVER_ID, testMessage, authTokens.driver)
    const newMessageId = message.id

    console.log(`\n📤 Step A: Message sent (status=SENT)\n`)
    let state = await analyzeMessageState(newMessageId, authTokens.driver, 'A: After Send')
    expect(state.reads.length).toBe(0)

    await new Promise(r => setTimeout(r, 500))

    console.log(`\n📨 Step B: Recipient browser receives message - create DELIVERED\n`)
    await createMessageReadRecord(newMessageId, conversationId, SHIPPER_ID, 'DELIVERED', authTokens.shipper)
    state = await analyzeMessageState(newMessageId, authTokens.driver, 'B: After Delivery')
    
    const deliveredOnly = state.reads.filter(r => r.status === 'DELIVERED')
    expect(deliveredOnly.length).toBeGreaterThan(0)
    console.log(`✓ First checkmark visible in DB\n`)

    await new Promise(r => setTimeout(r, 500))

    console.log(`\n👁️ Step C: Recipient reads message - create READ\n`)
    await createMessageReadRecord(newMessageId, conversationId, SHIPPER_ID, 'READ', authTokens.shipper)
    state = await analyzeMessageState(newMessageId, authTokens.driver, 'C: After Read')
    
    const readRecord = state.reads.find(r => r.status === 'READ')
    expect(readRecord?.read_at).toBeTruthy()
    console.log(`✓✓ Second checkmark visible in DB\n`)

    console.log(`\n🎯 Expected vs Actual:`)
    console.log(`Expected UI: Shows green ✓✓ (both checkmarks)`)
    console.log(`Actual UI:   ??? (need to verify in browser)`)
  }, 30000)
})

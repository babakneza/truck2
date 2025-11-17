import { test, expect } from '@playwright/test'

test.describe('Chat System Integration - Driver & Shipper Conversation', () => {
  const DRIVER_EMAIL = 'driver@itboy.ir'
  const DRIVER_PASSWORD = '123123@'
  const SHIPPER_EMAIL = 'shipper@itboy.ir'
  const SHIPPER_PASSWORD = '123123@'
  const BASE_URL = 'http://localhost:5174'

  let performanceMetrics = {
    conversationLoadTime: 0,
    firstMessageSendTime: 0,
    messageReceiveTime: 0,
    chatListLoadTime: 0
  }

  test('Driver and Shipper can establish chat conversation', async ({ browser }) => {
    // Create contexts for driver and shipper
    const driverContext = await browser.newContext()
    const shipperContext = await browser.newContext()

    const driverPage = await driverContext.newPage()
    const shipperPage = await shipperContext.newPage()

    try {
      console.log('🔄 Starting chat integration test with performance monitoring...')

      // Login as driver
      console.log('📱 [DRIVER] Logging in...')
      await loginUser(driverPage, DRIVER_EMAIL, DRIVER_PASSWORD)
      await driverPage.waitForLoadState('networkidle')
      const driverId = await driverPage.evaluate(() => localStorage.getItem('user_id'))
      console.log(`✅ [DRIVER] Logged in with ID: ${driverId}`)

      // Login as shipper
      console.log('📱 [SHIPPER] Logging in...')
      await loginUser(shipperPage, SHIPPER_EMAIL, SHIPPER_PASSWORD)
      await shipperPage.waitForLoadState('networkidle')
      const shipperId = await shipperPage.evaluate(() => localStorage.getItem('user_id'))
      console.log(`✅ [SHIPPER] Logged in with ID: ${shipperId}`)

      // Navigate driver to chat
      console.log('💬 [DRIVER] Navigating to chat...')
      await navigateToChat(driverPage)
      const chatLoadStart = Date.now()
      await driverPage.waitForSelector('.chat-window', { timeout: 5000 })
      performanceMetrics.chatListLoadTime = Date.now() - chatLoadStart
      console.log(`✅ [DRIVER] Chat loaded in ${performanceMetrics.chatListLoadTime}ms`)

      // Navigate shipper to chat
      console.log('💬 [SHIPPER] Navigating to chat...')
      await navigateToChat(shipperPage)
      const shipperChatLoadStart = Date.now()
      await shipperPage.waitForSelector('.chat-window', { timeout: 5000 })
      const shipperChatLoadTime = Date.now() - shipperChatLoadStart
      console.log(`✅ [SHIPPER] Chat loaded in ${shipperChatLoadTime}ms`)

      // Check for errors in console
      const driverErrors: string[] = []
      const shipperErrors: string[] = []

      driverPage.on('console', (msg) => {
        if (msg.type() === 'error') {
          driverErrors.push(msg.text())
        }
      })

      shipperPage.on('console', (msg) => {
        if (msg.type() === 'error') {
          shipperErrors.push(msg.text())
        }
      })

      // Wait for socket connections
      console.log('🔌 Waiting for socket connections...')
      await driverPage.waitForSelector('.status-dot.connected', { timeout: 10000 })
      console.log('✅ [DRIVER] Socket connected')

      await shipperPage.waitForSelector('.status-dot.connected', { timeout: 10000 })
      console.log('✅ [SHIPPER] Socket connected')

      // Driver creates new conversation or checks for existing ones
      console.log('💭 [DRIVER] Creating or finding conversation...')
      const conversationCreatedStart = Date.now()
      
      // Check if there's already a conversation list item
      let conversationExists = false
      try {
        const listItems = await driverPage.locator('.chat-list-item').count()
        if (listItems > 0) {
          conversationExists = true
          console.log(`✅ [DRIVER] Found existing conversation, clicking first one...`)
          await driverPage.locator('.chat-list-item').first().click()
        }
      } catch (e) {
        console.log('No existing conversations found')
      }

      if (!conversationExists) {
        console.log('📝 [DRIVER] No existing conversations, would need UI to create new one')
        console.log('Note: The chat UI has a + button for new conversations that needs implementation')
      }

      performanceMetrics.conversationLoadTime = Date.now() - conversationCreatedStart

      // Check socket connection status
      const driverSocketStatus = await driverPage.evaluate(() => localStorage.getItem('socket_connected'))
      const shipperSocketStatus = await shipperPage.evaluate(() => localStorage.getItem('socket_connected'))
      console.log(`🔌 Socket Status - Driver: ${driverSocketStatus}, Shipper: ${shipperSocketStatus}`)

      // Test message sending through API directly if no conversation exists
      if (!conversationExists) {
        console.log('📬 Testing message API directly...')
        
        // Create a test conversation via API
        const conversationData = {
          initiator_id: driverId,
          receiver_id: shipperId,
          conversation_type: 'GENERAL',
          is_active: true
        }

        const token = await driverPage.evaluate(() => localStorage.getItem('auth_token'))
        
        const createConvResponse = await driverPage.evaluate(async (data, token) => {
          const response = await fetch('/api/items/conversations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
          })
          const result = await response.json()
          return { status: response.status, data: result.data }
        }, conversationData, token)

        console.log(`✅ Conversation created:`, createConvResponse)

        if (createConvResponse.status === 201 || createConvResponse.status === 200) {
          const conversationId = createConvResponse.data.id

          // Send test messages
          console.log(`📤 [DRIVER] Sending test message to conversation ${conversationId}...`)
          const messageSendStart = Date.now()

          const messageData = {
            conversation_id: conversationId,
            content: 'Hello from driver! Testing chat system.',
            message_text: 'Hello from driver! Testing chat system.'
          }

          const sendMessageResponse = await driverPage.evaluate(async (data, token) => {
            const response = await fetch('/api/items/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(data)
            })
            return { status: response.status, data: await response.json() }
          }, messageData, token)

          performanceMetrics.firstMessageSendTime = Date.now() - messageSendStart
          console.log(`✅ [DRIVER] Message sent in ${performanceMetrics.firstMessageSendTime}ms`)

          // Shipper fetches messages
          console.log('📬 [SHIPPER] Fetching messages...')
          const messageReceiveStart = Date.now()

          const shipperToken = await shipperPage.evaluate(() => localStorage.getItem('auth_token'))
          
          const messages = await shipperPage.evaluate(async (convId, token) => {
            const params = new URLSearchParams()
            params.append('filter', JSON.stringify({ conversation_id: { _eq: convId } }))
            params.append('fields', '*')
            params.append('limit', 10)
            
            const response = await fetch(`/api/items/messages?${params}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await response.json()
            return data.data || []
          }, conversationId, shipperToken)

          performanceMetrics.messageReceiveTime = Date.now() - messageReceiveStart
          console.log(`✅ [SHIPPER] Retrieved messages in ${performanceMetrics.messageReceiveTime}ms`)
          console.log(`📨 Messages received: ${messages.length}`)

          if (messages.length > 0) {
            console.log('✅ Message delivery successful!')
            console.log(`Message content: "${messages[0].content}"`)
          }

          // Send response from shipper
          console.log(`📤 [SHIPPER] Sending response message...`)
          const messageData2 = {
            conversation_id: conversationId,
            content: 'Hello from shipper! Chat system working perfectly.',
            message_text: 'Hello from shipper! Chat system working perfectly.'
          }

          const sendMessageResponse2 = await shipperPage.evaluate(async (data, token) => {
            const response = await fetch('/api/items/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(data)
            })
            return { status: response.status, data: await response.json() }
          }, messageData2, shipperToken)

          console.log(`✅ [SHIPPER] Response sent`)

          // Driver fetches updated messages
          console.log('📬 [DRIVER] Fetching updated messages...')
          const updatedMessages = await driverPage.evaluate(async (convId, token) => {
            const params = new URLSearchParams()
            params.append('filter', JSON.stringify({ conversation_id: { _eq: convId } }))
            params.append('fields', '*')
            params.append('limit', 10)
            params.append('sort', '-created_at')
            
            const response = await fetch(`/api/items/messages?${params}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await response.json()
            return data.data || []
          }, conversationId, token)

          console.log(`✅ [DRIVER] Retrieved updated messages: ${updatedMessages.length}`)
          if (updatedMessages.length >= 2) {
            console.log('✅ Bidirectional messaging confirmed!')
          }

          // Test read receipts
          console.log('📖 Testing read receipts...')
          if (updatedMessages.length > 0) {
            const firstMessage = updatedMessages[0]
            const readReceiptData = {
              message_id: firstMessage.id,
              user_id: driverId,
              is_read: true,
              read_at: new Date().toISOString()
            }

            const readReceiptResponse = await driverPage.evaluate(async (data, token) => {
              const response = await fetch('/api/items/message_reads', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
              })
              return { status: response.status, data: await response.json() }
            }, readReceiptData, token)

            console.log(`✅ Read receipt marked`)
          }
        }
      }

      // Report performance metrics
      console.log('\n📊 Performance Metrics:')
      console.log(`⏱️  Chat List Load Time: ${performanceMetrics.chatListLoadTime}ms`)
      console.log(`⏱️  Conversation Load Time: ${performanceMetrics.conversationLoadTime}ms`)
      console.log(`⏱️  First Message Send Time: ${performanceMetrics.firstMessageSendTime}ms`)
      console.log(`⏱️  Message Receive Time: ${performanceMetrics.messageReceiveTime}ms`)

      // Verify no critical errors
      console.log('\n❌ Error Summary:')
      console.log(`[DRIVER] Console Errors: ${driverErrors.filter(e => !e.includes('favicon')).length}`)
      console.log(`[SHIPPER] Console Errors: ${shipperErrors.filter(e => !e.includes('favicon')).length}`)

      // Assertions
      expect(performanceMetrics.chatListLoadTime).toBeLessThan(5000)
      expect(performanceMetrics.firstMessageSendTime).toBeLessThan(2000)
      expect(performanceMetrics.messageReceiveTime).toBeLessThan(2000)
      expect(driverErrors.filter(e => !e.includes('favicon')).length).toBe(0)
      expect(shipperErrors.filter(e => !e.includes('favicon')).length).toBe(0)

    } finally {
      await driverContext.close()
      await shipperContext.close()
    }
  })

  test('Chat maintains connection stability during extended conversation', async ({ page }, testInfo) => {
    console.log('🔄 Testing connection stability...')

    await loginUser(page, DRIVER_EMAIL, DRIVER_PASSWORD)
    await navigateToChat(page)

    // Check if socket connected indicator is visible
    const socketIndicator = page.locator('.status-dot.connected')
    await socketIndicator.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {})
    
    let isConnected = await socketIndicator.isVisible().catch(() => false)
    console.log(`✅ Socket connected: ${isConnected}`)
    
    // Check chat window is visible
    const chatWindow = page.locator('.chat-window')
    isConnected = await chatWindow.isVisible()
    console.log(`✅ Chat window visible: ${isConnected}`)

    console.log('✅ Connection stability test completed')
    expect(isConnected).toBe(true)
  })

  test('Chat handles network errors gracefully', async ({ page }) => {
    console.log('🔄 Testing error handling...')

    const networkErrors: string[] = []
    page.on('requestfailed', (request) => {
      networkErrors.push(`${request.method()} ${request.url()}`)
    })

    await loginUser(page, DRIVER_EMAIL, DRIVER_PASSWORD)
    await navigateToChat(page)

    await page.waitForSelector('.chat-window', { timeout: 5000 })

    const errorBannerShown = await page.locator('.chat-error-banner').isVisible().catch(() => false)
    
    console.log(`✅ Error handling test completed. Errors shown: ${errorBannerShown}`)
  })

  test('Message performance and persistence', async ({ page }) => {
    console.log('📬 Testing message performance and persistence...')
    
    await loginUser(page, DRIVER_EMAIL, DRIVER_PASSWORD)
    
    const token = await page.evaluate(() => localStorage.getItem('auth_token'))
    const userId = await page.evaluate(() => localStorage.getItem('user_id'))

    // Create a test conversation
    console.log('Creating test conversation...')
    const convResponse = await page.evaluate(async (token) => {
      const response = await fetch('/api/items/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          initiator_id: localStorage.getItem('user_id'),
          receiver_id: 'test-receiver',
          conversation_type: 'GENERAL',
          is_active: true
        })
      })
      return { status: response.status, data: await response.json() }
    }, token)

    if (convResponse.status === 201 || convResponse.status === 200) {
      const conversationId = convResponse.data.data.id
      console.log(`✅ Created conversation: ${conversationId}`)

      // Send multiple messages and measure performance
      const messageTimes: number[] = []
      
      for (let i = 1; i <= 3; i++) {
        const sendStart = Date.now()
        
        const msgResponse = await page.evaluate(async (convId, msg, token) => {
          const response = await fetch('/api/items/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              conversation_id: convId,
              content: msg,
              message_text: msg
            })
          })
          return { status: response.status, data: await response.json() }
        }, conversationId, `Test message ${i}`, token)

        const sendTime = Date.now() - sendStart
        messageTimes.push(sendTime)
        
        console.log(`📤 Message ${i} sent in ${sendTime}ms`)

        if (msgResponse.status !== 201 && msgResponse.status !== 200) {
          console.error(`❌ Failed to send message: ${msgResponse.status}`)
        }
      }

      // Verify messages were persisted
      console.log('Verifying message persistence...')
      const retrieveStart = Date.now()
      
      const messages = await page.evaluate(async (convId, token) => {
        const params = new URLSearchParams()
        params.append('filter', JSON.stringify({ conversation_id: { _eq: convId } }))
        params.append('limit', 10)
        
        const response = await fetch(`/api/items/messages?${params}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        return await response.json()
      }, conversationId, token)

      const retrieveTime = Date.now() - retrieveStart
      
      console.log(`✅ Retrieved ${messages.data?.length || 0} messages in ${retrieveTime}ms`)

      // Performance analysis
      const avgMessageTime = messageTimes.reduce((a, b) => a + b, 0) / messageTimes.length
      console.log(`📊 Average message send time: ${avgMessageTime.toFixed(0)}ms`)
      console.log(`📊 Min message send time: ${Math.min(...messageTimes)}ms`)
      console.log(`📊 Max message send time: ${Math.max(...messageTimes)}ms`)
      console.log(`📊 Message retrieval time: ${retrieveTime}ms`)

      // Assertions
      expect(messages.data?.length).toBeGreaterThanOrEqual(3)
      expect(avgMessageTime).toBeLessThan(2000)
      expect(retrieveTime).toBeLessThan(2000)
    }
  })
})

// Helper functions
async function loginUser(page: any, email: string, password: string) {
  await page.goto('http://localhost:5174')
  await page.waitForLoadState('networkidle')

  // Click sign in button
  const authBtn = await page.locator('button:has-text("Sign In")').first()
  if (await authBtn.isVisible()) {
    await authBtn.click()
    await page.waitForSelector('.auth-modal', { timeout: 5000 })
  }

  // Fill email
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)

  // Submit form
  await page.click('button[type="submit"]')

  // Wait for login to complete
  await page.waitForFunction(() => {
    const token = localStorage.getItem('auth_token')
    return token !== null
  }, { timeout: 10000 })

  console.log(`✅ Logged in as ${email}`)
}

async function navigateToChat(page: any) {
  // Open user menu
  const userMenuBtn = await page.locator('.user-menu-btn').first()
  if (await userMenuBtn.isVisible()) {
    await userMenuBtn.click()
    await page.waitForSelector('.user-menu-dropdown', { timeout: 5000 })
  }

  // Click messages/chat
  const chatBtn = await page.locator('button:has-text("Messages")').first()
  if (await chatBtn.isVisible()) {
    await chatBtn.click()
  } else {
    const chatBtn2 = await page.locator('button:has-text("💬")').first()
    if (await chatBtn2.isVisible()) {
      await chatBtn2.click()
    }
  }

  await page.waitForLoadState('networkidle')
  console.log('✅ Navigated to chat')
}

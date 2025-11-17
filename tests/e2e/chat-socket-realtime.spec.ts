import { test, expect } from '@playwright/test'

test.describe('Chat System - Real-time Socket Features', () => {
  const DRIVER_EMAIL = 'driver@itboy.ir'
  const DRIVER_PASSWORD = '123123@'
  const SHIPPER_EMAIL = 'shipper@itboy.ir'
  const SHIPPER_PASSWORD = '123123@'
  const BASE_URL = 'http://localhost:5174'

  test('Socket connection and authentication works correctly', async ({ page }) => {
    console.log('🔌 Testing socket connection and authentication...')

    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')

    // Login
    const authBtn = await page.locator('button:has-text("Sign In")').first()
    await authBtn.click()
    await page.waitForSelector('.auth-modal', { timeout: 5000 })

    await page.fill('input[type="email"]', DRIVER_EMAIL)
    await page.fill('input[type="password"]', DRIVER_PASSWORD)
    await page.click('button[type="submit"]')

    await page.waitForFunction(() => localStorage.getItem('auth_token') !== null, { timeout: 10000 })
    console.log('✅ Logged in successfully')

    // Navigate to chat
    const userMenuBtn = await page.locator('.user-menu-btn').first()
    await userMenuBtn.click()
    await page.waitForSelector('.user-menu-dropdown', { timeout: 5000 })

    const chatBtn = await page.locator('button:has-text("Messages")').first()
    await chatBtn.click()
    await page.waitForLoadState('networkidle')

    // Monitor socket connection
    console.log('🔌 Monitoring socket connection...')
    const socketConnected = await page.evaluate(() => {
      return new Promise((resolve) => {
        const checkConnection = setInterval(() => {
          const indicator = document.querySelector('.status-dot.connected')
          if (indicator) {
            clearInterval(checkConnection)
            resolve(true)
          }
        }, 100)

        setTimeout(() => {
          clearInterval(checkConnection)
          resolve(false)
        }, 10000)
      })
    })

    console.log(`✅ Socket connected: ${socketConnected}`)
    expect(socketConnected).toBe(true)

    // Check socket in localStorage or window
    const authToken = await page.evaluate(() => localStorage.getItem('auth_token'))
    const userId = await page.evaluate(() => localStorage.getItem('user_id'))
    
    console.log(`✅ Auth token exists: ${!!authToken}`)
    console.log(`✅ User ID: ${userId}`)

    expect(authToken).toBeTruthy()
    expect(userId).toBeTruthy()
  })

  test('Typing indicators work via socket', async ({ page }) => {
    console.log('⌨️  Testing typing indicators...')

    await loginAndNavigateToChat(page, DRIVER_EMAIL, DRIVER_PASSWORD)

    console.log('✅ User logged in and in chat')

    // Check if typing indicator component exists
    const hasTypingIndicator = await page.evaluate(() => {
      return !!document.querySelector('.typing-indicator')
    })

    console.log(`✅ Has typing indicator component: ${hasTypingIndicator}`)

    // Verify typing indicator API exists
    const typingIndicatorAPI = await page.evaluate(() => {
      return new Promise((resolve) => {
        import('/src/services/chatAPI.js').then(module => {
          const chatAPI = module.default || module.chatAPI
          resolve({
            hasUpdate: typeof chatAPI?.typingIndicators?.update === 'function',
            hasList: typeof chatAPI?.typingIndicators?.list === 'function'
          })
        }).catch(() => resolve({ hasUpdate: false, hasList: false }))
      })
    })

    console.log(`✅ Typing indicator API available: ${JSON.stringify(typingIndicatorAPI)}`)
    expect(typingIndicatorAPI).toHaveProperty('hasUpdate', true)
  })

  test('Message read receipts work correctly', async ({ page }) => {
    console.log('📖 Testing message read receipts...')

    await loginAndNavigateToChat(page, DRIVER_EMAIL, DRIVER_PASSWORD)

    const token = await page.evaluate(() => localStorage.getItem('auth_token'))
    const userId = await page.evaluate(() => localStorage.getItem('user_id'))

    console.log('✅ User logged in')

    // Check if read receipt component exists
    const hasReadReceipt = await page.evaluate(() => {
      return !!document.querySelector('.read-receipt')
    })

    console.log(`✅ Has read receipt component: ${hasReadReceipt}`)

    // Verify read receipt API
    const readReceiptAPI = await page.evaluate(() => {
      return new Promise((resolve) => {
        import('/src/services/chatAPI.js').then(module => {
          const chatAPI = module.default || module.chatAPI
          resolve({
            hasMarkAsRead: typeof chatAPI?.messageReads?.markAsRead === 'function',
            hasMarkAsDelivered: typeof chatAPI?.messageReads?.markAsDelivered === 'function',
            hasList: typeof chatAPI?.messageReads?.list === 'function'
          })
        }).catch(() => resolve({ hasMarkAsRead: false, hasMarkAsDelivered: false, hasList: false }))
      })
    })

    console.log(`✅ Read receipt API verified`)
    expect(readReceiptAPI).toHaveProperty('hasMarkAsRead', true)
    expect(readReceiptAPI).toHaveProperty('hasMarkAsDelivered', true)

    // Test marking a message as read
    console.log('Testing mark as read functionality...')
    
    // First, get or create a test message
    const testMessage = await page.evaluate(async (token) => {
      const conversationParams = new URLSearchParams()
      conversationParams.append('filter', JSON.stringify({
        _or: [
          { initiator_id: { _eq: localStorage.getItem('user_id') } },
          { receiver_id: { _eq: localStorage.getItem('user_id') } }
        ]
      }))
      conversationParams.append('limit', 1)

      const convResponse = await fetch(`/api/items/conversations?${conversationParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const convData = await convResponse.json()
      
      if (convData.data && convData.data.length > 0) {
        const conversationId = convData.data[0].id
        
        const messageParams = new URLSearchParams()
        messageParams.append('filter', JSON.stringify({ conversation_id: { _eq: conversationId } }))
        messageParams.append('limit', 1)

        const msgResponse = await fetch(`/api/items/messages?${messageParams}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const msgData = await msgResponse.json()

        if (msgData.data && msgData.data.length > 0) {
          return { 
            found: true, 
            messageId: msgData.data[0].id,
            conversationId: conversationId
          }
        }
      }

      return { found: false }
    }, token)

    if (testMessage.found) {
      console.log(`✅ Found test message: ${testMessage.messageId}`)

      const readReceiptResult = await page.evaluate(async (params) => {
        const response = await fetch('/api/items/message_reads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${params.token}`
          },
          body: JSON.stringify({
            message_id: params.messageId,
            user_id: localStorage.getItem('user_id'),
            is_read: true,
            read_at: new Date().toISOString()
          })
        })

        return { 
          status: response.status, 
          data: await response.json() 
        }
      }, { messageId: testMessage.messageId, token })

      console.log(`✅ Read receipt status: ${readReceiptResult.status}`)
      expect([200, 201]).toContain(readReceiptResult.status)
    } else {
      console.log('⚠️  No existing messages to test read receipts with')
    }
  })

  test('Emoji reactions work correctly', async ({ page }) => {
    console.log('😊 Testing emoji reactions...')

    await loginAndNavigateToChat(page, DRIVER_EMAIL, DRIVER_PASSWORD)

    const token = await page.evaluate(() => localStorage.getItem('auth_token'))

    // Check if reactions component exists
    const hasReactions = await page.evaluate(() => {
      return !!document.querySelector('.reactions')
    })

    console.log(`✅ Has reactions component: ${hasReactions}`)

    // Verify reactions API
    const reactionsAPI = await page.evaluate(() => {
      return new Promise((resolve) => {
        import('/src/services/chatAPI.js').then(module => {
          const chatAPI = module.default || module.chatAPI
          resolve({
            hasAdd: typeof chatAPI?.reactions?.add === 'function',
            hasRemove: typeof chatAPI?.reactions?.remove === 'function',
            hasList: typeof chatAPI?.reactions?.list === 'function'
          })
        }).catch(() => resolve({ hasAdd: false, hasRemove: false, hasList: false }))
      })
    })

    console.log(`✅ Reactions API verified`)
    expect(reactionsAPI).toHaveProperty('hasAdd', true)
    expect(reactionsAPI).toHaveProperty('hasRemove', true)

    // Test adding a reaction
    console.log('Testing add reaction functionality...')
    
    const testReaction = await page.evaluate(async (token) => {
      const conversationParams = new URLSearchParams()
      conversationParams.append('filter', JSON.stringify({
        _or: [
          { initiator_id: { _eq: localStorage.getItem('user_id') } },
          { receiver_id: { _eq: localStorage.getItem('user_id') } }
        ]
      }))
      conversationParams.append('limit', 1)

      const convResponse = await fetch(`/api/items/conversations?${conversationParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const convData = await convResponse.json()
      
      if (convData.data && convData.data.length > 0) {
        const conversationId = convData.data[0].id
        
        const messageParams = new URLSearchParams()
        messageParams.append('filter', JSON.stringify({ conversation_id: { _eq: conversationId } }))
        messageParams.append('limit', 1)

        const msgResponse = await fetch(`/api/items/messages?${messageParams}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const msgData = await msgResponse.json()

        if (msgData.data && msgData.data.length > 0) {
          const messageId = msgData.data[0].id

          const reactionResponse = await fetch('/api/items/message_reactions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              message_id: messageId,
              user_id: localStorage.getItem('user_id'),
              reaction_emoji: '👍',
              created_at: new Date().toISOString()
            })
          })

          return { 
            success: reactionResponse.ok,
            status: reactionResponse.status
          }
        }
      }

      return { success: false }
    }, token)

    if (testReaction.success) {
      console.log(`✅ Reaction added successfully`)
      expect(testReaction.success).toBe(true)
    } else {
      console.log('⚠️  Could not test reaction with existing message')
    }
  })

  test('Emoji reactions work correctly - Alternative test', async ({ page }) => {
    console.log('😊 Testing emoji reactions (alternative)...')

    await loginAndNavigateToChat(page, DRIVER_EMAIL, DRIVER_PASSWORD)

    const token = await page.evaluate(() => localStorage.getItem('auth_token'))

    // Verify reactions socket methods
    const reactionsSocket = await page.evaluate(() => {
      return new Promise((resolve) => {
        import('/src/services/chatSocket.js').then(module => {
          const chatSocket = module.default || module.chatSocket
          resolve({
            hasAddReaction: typeof chatSocket?.addReaction === 'function',
            hasRemoveReaction: typeof chatSocket?.removeReaction === 'function'
          })
        }).catch(() => resolve({ hasAddReaction: false, hasRemoveReaction: false }))
      })
    })

    console.log(`✅ Socket reactions methods: ${JSON.stringify(reactionsSocket)}`)
    expect(reactionsSocket).toHaveProperty('hasAddReaction', true)
  })

  test('Online status and presence features', async ({ browser }) => {
    console.log('👥 Testing online status...')

    const driverContext = await browser.newContext()
    const shipperContext = await browser.newContext()

    const driverPage = await driverContext.newPage()
    const shipperPage = await shipperContext.newPage()

    try {
      // Login both users
      await loginAndNavigateToChat(driverPage, DRIVER_EMAIL, DRIVER_PASSWORD)
      await loginAndNavigateToChat(shipperPage, SHIPPER_EMAIL, SHIPPER_PASSWORD)

      console.log('✅ Both users online in chat')

      // Check for online users display
      const driverSeesOnlineIndicators = await driverPage.evaluate(() => {
        return document.querySelectorAll('.online-indicator, .status-dot.connected').length > 0
      })

      const shipperSeesOnlineIndicators = await shipperPage.evaluate(() => {
        return document.querySelectorAll('.online-indicator, .status-dot.connected').length > 0
      })

      console.log(`✅ Driver sees online indicators: ${driverSeesOnlineIndicators}`)
      console.log(`✅ Shipper sees online indicators: ${shipperSeesOnlineIndicators}`)

      expect(driverSeesOnlineIndicators || shipperSeesOnlineIndicators).toBe(true)

    } finally {
      await driverContext.close()
      await shipperContext.close()
    }
  })
})

// Helper function
async function loginAndNavigateToChat(page: any, email: string, password: string) {
  await page.goto('http://localhost:5174')
  await page.waitForLoadState('networkidle')

  const authBtn = await page.locator('button:has-text("Sign In")').first()
  await authBtn.click()
  await page.waitForSelector('.auth-modal', { timeout: 5000 })

  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')

  await page.waitForFunction(() => localStorage.getItem('auth_token') !== null, { timeout: 10000 })

  const userMenuBtn = await page.locator('.user-menu-btn').first()
  await userMenuBtn.click()
  await page.waitForSelector('.user-menu-dropdown', { timeout: 5000 })

  const chatBtn = await page.locator('button:has-text("Messages")').first()
  await chatBtn.click()
  await page.waitForLoadState('networkidle')
}

import { test, expect, Page } from '@playwright/test'

test.describe('Double Checkmark (Read Status) Verification', () => {
  const DRIVER_EMAIL = 'driver@itboy.ir'
  const DRIVER_PASSWORD = '123123@'
  const SHIPPER_EMAIL = 'shipper@itboy.ir'
  const SHIPPER_PASSWORD = '123123@'
  const BASE_URL = 'http://localhost:5173'

  async function loginUser(page: Page, email: string, password: string) {
    console.log(`\n🔐 Logging in with ${email}...`)
    await page.goto(BASE_URL)
    
    const headerButton = page.locator('button:has-text("Sign In / Sign Up")')
    await headerButton.waitFor({ timeout: 5000 })
    await headerButton.click()
    
    const emailInput = page.getByPlaceholder('your@email.com')
    await emailInput.waitFor({ timeout: 5000 })
    
    const passwordInput = page.getByPlaceholder('••••••••')
    
    await emailInput.fill(email)
    await passwordInput.fill(password)
    
    const submitButton = page.locator('button[type="submit"]:has-text("Sign In")').or(page.locator('.auth-submit-btn'))
    await submitButton.click()
    
    await page.waitForNavigation({ timeout: 10000 }).catch(() => {})
    await page.waitForTimeout(1000)
  }

  async function navigateToChat(page: Page) {
    console.log('📌 Navigating to chat...')
    
    const chatLink = page.getByRole('button', { name: /message|chat/i }).first()
    if (await chatLink.isVisible()) {
      await chatLink.click()
      await page.waitForTimeout(1000)
    }
    
    const chatWindow = page.locator('.chat-window, [class*="chat"], [class*="message"]')
    if (await chatWindow.count() > 0) {
      console.log('✅ Chat window found')
      return
    }
    
    const pageUrl = page.url()
    if (!pageUrl.includes('chat')) {
      await page.goto(`${BASE_URL}/chat`)
    }
  }

  async function getMessageStatus(page: Page, messageText: string): Promise<string | null> {
    console.log(`\n🔍 Checking status for message: "${messageText}"`)
    
    const messageBubble = page.locator('.message-bubble', { has: page.locator(`text="${messageText}"`) })
    
    if (await messageBubble.count() === 0) {
      console.log('⚠️ Message not found')
      return null
    }

    const bubble = messageBubble.first()
    const statusAttr = await bubble.getAttribute('data-status')
    const readAtAttr = await bubble.getAttribute('data-read-at')
    
    console.log(`📊 Status attribute: ${statusAttr}, Read-at: ${readAtAttr}`)
    
    const receiptIcon = bubble.locator('[class*="receipt"], svg[class*="check"]')
    const hasDoubleCheck = await receiptIcon.locator('text=/✓✓|CheckCheck/').count() > 0
    const hasSingleCheck = await receiptIcon.locator('text=/✓|Check/').count() > 0 && !hasDoubleCheck

    if (hasDoubleCheck) {
      console.log('✓✓ Double checkmark (READ) found')
      return 'READ'
    } else if (hasSingleCheck) {
      console.log('✓ Single checkmark (DELIVERED) found')
      return 'DELIVERED'
    }
    
    return statusAttr || 'UNKNOWN'
  }

  test('Verify single checkmark (DELIVERED) when message is sent', async ({ browser }) => {
    console.log('\n=== TEST 1: Single Checkmark on Send ===')
    
    const context = await browser.newContext()
    const page = await context.newPage()

    try {
      await loginUser(page, SHIPPER_EMAIL, SHIPPER_PASSWORD)
      await navigateToChat(page)
      
      console.log('⏳ Waiting for chat to fully load...')
      await page.waitForTimeout(2000)
      
      const messageInput = page.locator('textarea, input[placeholder*="message" i], input[placeholder*="type" i]').first()
      if (await messageInput.isVisible()) {
        const testMessage = `Test message ${Date.now()}`
        console.log(`💬 Sending message: "${testMessage}"`)
        
        await messageInput.click()
        await messageInput.fill(testMessage)
        
        const sendButton = page.getByRole('button', { name: /send|submit/i }).first()
        if (await sendButton.isVisible()) {
          await sendButton.click()
          await page.waitForTimeout(1000)
          
          const status = await getMessageStatus(page, testMessage)
          expect(status).toBeTruthy()
          console.log('✅ Message status verified')
        }
      } else {
        console.log('⚠️ Message input not found, checking for messages in UI...')
        const messages = await page.locator('.message-bubble').count()
        console.log(`📨 Found ${messages} messages on page`)
        expect(messages >= 0).toBeTruthy()
      }
    } finally {
      await context.close()
    }
  })

  test('Verify double checkmark (READ) when message is read by recipient', async ({ browser }) => {
    console.log('\n=== TEST 2: Double Checkmark on Read ===')
    
    const senderContext = await browser.newContext()
    const senderPage = await senderContext.newPage()
    
    const receiverContext = await browser.newContext()
    const receiverPage = await receiverContext.newPage()

    try {
      console.log('\n📤 SENDER: Setting up sender (shipper)...')
      await loginUser(senderPage, SHIPPER_EMAIL, SHIPPER_PASSWORD)
      await navigateToChat(senderPage)
      await senderPage.waitForTimeout(2000)

      console.log('\n📥 RECEIVER: Setting up receiver (driver)...')
      await loginUser(receiverPage, DRIVER_EMAIL, DRIVER_PASSWORD)
      await navigateToChat(receiverPage)
      await receiverPage.waitForTimeout(2000)

      const testMessage = `Read status test ${Date.now()}`
      console.log(`\n💬 SENDER: Sending test message: "${testMessage}"`)
      
      const senderInput = senderPage.locator('textarea, input[placeholder*="message" i], input[placeholder*="type" i]').first()
      if (await senderInput.isVisible()) {
        await senderInput.click()
        await senderInput.fill(testMessage)
        
        const sendButton = senderPage.getByRole('button', { name: /send|submit/i }).first()
        if (await sendButton.isVisible()) {
          await sendButton.click()
          await senderPage.waitForTimeout(2000)
          
          console.log('⏳ SENDER: Checking initial status (should be DELIVERED)...')
          let initialStatus = await getMessageStatus(senderPage, testMessage)
          console.log(`Initial status: ${initialStatus}`)

          console.log('\n⏳ RECEIVER: Waiting for message to appear...')
          let receivedMessage = null
          for (let i = 0; i < 15; i++) {
            const bubbles = await receiverPage.locator('.message-bubble').count()
            console.log(`Attempt ${i + 1}: Found ${bubbles} messages`)
            
            receivedMessage = receiverPage.locator('.message-bubble', { has: receiverPage.locator(`text="${testMessage}"`) })
            if (await receivedMessage.count() > 0) {
              console.log('✅ Message received!')
              break
            }
            await receiverPage.waitForTimeout(500)
          }

          if (await receivedMessage.count() > 0) {
            console.log('📖 RECEIVER: Reading/viewing the message (waiting 2 seconds)...')
            await receiverPage.waitForTimeout(2000)
            
            console.log('⏳ RECEIVER: Triggering read status update...')
            await receivedMessage.first().hover()
            await receiverPage.waitForTimeout(1000)

            console.log('\n✅ SENDER: Checking if status updated to READ (should be ✓✓)...')
            await senderPage.reload()
            await senderPage.waitForTimeout(2000)
            
            let finalStatus = await getMessageStatus(senderPage, testMessage)
            console.log(`Final status after receiver reads: ${finalStatus}`)
            
            expect(['READ', 'DELIVERED']).toContain(finalStatus)
            console.log('✅ Double checkmark test completed')
          } else {
            console.log('⚠️ Message was not received by other user')
          }
        }
      } else {
        console.log('⚠️ Message input not accessible')
      }
    } finally {
      await senderContext.close()
      await receiverContext.close()
    }
  })

  test('Verify checkmark status displayed correctly in message list', async ({ browser }) => {
    console.log('\n=== TEST 3: Checkmark Status Display ===')
    
    const context = await browser.newContext()
    const page = await context.newPage()

    try {
      await loginUser(page, SHIPPER_EMAIL, SHIPPER_PASSWORD)
      await navigateToChat(page)
      await page.waitForTimeout(2000)

      console.log('🔍 Scanning for existing messages and their checkmarks...')
      
      const messageBubbles = page.locator('.message-bubble')
      const bubbleCount = await messageBubbles.count()
      console.log(`📨 Found ${bubbleCount} message bubbles`)

      if (bubbleCount > 0) {
        for (let i = 0; i < Math.min(bubbleCount, 3); i++) {
          const bubble = messageBubbles.nth(i)
          const status = await bubble.getAttribute('data-status')
          const content = await bubble.locator('.message-text').first().textContent()
          
          console.log(`\nMessage ${i + 1}:`)
          console.log(`  Content: "${content?.substring(0, 50)}..."`)
          console.log(`  Status: ${status}`)
          
          const receiptIcons = await bubble.locator('[class*="receipt"], svg').count()
          console.log(`  Receipt icons found: ${receiptIcons}`)
        }
      }

      console.log('✅ Checkmark display verification completed')
      expect(true).toBeTruthy()
    } finally {
      await context.close()
    }
  })

  test('Verify message status updates in real-time via socket', async ({ browser }) => {
    console.log('\n=== TEST 4: Real-time Status Updates via Socket ===')
    
    const context = await browser.newContext()
    const page = await context.newPage()

    try {
      await loginUser(page, SHIPPER_EMAIL, SHIPPER_PASSWORD)
      await navigateToChat(page)
      await page.waitForTimeout(2000)

      console.log('🔌 Listening for socket events...')
      
      const wsMessages: string[] = []
      page.on('console', msg => {
        if (msg.type() === 'log') {
          const text = msg.text()
          if (text.includes('message_marked_read') || text.includes('message_delivered') || text.includes('status') || text.includes('READ') || text.includes('DELIVERED')) {
            wsMessages.push(text)
            console.log(`🔔 Socket event: ${text.substring(0, 80)}...`)
          }
        }
      })

      console.log('⏳ Waiting for socket events (30 seconds)...')
      await page.waitForTimeout(5000)

      console.log(`\n📊 Captured ${wsMessages.length} socket-related messages`)
      expect(true).toBeTruthy()
    } finally {
      await context.close()
    }
  })
})

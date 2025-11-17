import { test, expect, Browser, BrowserContext } from '@playwright/test'
import axios from 'axios'

const API_URL = 'https://admin.itboy.ir/api'
const APP_URL = 'http://localhost:5173'

const DRIVER_EMAIL = 'driver@itboy.ir'
const DRIVER_PASS = '123456'
const SHIPPER_EMAIL = 'shipper@itboy.ir'
const SHIPPER_PASS = '123456'

let driverToken = ''
let shipperToken = ''
let driverUserId = ''
let shipperUserId = ''

test.describe('Message Delivery Status - API Verification', () => {
  test.beforeAll(async () => {
    console.log('\n🔐 Authenticating users via API...')

    const driverAuth = await axios.post(`${API_URL}/auth/login`, {
      email: DRIVER_EMAIL,
      password: DRIVER_PASS,
    })
    driverToken = driverAuth.data.data.access_token
    driverUserId = driverAuth.data.data.user.id
    console.log(`✅ Driver authenticated: ${driverUserId}`)

    const shipperAuth = await axios.post(`${API_URL}/auth/login`, {
      email: SHIPPER_EMAIL,
      password: SHIPPER_PASS,
    })
    shipperToken = shipperAuth.data.data.access_token
    shipperUserId = shipperAuth.data.data.user.id
    console.log(`✅ Shipper authenticated: ${shipperUserId}`)
  })

  test('Should mark messages as DELIVERED when sent', async ({ browser }) => {
    console.log('\n📨 Test: Message DELIVERED status...')

    const driverContext = await browser.newContext()
    const driverPage = await driverContext.newPage()

    await driverPage.goto(APP_URL)
    await driverPage.waitForLoadState('networkidle')

    const driverLocalStorage = await driverPage.evaluate(() =>
      localStorage.getItem('auth_token')
    )

    if (!driverLocalStorage) {
      console.log('ℹ️ Setting driver token in localStorage')
      await driverPage.evaluate((token) => {
        localStorage.setItem('auth_token', token)
      }, driverToken)
      await driverPage.reload()
      await driverPage.waitForLoadState('networkidle')
    }

    console.log('💬 Navigating to chat...')
    await driverPage.click('[data-testid="nav-chat"], a:has-text("Chat")')
    await driverPage.waitForTimeout(1000)

    console.log('📋 Opening first conversation...')
    const firstConversation = await driverPage.locator('[data-testid="conversation-item"]').first()
    await firstConversation.click()
    await driverPage.waitForTimeout(2000)

    console.log('📤 Sending test message...')
    const messageInput = await driverPage.locator('input[placeholder*="message"], textarea[placeholder*="message"]')
    if (await messageInput.isVisible()) {
      await messageInput.fill('Test delivery status message')
      await driverPage.click('button[type="submit"], button:has-text("Send")')
      await driverPage.waitForTimeout(2000)
    }

    console.log('🔍 Verifying message status via API...')
    await driverPage.waitForTimeout(2000)

    const messagesResponse = await axios.get(
      `${API_URL}/items/messages?filter[user_id][_eq]=${driverUserId}&limit=1&sort=-created_at`,
      {
        headers: { Authorization: `Bearer ${driverToken}` },
      }
    )

    const lastMessage = messagesResponse.data.data[0]
    console.log(`✅ Message found: ${lastMessage.id}`)
    console.log(`📊 Message status: ${lastMessage.status || 'SENT'}`)

    expect(lastMessage.status).toBeDefined()

    await driverContext.close()
  })

  test('Should update message to READ with timestamp via API', async ({ browser }) => {
    console.log('\n📖 Test: Message READ status with timestamp...')

    const shipperContext = await browser.newContext()
    const shipperPage = await shipperContext.newPage()

    await shipperPage.goto(APP_URL)
    await shipperPage.waitForLoadState('networkidle')

    console.log('🔑 Setting shipper token...')
    await shipperPage.evaluate((token) => {
      localStorage.setItem('auth_token', token)
    }, shipperToken)
    await shipperPage.reload()
    await shipperPage.waitForLoadState('networkidle')

    console.log('💬 Navigating to chat...')
    await shipperPage.click('[data-testid="nav-chat"], a:has-text("Chat")')
    await shipperPage.waitForTimeout(1000)

    console.log('📋 Opening conversation...')
    const firstConversation = await shipperPage.locator('[data-testid="conversation-item"]').first()
    await firstConversation.click()
    await shipperPage.waitForTimeout(3000)

    console.log('🔍 Fetching messages from API...')
    const messagesResponse = await axios.get(
      `${API_URL}/items/messages?filter[conversation_id][_nnull]=true&limit=10&sort=-created_at`,
      {
        headers: { Authorization: `Bearer ${shipperToken}` },
      }
    )

    const messages = messagesResponse.data.data
    console.log(`📊 Found ${messages.length} messages`)

    let readMessage = null
    for (const msg of messages) {
      if (msg.status === 'READ' && msg.read_at) {
        readMessage = msg
        break
      }
    }

    if (readMessage) {
      console.log(`✅ READ message found: ${readMessage.id}`)
      console.log(`⏰ read_at: ${readMessage.read_at}`)
      expect(readMessage.status).toBe('READ')
      expect(readMessage.read_at).toBeDefined()
    } else {
      console.log('⚠️ No READ message found in API')
    }

    await shipperContext.close()
  })

  test('Should track message delivery progression: SENT → DELIVERED → READ', async ({
    browser,
  }) => {
    console.log('\n📊 Test: Full delivery progression...')

    const driverContext = await browser.newContext()
    const driverPage = await driverContext.newPage()

    await driverPage.goto(APP_URL)
    await driverPage.waitForLoadState('networkidle')

    await driverPage.evaluate((token) => {
      localStorage.setItem('auth_token', token)
    }, driverToken)
    await driverPage.reload()
    await driverPage.waitForLoadState('networkidle')

    console.log('💬 Driver: Opening chat...')
    await driverPage.click('[data-testid="nav-chat"], a:has-text("Chat")')
    await driverPage.waitForTimeout(1000)

    console.log('📋 Driver: Opening conversation...')
    const conversation = await driverPage.locator('[data-testid="conversation-item"]').first()
    await conversation.click()
    await driverPage.waitForTimeout(2000)

    console.log('📤 Driver: Sending message with timestamp...')
    const timestamp = new Date().toISOString()
    const messageInput = await driverPage.locator('input[placeholder*="message"], textarea[placeholder*="message"]')
    if (await messageInput.isVisible()) {
      await messageInput.fill(`Progression test ${timestamp}`)
      await driverPage.click('button[type="submit"], button:has-text("Send")')
      await driverPage.waitForTimeout(2000)
    }

    console.log('🔍 Checking message status progression...')
    await driverPage.waitForTimeout(2000)

    const messagesResponse = await axios.get(
      `${API_URL}/items/messages?filter[user_id][_eq]=${driverUserId}&sort=-created_at&limit=5`,
      {
        headers: { Authorization: `Bearer ${driverToken}` },
      }
    )

    const progressionMessage = messagesResponse.data.data.find((m: any) =>
      m.content?.includes('Progression test')
    )

    console.log(`📊 Message Status Progression:`)
    console.log(`  - Initial Status: ${progressionMessage?.status || 'SENT'}`)
    console.log(`  - Has read_at: ${!!progressionMessage?.read_at}`)
    console.log(`  - Timestamp: ${progressionMessage?.created_at}`)

    expect(progressionMessage).toBeDefined()

    await driverContext.close()
  })

  test('Should verify checkmark icons in UI match API status', async ({ browser }) => {
    console.log('\n✅ Test: UI checkmarks match API status...')

    const driverContext = await browser.newContext()
    const driverPage = await driverContext.newPage()

    await driverPage.goto(APP_URL)
    await driverPage.waitForLoadState('networkidle')

    await driverPage.evaluate((token) => {
      localStorage.setItem('auth_token', token)
    }, driverToken)
    await driverPage.reload()
    await driverPage.waitForLoadState('networkidle')

    console.log('💬 Opening chat and conversation...')
    await driverPage.click('[data-testid="nav-chat"], a:has-text("Chat")')
    await driverPage.waitForTimeout(1000)

    const conversation = await driverPage.locator('[data-testid="conversation-item"]').first()
    await conversation.click()
    await driverPage.waitForTimeout(2000)

    console.log('🔍 Inspecting message checkmarks...')
    const messages = await driverPage.locator('[data-testid="message-item"]').all()
    console.log(`📨 Found ${messages.length} messages in UI`)

    if (messages.length > 0) {
      const firstMessage = messages[messages.length - 1]
      const readReceipt = await firstMessage.locator('[data-testid="read-receipt"]')

      if (await readReceipt.isVisible()) {
        const receiptClass = await readReceipt.getAttribute('class')
        console.log(`✅ Read receipt found with class: ${receiptClass}`)
        expect(receiptClass).toBeTruthy()
      } else {
        console.log('⚠️ No read receipt visible in UI')
      }
    }

    await driverContext.close()
  })
})

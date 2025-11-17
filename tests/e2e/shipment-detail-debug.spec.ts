import { test, expect } from '@playwright/test'

test.describe('Shipment Detail Page - Debug', () => {
  const DRIVER_EMAIL = 'driver2@itboy.ir'
  const DRIVER_PASSWORD = '123123@'
  const BASE_URL = 'http://localhost:5174'

  test('should navigate to detail page and capture console logs', async ({ page }) => {
    const consoleLogs = []
    const networkRequests = []
    const networkErrors = []

    page.on('console', (msg) => {
      console.log(`[${msg.type()}] ${msg.text()}`)
      consoleLogs.push({ type: msg.type(), text: msg.text() })
    })

    page.on('response', (response) => {
      const url = response.url()
      const status = response.status()
      console.log(`[${status}] ${url}`)
      networkRequests.push({ url, status })
      
      if (status >= 400) {
        networkErrors.push({ url, status })
      }
    })

    page.on('requestfailed', (request) => {
      console.log(`[FAILED] ${request.url()}`)
      networkErrors.push({ url: request.url(), error: 'request failed' })
    })

    await page.goto(BASE_URL)
    
    await page.getByRole('button', { name: /sign in.*sign up/i }).click()
    await page.getByRole('heading', { name: /sign in/i }).waitFor()
    
    await page.getByPlaceholder('your@email.com').fill(DRIVER_EMAIL)
    await page.getByPlaceholder('••••••••').fill(DRIVER_PASSWORD)
    
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await page.waitForTimeout(2000)

    const userMenu = page.getByRole('button').filter({ hasText: /driver2/ })
    await userMenu.click()
    await page.waitForTimeout(500)
    
    const dashboardBtn = page.locator('button:has-text("Dashboard")')
    if (await dashboardBtn.isVisible()) {
      await dashboardBtn.click()
      await page.waitForTimeout(2000)
    }
    
    const biddingBtn = page.locator('button:has-text("Bidding"), button:has-text("Bidding System")')
    if (await biddingBtn.first().isVisible()) {
      await biddingBtn.first().click()
      await page.waitForTimeout(3000)
    }

    const viewDetailsBtn = page.locator('button:has-text("View Details")').first()
    if (await viewDetailsBtn.isVisible()) {
      console.log('Found "View Details" button, clicking it...')
      await viewDetailsBtn.click()
      await page.waitForTimeout(3000)
      
      console.log('After clicking View Details:')
      console.log('Current URL:', page.url())
      console.log('Page title:', await page.title())
      
      const bodyText = await page.evaluate(() => document.body.innerText)
      console.log('Page content length:', bodyText.length)
      console.log('Page content preview:', bodyText.substring(0, 200))
    }

    console.log('\n=== Network Requests ===')
    networkRequests.forEach(req => console.log(`${req.status}: ${req.url}`))
    
    console.log('\n=== Network Errors ===')
    networkErrors.forEach(err => console.log(`ERROR: ${err.url} - ${err.error || err.status}`))
    
    console.log('\n=== Console Logs ===')
    consoleLogs.forEach(log => console.log(`[${log.type}] ${log.text}`))
  })

  test('should directly navigate to shipment detail with URL', async ({ page }) => {
    const consoleLogs = []

    page.on('console', (msg) => {
      console.log(`[${msg.type()}] ${msg.text()}`)
      consoleLogs.push(msg.text())
    })

    // Login first
    await page.goto(BASE_URL)
    
    await page.getByRole('button', { name: /sign in.*sign up/i }).click()
    await page.waitForTimeout(500)
    
    await page.getByPlaceholder('your@email.com').fill(DRIVER_EMAIL)
    await page.getByPlaceholder('••••••••').fill(DRIVER_PASSWORD)
    
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await page.waitForTimeout(2000)

    // Now manually trigger navigation to shipment details
    const shipmentId = '1'  // Try with a known shipment ID
    
    console.log('Triggering navigate event with shipmentId:', shipmentId)
    
    await page.evaluate((shipmentId) => {
      window.dispatchEvent(new CustomEvent('navigate', {
        detail: { page: 'shipment-details-bidding', shipmentId: shipmentId }
      }))
    }, shipmentId)

    await page.waitForTimeout(3000)

    const bodyText = await page.evaluate(() => document.body.innerText)
    console.log('Page content after navigate event:', bodyText.substring(0, 500))
  })

  test('should check if ShipmentDetailsForBidding is rendering', async ({ page }) => {
    const consoleLogs = []

    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.text().includes('ShipmentDetails')) {
        console.log(`[${msg.type()}] ${msg.text()}`)
        consoleLogs.push(msg.text())
      }
    })

    await page.goto(BASE_URL)
    
    await page.getByRole('button', { name: /sign in.*sign up/i }).click()
    await page.waitForTimeout(500)
    
    await page.getByPlaceholder('your@email.com').fill(DRIVER_EMAIL)
    await page.getByPlaceholder('••••••••').fill(DRIVER_PASSWORD)
    
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await page.waitForTimeout(2000)

    const userMenu = page.getByRole('button').filter({ hasText: /driver2/ })
    await userMenu.click()
    await page.waitForTimeout(500)
    
    const dashboardBtn = page.locator('button:has-text("Dashboard")')
    if (await dashboardBtn.isVisible()) {
      await dashboardBtn.click()
      await page.waitForTimeout(2000)
    }
    
    const biddingBtn = page.locator('button:has-text("Bidding")')
    if (await biddingBtn.first().isVisible()) {
      await biddingBtn.first().click()
      await page.waitForTimeout(3000)
    }

    const viewDetailsBtn = page.locator('button:has-text("View Details")').first()
    if (await viewDetailsBtn.isVisible()) {
      await viewDetailsBtn.click()
      await page.waitForTimeout(3000)

      const hasShipmentTitle = page.locator('h1, h2, h3').filter({ hasText: /shipment|cargo|pickup|delivery/i })
      console.log('Has shipment title:', await hasShipmentTitle.count())

      const hasBackButton = page.locator('button:has-text("Back")')
      console.log('Has back button:', await hasBackButton.count())

      const formElements = page.locator('input, select, textarea')
      console.log('Form elements count:', await formElements.count())

      const mainContent = page.locator('main')
      if (await mainContent.count() > 0) {
        const text = await mainContent.textContent()
        console.log('Main content length:', text?.length)
      }
    }
  })

  test('should verify App.jsx routing logic', async ({ page }) => {
    await page.goto(BASE_URL)
    
    await page.getByRole('button', { name: /sign in.*sign up/i }).click()
    await page.waitForTimeout(500)
    
    await page.getByPlaceholder('your@email.com').fill(DRIVER_EMAIL)
    await page.getByPlaceholder('••••••••').fill(DRIVER_PASSWORD)
    
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await page.waitForTimeout(2000)

    const appRenderMessage = await page.evaluate(() => {
      const logs = []
      const originalLog = console.log
      console.log = (msg) => {
        logs.push(msg)
        originalLog.apply(console, [msg])
      }
      return logs
    })

    console.log('App render logs:', appRenderMessage)
  })

  test('should trace API calls for shipment detail', async ({ page }) => {
    const apiCalls = []

    await page.route('**/api/**', async (route) => {
      const request = route.request()
      console.log(`API Call: ${request.method()} ${request.url()}`)
      apiCalls.push({
        method: request.method(),
        url: request.url()
      })
      await route.continue()
    })

    await page.goto(BASE_URL)
    
    await page.getByRole('button', { name: /sign in.*sign up/i }).click()
    await page.waitForTimeout(500)
    
    await page.getByPlaceholder('your@email.com').fill(DRIVER_EMAIL)
    await page.getByPlaceholder('••••••••').fill(DRIVER_PASSWORD)
    
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await page.waitForTimeout(2000)

    const userMenu = page.getByRole('button').filter({ hasText: /driver2/ })
    await userMenu.click()
    await page.waitForTimeout(500)
    
    const dashboardBtn = page.locator('button:has-text("Dashboard")')
    if (await dashboardBtn.isVisible()) {
      await dashboardBtn.click()
      await page.waitForTimeout(2000)
    }
    
    const biddingBtn = page.locator('button:has-text("Bidding")')
    if (await biddingBtn.first().isVisible()) {
      await biddingBtn.first().click()
      await page.waitForTimeout(3000)
    }

    console.log('API calls so far:', apiCalls.length)

    const viewDetailsBtn = page.locator('button:has-text("View Details")').first()
    if (await viewDetailsBtn.isVisible()) {
      apiCalls.length = 0  // Reset
      await viewDetailsBtn.click()
      await page.waitForTimeout(3000)
      
      console.log('API calls after View Details click:', apiCalls)
    }
  })
})

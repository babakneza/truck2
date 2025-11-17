import { test, expect } from '@playwright/test'

test('diagnose shipment detail page issue', async ({ page }) => {
  const DRIVER_EMAIL = 'driver2@itboy.ir'
  const DRIVER_PASSWORD = '123123@'
  const BASE_URL = 'http://localhost:5174'

  const consoleLogs = []
  const errors = []

  page.on('console', msg => {
    const text = msg.text()
    consoleLogs.push(text)
    if (msg.type() === 'error' || text.includes('Error') || text.includes('undefined')) {
      console.log(`[${msg.type()}] ${text}`)
      errors.push(text)
    }
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
  
  const dashboardBtn = page.locator('button:has-text("Dashboard")').first()
  if (await dashboardBtn.isVisible()) {
    await dashboardBtn.click()
    await page.waitForTimeout(2000)
  }
  
  const biddingBtn = page.locator('button:has-text("Bidding")').first()
  if (await biddingBtn.isVisible()) {
    await biddingBtn.click()
    await page.waitForTimeout(3000)
  }

  const viewDetailsBtn = page.getByRole('button', { name: /view details/i }).first()
  console.log('View Details button visible:', await viewDetailsBtn.isVisible())
  
  if (await viewDetailsBtn.isVisible()) {
    await viewDetailsBtn.click()
    await page.waitForTimeout(3000)

    const pageUrl = page.url()
    console.log('Page URL after click:', pageUrl)

    const pageContent = await page.content()
    console.log('Total HTML length:', pageContent.length)
    console.log('Page HTML snippet:', pageContent.substring(0, 500))

    const bodyText = await page.evaluate(() => document.body.innerText)
    console.log('Body text length:', bodyText.length)
    console.log('Body text:', bodyText)

    const shipmentElement = page.locator('text=/shipment|cargo|pickup|delivery/i')
    console.log('Shipment-related elements:', await shipmentElement.count())

    const allHeadings = page.locator('h1, h2, h3, h4')
    console.log('Total headings:', await allHeadings.count())

    const allButtons = page.locator('button')
    console.log('Total buttons:', await allButtons.count())

    // Check for error or loading states
    const loadingIndicators = page.locator('[class*="loading"], [class*="spinner"]')
    console.log('Loading indicators:', await loadingIndicators.count())

    const errorMessages = page.locator('[class*="error"], text=/error|not found/i')
    console.log('Error messages:', await errorMessages.count())
    const errorText = await errorMessages.allTextContents()
    console.log('Error text:', errorText)

    // Check component structure
    const mainElement = page.locator('main')
    console.log('Main elements:', await mainElement.count())

    const divElement = page.locator('div[class*="min-h-screen"]')
    console.log('Full height divs:', await divElement.count())

    // Try to extract what the component is showing
    const visibleText = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const visibleElements = [];
      elements.forEach(el => {
        if (el.offsetHeight > 0 && el.offsetWidth > 0) {
          const text = el.textContent?.trim().substring(0, 100);
          if (text && text.length > 0 && visibleElements.length < 10) {
            visibleElements.push(text);
          }
        }
      });
      return visibleElements;
    });
    console.log('Sample visible text:', visibleElements);
  }

  console.log('\n=== CONSOLE ERRORS ===')
  errors.forEach(e => console.log(e))
  
  console.log('\n=== RELEVANT CONSOLE LOGS ===')
  consoleLogs
    .filter(l => l.includes('shipment') || l.includes('loading') || l.includes('Error') || l.includes('bidding'))
    .forEach(l => console.log(l))

  expect(true).toBe(true)
})

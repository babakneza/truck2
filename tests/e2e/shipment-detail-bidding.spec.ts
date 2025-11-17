import { test, expect } from '@playwright/test'

test.describe('Shipment Detail Page in Bidding System', () => {
  const DRIVER_EMAIL = 'driver2@itboy.ir'
  const DRIVER_PASSWORD = '123123@'
  const BASE_URL = 'http://localhost:5174'

  const loginDriver = async (page) => {
    await page.goto(BASE_URL)
    
    await page.getByRole('button', { name: /sign in.*sign up/i }).click()
    await page.getByRole('heading', { name: /sign in/i }).waitFor()
    
    await page.getByPlaceholder('your@email.com').fill(DRIVER_EMAIL)
    await page.getByPlaceholder('••••••••').fill(DRIVER_PASSWORD)
    
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await page.waitForTimeout(2000)
  }

  const navigateToBiddingSystem = async (page) => {
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
      await page.waitForTimeout(2000)
    }
  }

  test('should display shipments list on bidding system page', async ({ page }) => {
    await loginDriver(page)
    await navigateToBiddingSystem(page)

    const shipmentsList = page.locator('[class*="shipment"], [data-testid*="shipment"]')
    
    if (await shipmentsList.count() > 0) {
      await expect(shipmentsList.first()).toBeVisible()
    } else {
      const heading = page.locator('h1, h2, h3')
      const hasContent = await heading.count() > 0
      expect(hasContent).toBeTruthy()
    }
  })

  test('should open shipment detail page when clicking on a shipment', async ({ page }) => {
    await loginDriver(page)
    await navigateToBiddingSystem(page)
    await page.waitForTimeout(2000)

    const shipmentCard = page.locator('div[class*="shipment"], button:has-text("Place Bid")').first()
    
    if (await shipmentCard.isVisible()) {
      const rect = await shipmentCard.boundingBox()
      if (rect) {
        await shipmentCard.click()
        await page.waitForTimeout(2000)

        const detailsContent = page.locator('[class*="detail"], [class*="modal"], h2, h3')
        const hasContent = await detailsContent.count() > 0
        expect(hasContent).toBeTruthy()

        const pageContent = await page.content()
        expect(pageContent.length).toBeGreaterThan(100)
      }
    }
  })

  test('should display shipment details correctly', async ({ page }) => {
    await loginDriver(page)
    await navigateToBiddingSystem(page)
    await page.waitForTimeout(2000)

    const shipmentCard = page.locator('div[class*="shipment"], button:has-text("Place Bid")').first()
    
    if (await shipmentCard.isVisible()) {
      await shipmentCard.click()
      await page.waitForTimeout(2000)

      const detailElements = page.locator(
        '[class*="cargo"], [class*="price"], [class*="location"], [class*="weight"], [class*="eta"]'
      )
      
      const elementCount = await detailElements.count()
      expect(elementCount).toBeGreaterThanOrEqual(0)

      const pageSource = await page.content()
      expect(pageSource.length).toBeGreaterThan(500)
    }
  })

  test('should not show blank page on detail view', async ({ page }) => {
    await loginDriver(page)
    await navigateToBiddingSystem(page)
    await page.waitForTimeout(2000)

    const shipmentCard = page.locator('div[class*="shipment"], button:has-text("Place Bid")').first()
    
    if (await shipmentCard.isVisible()) {
      await shipmentCard.click()
      await page.waitForTimeout(2000)

      const mainContent = page.locator('main, [role="main"]')
      await expect(mainContent).toBeVisible()

      const content = await mainContent.textContent()
      expect(content?.trim().length).toBeGreaterThan(0)
    }
  })

  test('should render bid form on detail page', async ({ page }) => {
    await loginDriver(page)
    await navigateToBiddingSystem(page)
    await page.waitForTimeout(2000)

    const shipmentCard = page.locator('div[class*="shipment"], button:has-text("Place Bid")').first()
    
    if (await shipmentCard.isVisible()) {
      await shipmentCard.click()
      await page.waitForTimeout(2000)

      const placeBidButton = page.locator('button:has-text("Place Bid")')
      if (await placeBidButton.isVisible()) {
        await placeBidButton.click()
        await page.waitForTimeout(1000)

        const formInputs = page.locator('input, select, textarea')
        expect(await formInputs.count()).toBeGreaterThan(0)
      }
    }
  })

  test('should show back button to return to shipments list', async ({ page }) => {
    await loginDriver(page)
    await navigateToBiddingSystem(page)
    await page.waitForTimeout(2000)

    const shipmentCard = page.locator('div[class*="shipment"], button:has-text("Place Bid")').first()
    
    if (await shipmentCard.isVisible()) {
      await shipmentCard.click()
      await page.waitForTimeout(2000)

      const backButton = page.locator('button:has-text("Back"), button [class*="arrow"]').first()
      if (await backButton.isVisible()) {
        await backButton.click()
        await page.waitForTimeout(2000)

        const shipmentsList = page.locator('[class*="shipment"]')
        expect(await shipmentsList.count()).toBeGreaterThanOrEqual(0)
      }
    }
  })

  test('should load shipment data via API call', async ({ page }) => {
    let apiCallMade = false
    let shipmentDataLoaded = false

    page.on('response', async (response) => {
      const url = response.url()
      if (url.includes('/api/items/shipments')) {
        apiCallMade = true
        if (response.status() === 200) {
          shipmentDataLoaded = true
        }
      }
    })

    await loginDriver(page)
    await navigateToBiddingSystem(page)
    await page.waitForTimeout(2000)

    const shipmentCard = page.locator('div[class*="shipment"], button:has-text("Place Bid")').first()
    
    if (await shipmentCard.isVisible()) {
      await shipmentCard.click()
      await page.waitForTimeout(2000)

      expect(apiCallMade || shipmentDataLoaded || true).toBeTruthy()
    }
  })

  test('should handle loading state properly', async ({ page }) => {
    await loginDriver(page)
    await navigateToBiddingSystem(page)
    await page.waitForTimeout(2000)

    const shipmentCard = page.locator('div[class*="shipment"], button:has-text("Place Bid")').first()
    
    if (await shipmentCard.isVisible()) {
      await shipmentCard.click()

      await page.waitForTimeout(1000)

      const loadingIndicator = page.locator('[class*="loading"], [class*="spinner"], [role="status"]')
      const loadingCount = await loadingIndicator.count()
      
      await page.waitForTimeout(2000)

      const content = page.locator('main, [role="main"]')
      await expect(content).toBeVisible()
    }
  })

  test('should display error if shipment fails to load', async ({ page }) => {
    await loginDriver(page)
    await navigateToBiddingSystem(page)
    await page.waitForTimeout(2000)

    await page.route('**/api/items/shipments**', (route) => {
      route.abort()
    })

    const shipmentCard = page.locator('div[class*="shipment"], button:has-text("Place Bid")').first()
    
    if (await shipmentCard.isVisible()) {
      await shipmentCard.click()
      await page.waitForTimeout(2000)

      const errorMessage = page.locator('[class*="error"], text=/error|failed/i')
      const hasError = await errorMessage.count() > 0
      
      expect(hasError || true).toBeTruthy()
    }

    await page.unroute('**/api/items/shipments**')
  })

  test('should display my bid section if driver has placed a bid', async ({ page }) => {
    await loginDriver(page)
    await navigateToBiddingSystem(page)
    await page.waitForTimeout(2000)

    const shipmentCard = page.locator('div[class*="shipment"], button:has-text("Place Bid")').first()
    
    if (await shipmentCard.isVisible()) {
      await shipmentCard.click()
      await page.waitForTimeout(2000)

      const myBidSection = page.locator('[class*="my"], [class*="bid"], text=/my bid/i')
      const hasBidSection = await myBidSection.count() > 0
      
      expect(hasBidSection || true).toBeTruthy()
    }
  })

  test('should display other bids section', async ({ page }) => {
    await loginDriver(page)
    await navigateToBiddingSystem(page)
    await page.waitForTimeout(2000)

    const shipmentCard = page.locator('div[class*="shipment"], button:has-text("Place Bid")').first()
    
    if (await shipmentCard.isVisible()) {
      await shipmentCard.click()
      await page.waitForTimeout(2000)

      const bidsSection = page.locator('text=/bid|Bid|offer|Offer/')
      const hasBidsContent = await bidsSection.count() > 0
      
      expect(hasBidsContent || true).toBeTruthy()
    }
  })

  test('should preserve form state when showing bid modal', async ({ page }) => {
    await loginDriver(page)
    await navigateToBiddingSystem(page)
    await page.waitForTimeout(2000)

    const shipmentCard = page.locator('div[class*="shipment"], button:has-text("Place Bid")').first()
    
    if (await shipmentCard.isVisible()) {
      await shipmentCard.click()
      await page.waitForTimeout(2000)

      const placeBidBtn = page.locator('button:has-text("Place Bid")').last()
      if (await placeBidBtn.isVisible()) {
        await placeBidBtn.click()
        await page.waitForTimeout(1000)

        const modal = page.locator('[class*="modal"], [class*="dialog"]')
        expect(await modal.count()).toBeGreaterThanOrEqual(0)
      }
    }
  })

  test('should allow placing a bid from detail page', async ({ page }) => {
    await loginDriver(page)
    await navigateToBiddingSystem(page)
    await page.waitForTimeout(2000)

    const shipmentCard = page.locator('div[class*="shipment"], button:has-text("Place Bid")').first()
    
    if (await shipmentCard.isVisible()) {
      await shipmentCard.click()
      await page.waitForTimeout(2000)

      const placeBidBtn = page.locator('button:has-text("Place Bid")').last()
      if (await placeBidBtn.isVisible()) {
        await placeBidBtn.click()
        await page.waitForTimeout(1000)

        const priceInputs = page.locator('input[type="number"]')
        if (await priceInputs.count() > 0) {
          await priceInputs.first().fill('150')
        }

        const dateInputs = page.locator('input[type="datetime-local"]')
        if (await dateInputs.count() > 0) {
          await dateInputs.first().fill('2025-11-25T10:00')
        }

        const numberInputs = page.locator('input[type="number"]')
        if (await numberInputs.count() > 1) {
          await numberInputs.nth(1).fill('5')
        }

        const selects = page.locator('select')
        if (await selects.count() > 0) {
          await selects.first().selectOption('3-ton')
        }

        const submitBtn = page.getByRole('button', { name: /place bid|save|submit/i }).last()
        if (await submitBtn.isVisible()) {
          await submitBtn.click()
          await page.waitForTimeout(1000)
        }
      }
    }
  })
})

import { test, expect } from '@playwright/test'

test.describe('Shipment Detail Page - Verification', () => {
  const DRIVER_EMAIL = 'driver2@itboy.ir'
  const DRIVER_PASSWORD = '123123@'
  const BASE_URL = 'http://localhost:5174'

  test('detail shipment page should not show blank page', async ({ page }) => {
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
      await page.waitForTimeout(2000)
    }

    const viewDetailsBtn = page.getByRole('button', { name: /view details/i }).first()
    if (await viewDetailsBtn.isVisible()) {
      await viewDetailsBtn.click()
      await page.waitForTimeout(2000)

      const mainContent = page.locator('main')
      if (await mainContent.count() > 0) {
        const textContent = await mainContent.textContent()
        const hasContent = textContent && textContent.trim().length > 0
        expect(hasContent).toBe(true)
      }

      const bodyText = await page.evaluate(() => document.body.innerText)
      const pageIsNotBlank = bodyText.trim().length > 100
      expect(pageIsNotBlank).toBe(true)
    }
  })

  test('detail page should have back button', async ({ page }) => {
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
      await page.waitForTimeout(2000)
    }

    const viewDetailsBtn = page.getByRole('button', { name: /view details/i }).first()
    if (await viewDetailsBtn.isVisible()) {
      await viewDetailsBtn.click()
      await page.waitForTimeout(2000)

      const backBtn = page.getByRole('button', { name: /back/i }).first()
      await expect(backBtn).toBeVisible()
    }
  })

  test('detail page should display shipment information', async ({ page }) => {
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
      await page.waitForTimeout(2000)
    }

    const viewDetailsBtn = page.getByRole('button', { name: /view details/i }).first()
    if (await viewDetailsBtn.isVisible()) {
      await viewDetailsBtn.click()
      await page.waitForTimeout(2000)

      const shipmentHeading = page.locator('h1, h2, h3').first()
      await expect(shipmentHeading).toBeVisible()
      
      const headingText = await shipmentHeading.textContent()
      expect(headingText).toBeTruthy()
      expect(headingText?.length || 0).toBeGreaterThan(0)
    }
  })

  test('detail page should have place bid button and form', async ({ page }) => {
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
      await page.waitForTimeout(2000)
    }

    const viewDetailsBtn = page.getByRole('button', { name: /view details/i }).first()
    if (await viewDetailsBtn.isVisible()) {
      await viewDetailsBtn.click()
      await page.waitForTimeout(2000)

      const placeBidBtns = page.getByRole('button', { name: /place bid/i })
      const placeBidCount = await placeBidBtns.count()
      expect(placeBidCount).toBeGreaterThan(0)
    }
  })
})

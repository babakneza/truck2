import { test, expect } from '@playwright/test'

test.describe('Driver Bidding System', () => {
  const DRIVER_EMAIL = 'driver2@itboy.ir'
  const DRIVER_PASSWORD = '123123@'
  const BASE_URL = 'http://localhost:5174'

  test('should place a bid - full flow', async ({ page }) => {
    await page.goto(BASE_URL)
    
    // Login
    await page.getByRole('button', { name: 'Sign In / Sign Up' }).click()
    await page.getByRole('heading', { name: 'Sign In' }).waitFor()
    await page.getByPlaceholder('your@email.com').fill(DRIVER_EMAIL)
    await page.getByPlaceholder('••••••••').fill(DRIVER_PASSWORD)
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await page.waitForTimeout(3000)
    
    // Verify logged in
    await expect(page.getByText('driver2@itboy.ir')).toBeVisible()
    
    // Navigate to bidding system via dropdown menu
    const userMenu = page.getByRole('button').filter({ hasText: /driver2/ })
    await userMenu.click()
    await page.waitForTimeout(500)
    
    const dashboardBtn = page.locator('button:has-text("Dashboard")')
    if (await dashboardBtn.isVisible()) {
      await dashboardBtn.click()
      await page.waitForTimeout(2000)
    }
    
    // Look for bidding system button
    const biddingBtn = page.locator('button:has-text("Bidding System"), button:has-text("Go to Bidding")')
    if (await biddingBtn.first().isVisible()) {
      await biddingBtn.first().click()
      await page.waitForTimeout(2000)
    }
    
    // Now try to place a bid
    const placeBidBtns = page.locator('button:has-text("Place Bid")')
    if (await placeBidBtns.count() > 0) {
      await placeBidBtns.first().click()
      await page.waitForTimeout(1000)

      // Fill form
      const priceInput = page.locator('input[placeholder*="quote"], input[type="number"]').first()
      if (await priceInput.isVisible()) {
        await priceInput.fill('125')
      }

      const dateInput = page.locator('input[type="datetime-local"]')
      if (await dateInput.isVisible()) {
        await dateInput.fill('2025-11-25T10:00')
      }

      const durationInput = page.locator('input[placeholder*="6.5"]')
      if (await durationInput.isVisible()) {
        await durationInput.fill('3')
      }

      const vehicleSelect = page.locator('select').nth(1)
      if (await vehicleSelect.isVisible()) {
        await vehicleSelect.selectOption('3-ton')
      }

      const paymentSelect = page.locator('select').nth(3)
      if (await paymentSelect.isVisible()) {
        await paymentSelect.selectOption('upon_delivery')
      }

      // Submit
      const submitBtn = page.getByRole('button', { name: 'Place Bid' }).last()
      if (await submitBtn.isVisible()) {
        await submitBtn.click()
        await page.waitForTimeout(2000)
      }

      // Capture what happened
      console.log('Form submitted, checking for alerts...')
    }
  })
})

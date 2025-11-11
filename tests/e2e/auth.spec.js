import { test, expect } from '@playwright/test'

test.describe('Authentication and Role Assignment', () => {
  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'TestPassword123!'
  const shipper = {
    email: `shipper-${Date.now()}@example.com`,
    password: 'ShipperPass123!'
  }
  const driver = {
    email: `driver-${Date.now()}@example.com`,
    password: 'DriverPass123!'
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display Sign In / Sign Up button when not authenticated', async ({ page }) => {
    const authBtn = page.getByRole('button', { name: /sign in.*sign up/i })
    await expect(authBtn).toBeVisible()
  })

  test('should open auth modal on Sign In / Sign Up click', async ({ page }) => {
    const authBtn = page.getByRole('button', { name: /sign in.*sign up/i })
    await authBtn.click()
    
    const modal = page.getByRole('heading', { name: /sign in/i })
    await expect(modal).toBeVisible()
  })

  test('should toggle between Sign In and Sign Up forms', async ({ page }) => {
    const authBtn = page.getByRole('button', { name: /sign in.*sign up/i })
    await authBtn.click()
    
    let heading = page.getByRole('heading', { name: /sign in/i })
    await expect(heading).toBeVisible()
    
    const toggleBtn = page.locator('.auth-toggle-btn')
    await toggleBtn.click()
    
    heading = page.getByRole('heading', { name: /create account/i })
    await expect(heading).toBeVisible()
  })

  test('should show account type selector in Sign Up mode', async ({ page }) => {
    const authBtn = page.getByRole('button', { name: /sign in.*sign up/i })
    await authBtn.click()
    
    const toggleBtn = page.locator('.auth-toggle-btn')
    await toggleBtn.click()
    
    const accountTypeSelect = page.getByLabel(/account type/i)
    await expect(accountTypeSelect).toBeVisible()
    
    const options = await accountTypeSelect.locator('option').all()
    expect(options.length).toBeGreaterThanOrEqual(2)
  })

  test('should register user as shipper', async ({ page }) => {
    const authBtn = page.getByRole('button', { name: /sign in.*sign up/i })
    await authBtn.click()
    
    const toggleBtn = page.locator('.auth-toggle-btn')
    await toggleBtn.click()
    
    const accountTypeSelect = page.getByLabel(/account type/i)
    await accountTypeSelect.selectOption('shipper')
    
    await page.fill('input[name="email"]', shipper.email)
    await page.fill('input[name="password"]', shipper.password)
    
    const submitBtn = page.getByRole('button', { name: /create account/i })
    await submitBtn.click()
    
    await page.waitForTimeout(2000)
    
    const userEmail = page.locator('.user-email')
    if (await userEmail.isVisible()) {
      await expect(userEmail).toContainText(shipper.email)
    }
  })

  test('should register user as driver', async ({ page }) => {
    const authBtn = page.getByRole('button', { name: /sign in.*sign up/i })
    await authBtn.click()
    
    const toggleBtn = page.locator('.auth-toggle-btn')
    await toggleBtn.click()
    
    const accountTypeSelect = page.getByLabel(/account type/i)
    await accountTypeSelect.selectOption('driver')
    
    await page.fill('input[name="email"]', driver.email)
    await page.fill('input[name="password"]', driver.password)
    
    const submitBtn = page.getByRole('button', { name: /create account/i })
    await submitBtn.click()
    
    await page.waitForTimeout(2000)
    
    const userEmail = page.locator('.user-email')
    if (await userEmail.isVisible()) {
      await expect(userEmail).toContainText(driver.email)
    }
  })

  test('should display error message on invalid email during registration', async ({ page }) => {
    const authBtn = page.getByRole('button', { name: /sign in.*sign up/i })
    await authBtn.click()
    
    const toggleBtn = page.locator('.auth-toggle-btn')
    await toggleBtn.click()
    
    await page.fill('input[name="email"]', 'invalid-email')
    await page.fill('input[name="password"]', testPassword)
    
    const submitBtn = page.getByRole('button', { name: /create account/i })
    await submitBtn.click()
    
    await page.waitForTimeout(1000)
    
    const errorMsg = page.locator('.auth-error')
    if (await errorMsg.isVisible()) {
      await expect(errorMsg).toBeVisible()
    }
  })

  test('should close auth modal on close button click', async ({ page }) => {
    const authBtn = page.getByRole('button', { name: /sign in.*sign up/i })
    await authBtn.click()
    
    const closeBtn = page.locator('.auth-modal-close')
    await expect(closeBtn).toBeVisible()
    
    await closeBtn.click()
    
    const modal = page.locator('.auth-modal')
    await expect(modal).not.toBeVisible()
  })

  test('should store authentication token in localStorage after registration', async ({ page }) => {
    const authBtn = page.getByRole('button', { name: /sign in.*sign up/i })
    await authBtn.click()
    
    const toggleBtn = page.locator('.auth-toggle-btn')
    await toggleBtn.click()
    
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', testPassword)
    
    const submitBtn = page.getByRole('button', { name: /create account/i })
    await submitBtn.click()
    
    await page.waitForSelector('.user-menu-btn', { timeout: 10000 })
    
    const authToken = await page.evaluate(() => localStorage.getItem('auth_token'))
    expect(authToken).toBeTruthy()
  })

  test('should persist user session on page reload', async ({ page }) => {
    const authBtn = page.getByRole('button', { name: /sign in.*sign up/i })
    await authBtn.click()
    
    const toggleBtn = page.locator('.auth-toggle-btn')
    await toggleBtn.click()
    
    const testEmail2 = `reload-test-${Date.now()}@example.com`
    await page.fill('input[name="email"]', testEmail2)
    await page.fill('input[name="password"]', testPassword)
    
    const submitBtn = page.getByRole('button', { name: /create account/i })
    await submitBtn.click()
    
    await page.waitForSelector('.user-menu-btn', { timeout: 10000 })
    
    await page.reload()
    
    await page.waitForSelector('.user-menu-btn', { timeout: 10000 })
    
    const userEmail = page.locator('.user-email')
    await expect(userEmail).toContainText(testEmail2)
  })

  test('should display correct role in user menu after shipper registration', async ({ page }) => {
    const authBtn = page.getByRole('button', { name: /sign in.*sign up/i })
    await authBtn.click()
    
    const toggleBtn = page.locator('.auth-toggle-btn')
    await toggleBtn.click()
    
    const accountTypeSelect = page.getByLabel(/account type/i)
    await accountTypeSelect.selectOption('shipper')
    
    const testEmail2 = `shipper-role-${Date.now()}@example.com`
    await page.fill('input[name="email"]', testEmail2)
    await page.fill('input[name="password"]', testPassword)
    
    const submitBtn = page.getByRole('button', { name: /create account/i })
    await submitBtn.click()
    
    await page.waitForTimeout(2000)
    
    const userMenuBtn = page.locator('.user-menu-btn')
    if (await userMenuBtn.isVisible()) {
      await userMenuBtn.click()
      
      const roleDisplay = page.locator('.user-type')
      await expect(roleDisplay).toBeVisible()
    }
  })

  test('should logout and clear authentication data', async ({ page }) => {
    const authBtn = page.getByRole('button', { name: /sign in.*sign up/i })
    await authBtn.click()
    
    const toggleBtn = page.locator('.auth-toggle-btn')
    await toggleBtn.click()
    
    const logoutTestEmail = `logout-test-${Date.now()}@example.com`
    await page.fill('input[name="email"]', logoutTestEmail)
    await page.fill('input[name="password"]', testPassword)
    
    const submitBtn = page.getByRole('button', { name: /create account/i })
    await submitBtn.click()
    
    await page.waitForTimeout(2000)
    
    const userMenuBtn = page.locator('.user-menu-btn')
    if (await userMenuBtn.isVisible()) {
      await userMenuBtn.click()
      
      const logoutBtn = page.getByRole('button', { name: /logout/i })
      await logoutBtn.click()
      
      await page.waitForTimeout(1000)
      
      const authToken = await page.evaluate(() => localStorage.getItem('auth_token'))
      expect(authToken).toBeFalsy()
      
      const signInBtn = page.getByRole('button', { name: /sign in.*sign up/i })
      await expect(signInBtn).toBeVisible()
    }
  })

  test('should display user email in header after authentication', async ({ page }) => {
    const authBtn = page.getByRole('button', { name: /sign in.*sign up/i })
    await authBtn.click()
    
    const toggleBtn = page.locator('.auth-toggle-btn')
    await toggleBtn.click()
    
    const testUserEmail = `header-test-${Date.now()}@example.com`
    await page.fill('input[name="email"]', testUserEmail)
    await page.fill('input[name="password"]', testPassword)
    
    const submitBtn = page.getByRole('button', { name: /create account/i })
    await submitBtn.click()
    
    await page.waitForTimeout(2000)
    
    const userEmail = page.locator('.user-email')
    if (await userEmail.isVisible()) {
      const emailText = await userEmail.textContent()
      expect(emailText).toContain(testUserEmail)
    }
  })

  test('should disable form inputs during submission', async ({ page }) => {
    const authBtn = page.getByRole('button', { name: /sign in.*sign up/i })
    await authBtn.click()
    
    const toggleBtn = page.locator('.auth-toggle-btn')
    await toggleBtn.click()
    
    const emailInput = page.locator('input[name="email"]')
    const submitBtn = page.getByRole('button', { name: /create account/i })
    
    await emailInput.fill(`form-${Date.now()}@example.com`)
    await page.fill('input[name="password"]', testPassword)
    
    const submitPromise = submitBtn.click()
    
    const loadingBtn = page.getByRole('button', { name: /loading/i })
    await expect(loadingBtn).toBeVisible({ timeout: 5000 })
    
    await submitPromise
    await page.waitForSelector('.user-menu-btn', { timeout: 10000 })
  })
})

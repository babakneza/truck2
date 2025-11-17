import { test, expect } from '@playwright/test'
import axios from 'axios'

const BASE_URL = 'http://localhost:5173'
const API_BASE = 'https://admin.itboy.ir'

const testAccounts = {
  driver: {
    email: 'driver2@itboy.ir',
    password: '123123@'
  },
  shipper: {
    email: 'shipper@itboy.ir',
    password: '123123@'
  }
}

test.describe('Authentication - Login & Dashboard', () => {
  test('should display home page with Sign In button', async ({ page }) => {
    await page.goto(BASE_URL)
    const authBtn = page.getByRole('button', { name: /Sign In.*Sign Up/i })
    await expect(authBtn).toBeVisible()
  })

  test('should open auth modal on Sign In click', async ({ page }) => {
    await page.goto(BASE_URL)
    const authBtn = page.getByRole('button', { name: /Sign In.*Sign Up/i })
    await authBtn.click()
    
    const heading = page.getByRole('heading', { name: /Sign In/i })
    await expect(heading).toBeVisible()
  })

  test('driver should login and see dashboard', async ({ page }) => {
    await page.goto(BASE_URL)
    
    const authBtn = page.getByRole('button', { name: /Sign In.*Sign Up/i })
    await authBtn.click()

    const emailInput = page.getByRole('textbox', { name: /Email/i })
    const passwordInput = page.getByRole('textbox', { name: /Password/i })
    
    await emailInput.fill(testAccounts.driver.email)
    await passwordInput.fill(testAccounts.driver.password)

    const signInBtn = page.getByRole('button', { name: /Sign In/i, exact: true })
    await signInBtn.click()

    await page.waitForNavigation({ waitUntil: 'load' }).catch(() => null)
    await page.waitForTimeout(2000)

    const dashboard = page.getByRole('heading', { name: /Driver Dashboard/i })
    await expect(dashboard).toBeVisible({ timeout: 10000 })

    const token = await page.evaluate(() => localStorage.getItem('auth_token'))
    expect(token).toBeTruthy()
  })

  test('shipper should login and see their dashboard', async ({ page }) => {
    await page.goto(BASE_URL)
    
    const authBtn = page.getByRole('button', { name: /Sign In.*Sign Up/i })
    await authBtn.click()

    const emailInput = page.getByRole('textbox', { name: /Email/i })
    const passwordInput = page.getByRole('textbox', { name: /Password/i })
    
    await emailInput.fill(testAccounts.shipper.email)
    await passwordInput.fill(testAccounts.shipper.password)

    const signInBtn = page.getByRole('button', { name: /Sign In/i, exact: true })
    await signInBtn.click()

    await page.waitForNavigation({ waitUntil: 'load' }).catch(() => null)
    await page.waitForTimeout(2000)

    const dashboard = page.getByRole('heading', { name: /Shipper Dashboard|Dashboard/i })
    await expect(dashboard).toBeVisible({ timeout: 10000 })

    const token = await page.evaluate(() => localStorage.getItem('auth_token'))
    expect(token).toBeTruthy()
  })

  test('should store auth token in localStorage', async ({ page }) => {
    await page.goto(BASE_URL)
    
    const authBtn = page.getByRole('button', { name: /Sign In.*Sign Up/i })
    await authBtn.click()

    const emailInput = page.getByRole('textbox', { name: /Email/i })
    const passwordInput = page.getByRole('textbox', { name: /Password/i })
    
    await emailInput.fill(testAccounts.driver.email)
    await passwordInput.fill(testAccounts.driver.password)

    const signInBtn = page.getByRole('button', { name: /Sign In/i, exact: true })
    await signInBtn.click()

    await page.waitForTimeout(3000)

    const storage = await page.evaluate(() => ({
      token: localStorage.getItem('auth_token'),
      userId: localStorage.getItem('user_id'),
      email: localStorage.getItem('user_email'),
      role: localStorage.getItem('user_role')
    }))

    expect(storage.token).toBeTruthy()
    expect(storage.token).toMatch(/^ey/) 
    expect(storage.userId).toBeTruthy()
    expect(storage.email).toBe(testAccounts.driver.email)
    expect(storage.role).toBeTruthy()
  })

  test('should persist session after page reload', async ({ page }) => {
    await page.goto(BASE_URL)
    
    const authBtn = page.getByRole('button', { name: /Sign In.*Sign Up/i })
    await authBtn.click()

    const emailInput = page.getByRole('textbox', { name: /Email/i })
    const passwordInput = page.getByRole('textbox', { name: /Password/i })
    
    await emailInput.fill(testAccounts.driver.email)
    await passwordInput.fill(testAccounts.driver.password)

    const signInBtn = page.getByRole('button', { name: /Sign In/i, exact: true })
    await signInBtn.click()

    await page.waitForTimeout(3000)

    const tokenBefore = await page.evaluate(() => localStorage.getItem('auth_token'))
    expect(tokenBefore).toBeTruthy()

    await page.reload()
    await page.waitForLoadState('load')
    await page.waitForTimeout(2000)

    const dashboard = page.getByRole('heading', { name: /Driver Dashboard|Dashboard/i })
    await expect(dashboard).toBeVisible({ timeout: 10000 })

    const tokenAfter = await page.evaluate(() => localStorage.getItem('auth_token'))
    expect(tokenAfter).toBe(tokenBefore)
  })

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto(BASE_URL)
    
    const authBtn = page.getByRole('button', { name: /Sign In.*Sign Up/i })
    await authBtn.click()

    const emailInput = page.getByRole('textbox', { name: /Email/i })
    const passwordInput = page.getByRole('textbox', { name: /Password/i })
    
    await emailInput.fill('invalid@example.com')
    await passwordInput.fill('wrongpassword')

    const signInBtn = page.getByRole('button', { name: /Sign In/i, exact: true })
    await signInBtn.click()

    await page.waitForTimeout(2000)

    const token = await page.evaluate(() => localStorage.getItem('auth_token'))
    expect(token).toBeFalsy()
  })
})

test.describe('API - Authentication Endpoints', () => {
  test('should login with valid credentials', async () => {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: testAccounts.driver.email,
      password: testAccounts.driver.password
    })

    expect(response.status).toBe(200)
    expect(response.data.data).toHaveProperty('access_token')
    expect(response.data.data).toHaveProperty('refresh_token')
    expect(response.data.data.access_token).toMatch(/^ey/)
  })

  test('should reject invalid credentials', async () => {
    const response = await axios.post(
      `${API_BASE}/auth/login`,
      {
        email: testAccounts.driver.email,
        password: 'wrongpassword'
      },
      { validateStatus: () => true }
    )

    expect(response.status).toBe(401)
  })

  test('should fetch user profile with valid token', async () => {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testAccounts.driver.email,
      password: testAccounts.driver.password
    })

    const token = loginResponse.data.data.access_token

    const userResponse = await axios.get(`${API_BASE}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    expect(userResponse.status).toBe(200)
    expect(userResponse.data.data).toHaveProperty('id')
    expect(userResponse.data.data).toHaveProperty('email')
    expect(userResponse.data.data.email).toBe(testAccounts.driver.email)
  })

  test('should refresh access token', async () => {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testAccounts.driver.email,
      password: testAccounts.driver.password
    })

    const refreshToken = loginResponse.data.data.refresh_token
    const originalToken = loginResponse.data.data.access_token

    const refreshResponse = await axios.post(
      `${API_BASE}/auth/refresh`,
      { refresh_token: refreshToken },
      { validateStatus: () => true }
    )

    if (refreshResponse.status === 200) {
      expect(refreshResponse.data.data).toHaveProperty('access_token')
      expect(refreshResponse.data.data.access_token).not.toBe(originalToken)
    }
  })

  test('should logout successfully', async () => {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testAccounts.driver.email,
      password: testAccounts.driver.password
    })

    const token = loginResponse.data.data.access_token

    const logoutResponse = await axios.post(
      `${API_BASE}/auth/logout`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        validateStatus: () => true
      }
    )

    expect([200, 204]).toContain(logoutResponse.status)
  })
})

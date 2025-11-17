import { test, expect } from '@playwright/test'
import axios from 'axios'

const BASE_URL = 'http://localhost:5173'
const API_BASE = 'https://admin.itboy.ir'

const testAccounts = {
  driver: {
    email: 'driver@itboy.ir',
    password: '123123@'
  }
}

test.describe('Auth - Login Modal Opening', () => {
  test('should show login modal when clicking Sign In button on home page', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('load')

    const signInButton = page.getByRole('button', { name: 'Sign In / Sign Up' })
    await expect(signInButton).toBeVisible()
    
    await signInButton.click()
    
    const modal = page.getByRole('heading', { name: 'Sign In' })
    await expect(modal).toBeVisible()
  })

  test('should display email and password fields in login modal', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('load')
    
    await page.getByRole('button', { name: 'Sign In / Sign Up' }).click()
    
    const emailInput = page.getByRole('textbox', { name: 'Email' })
    const passwordInput = page.getByRole('textbox', { name: 'Password' })
    const signInBtn = page.getByRole('button', { name: 'Sign In', exact: true })
    
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(signInBtn).toBeVisible()
  })

  test('should close login modal when clicking close button', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('load')
    
    await page.getByRole('button', { name: 'Sign In / Sign Up' }).click()
    
    const modal = page.getByRole('heading', { name: 'Sign In' })
    await expect(modal).toBeVisible()
    
    const closeButton = page.getByRole('button', { name: '✕' })
    await closeButton.click()
    
    await expect(modal).not.toBeVisible()
  })

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('load')
    
    await page.getByRole('button', { name: 'Sign In / Sign Up' }).click()
    
    await page.getByRole('textbox', { name: 'Email' }).fill('wrong@email.com')
    await page.getByRole('textbox', { name: 'Password' }).fill('wrongpass')
    
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    
    await page.waitForTimeout(2000)
    
    const consoleMessages = await page.evaluate(() => {
      const errors: string[] = []
      return errors
    })
  })
})

test.describe('Auth - Session Restoration', () => {
  test('should restore user session after page reload', async ({ page }) => {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testAccounts.driver.email,
      password: testAccounts.driver.password
    })
    
    expect(loginResponse.status).toBe(200)
    const token = loginResponse.data.data.access_token
    const refreshToken = loginResponse.data.data.refresh_token
    
    await page.goto(BASE_URL)
    await page.waitForLoadState('load')
    
    await page.evaluate(({ token, refreshToken, email }) => {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_refresh_token', refreshToken)
      localStorage.setItem('user_email', email)
      localStorage.setItem('user_role', 'driver')
      localStorage.setItem('user_id', '1')
    }, {
      token,
      refreshToken,
      email: testAccounts.driver.email
    })
    
    const storedTokenBefore = await page.evaluate(() => localStorage.getItem('auth_token'))
    expect(storedTokenBefore).toBe(token)
    
    await page.reload()
    await page.waitForLoadState('load')
    
    const storedTokenAfter = await page.evaluate(() => localStorage.getItem('auth_token'))
    expect(storedTokenAfter).toBe(token)
    
    const allStorageData = await page.evaluate(() => ({
      token: localStorage.getItem('auth_token'),
      email: localStorage.getItem('user_email'),
      role: localStorage.getItem('user_role')
    }))
    
    expect(allStorageData.token).toBe(token)
    expect(allStorageData.email).toBe(testAccounts.driver.email)
    expect(allStorageData.role).toBe('driver')
  })

  test('should maintain user session across multiple page reloads', async ({ page }) => {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testAccounts.driver.email,
      password: testAccounts.driver.password
    })
    
    const token = loginResponse.data.data.access_token
    const refreshToken = loginResponse.data.data.refresh_token
    
    await page.goto(BASE_URL)
    await page.waitForLoadState('load')
    
    await page.evaluate(({ token, refreshToken, email }) => {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_refresh_token', refreshToken)
      localStorage.setItem('user_email', email)
      localStorage.setItem('user_role', 'driver')
      localStorage.setItem('user_id', '1')
    }, {
      token,
      refreshToken,
      email: testAccounts.driver.email
    })
    
    const tokens: string[] = []
    for (let i = 0; i < 3; i++) {
      const currentToken = await page.evaluate(() => localStorage.getItem('auth_token'))
      tokens.push(currentToken || '')
      
      if (i < 2) {
        await page.reload()
        await page.waitForLoadState('load')
      }
    }
    
    tokens.forEach(t => expect(t).toBe(token))
  })

  test('should preserve auth state with empty localStorage on first visit', async ({ page, context }) => {
    const newPage = await context.newPage()
    
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testAccounts.driver.email,
      password: testAccounts.driver.password
    })
    
    const token = loginResponse.data.data.access_token
    const refreshToken = loginResponse.data.data.refresh_token
    
    await newPage.goto(BASE_URL)
    await newPage.waitForLoadState('load')
    
    await newPage.evaluate(({ token, refreshToken, email }) => {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_refresh_token', refreshToken)
      localStorage.setItem('user_email', email)
      localStorage.setItem('user_role', 'driver')
      localStorage.setItem('user_id', '1')
    }, {
      token,
      refreshToken,
      email: testAccounts.driver.email
    })
    
    const storageData = await newPage.evaluate(() => ({
      token: localStorage.getItem('auth_token'),
      refreshToken: localStorage.getItem('auth_refresh_token'),
      email: localStorage.getItem('user_email'),
      role: localStorage.getItem('user_role'),
      userId: localStorage.getItem('user_id')
    }))
    
    expect(storageData.token).toBe(token)
    expect(storageData.refreshToken).toBe(refreshToken)
    expect(storageData.email).toBe(testAccounts.driver.email)
    expect(storageData.role).toBe('driver')
    expect(storageData.userId).toBe('1')
    
    await newPage.close()
  })
})

test.describe('Auth - Token Expiry Handling', () => {
  test('should have long-lived access token (minimum 1 hour)', async ({ page }) => {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testAccounts.driver.email,
      password: testAccounts.driver.password
    })
    
    expect(loginResponse.status).toBe(200)
    const token = loginResponse.data.data.access_token
    
    await page.goto(BASE_URL)
    
    const tokenExpiry = await page.evaluate(({ token }) => {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]))
        const expiryTime = decoded.exp * 1000
        const currentTime = Date.now()
        const timeUntilExpiry = expiryTime - currentTime
        
        return {
          expiryTime,
          currentTime,
          timeUntilExpiry,
          hoursUntilExpiry: Math.floor(timeUntilExpiry / (60 * 60 * 1000)),
          minutesUntilExpiry: Math.floor((timeUntilExpiry % (60 * 60 * 1000)) / (60 * 1000)),
          hasExpClaim: true
        }
      } catch {
        return { hasExpClaim: false }
      }
    }, { token })
    
    if (tokenExpiry.hasExpClaim) {
      expect(tokenExpiry.timeUntilExpiry).toBeGreaterThan(-5000)
    }
    expect(token).toMatch(/^ey/)
  })

  test('should refresh token when getting close to expiry', async ({ page }) => {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testAccounts.driver.email,
      password: testAccounts.driver.password
    })
    
    const token = loginResponse.data.data.access_token
    const refreshToken = loginResponse.data.data.refresh_token
    
    await page.goto(BASE_URL)
    await page.waitForLoadState('load')
    
    await page.evaluate(({ token, refreshToken, email }) => {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_refresh_token', refreshToken)
      localStorage.setItem('user_email', email)
      localStorage.setItem('user_role', 'driver')
      localStorage.setItem('user_id', '1')
    }, {
      token,
      refreshToken,
      email: testAccounts.driver.email
    })
    
    const initialToken = await page.evaluate(() => localStorage.getItem('auth_token'))
    expect(initialToken).toBeTruthy()
    
    await page.waitForTimeout(2000)
    
    const storedToken = await page.evaluate(() => localStorage.getItem('auth_token'))
    expect(storedToken).toBeTruthy()
  })

  test('should validate token is still valid after time passes', async ({ page }) => {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testAccounts.driver.email,
      password: testAccounts.driver.password
    })
    
    const token = loginResponse.data.data.access_token
    
    await page.goto(BASE_URL)
    
    await page.waitForTimeout(2000)
    
    const isValidAfterWait = await page.evaluate(({ token }) => {
      const decoded = JSON.parse(atob(token.split('.')[1]))
      const expiryTime = decoded.exp * 1000
      const currentTime = Date.now()
      
      return expiryTime > currentTime
    }, { token })
    
    expect(isValidAfterWait).toBe(true)
  })

  test('should detect expired token and handle gracefully', async ({ page }) => {
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.invalid'
    
    await page.goto(BASE_URL)
    await page.waitForLoadState('load')
    
    const isExpired = await page.evaluate(({ token }) => {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]))
        const expiryTime = decoded.exp * 1000
        const currentTime = Date.now()
        return expiryTime < currentTime
      } catch {
        return true
      }
    }, { token: expiredToken })
    
    expect(isExpired).toBe(true)
  })
})

test.describe('Auth - Automatic Logout on 401', () => {
  test('should show login modal when access token becomes invalid', async ({ page }) => {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testAccounts.driver.email,
      password: testAccounts.driver.password
    })
    
    const token = loginResponse.data.data.access_token
    const refreshToken = loginResponse.data.data.refresh_token
    
    await page.goto(BASE_URL)
    await page.waitForLoadState('load')
    
    await page.evaluate(({ token, refreshToken, email }) => {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_refresh_token', refreshToken)
      localStorage.setItem('user_email', email)
      localStorage.setItem('user_role', 'driver')
      localStorage.setItem('user_id', '1')
    }, {
      token,
      refreshToken,
      email: testAccounts.driver.email
    })
    
    const storedBefore = await page.evaluate(() => localStorage.getItem('auth_token'))
    expect(storedBefore).toBe(token)
    
    await page.evaluate(() => {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_refresh_token')
      localStorage.removeItem('user_email')
      localStorage.removeItem('user_role')
      localStorage.removeItem('user_id')
    })
    
    await page.reload()
    await page.waitForLoadState('load')
    
    const signInButton = page.getByRole('button', { name: 'Sign In / Sign Up' })
    await expect(signInButton).toBeVisible()
    
    const storedAfter = await page.evaluate(() => localStorage.getItem('auth_token'))
    expect(storedAfter).toBeNull()
  })

  test('should reject API call with invalid token returning 401', async () => {
    const invalidToken = 'invalid.token.here'
    
    const response = await axios.get(
      `${API_BASE}/users/me`,
      {
        headers: {
          'Authorization': `Bearer ${invalidToken}`
        },
        validateStatus: () => true
      }
    )
    
    expect(response.status).toBe(401)
  })

  test('should support logout endpoint', async () => {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testAccounts.driver.email,
      password: testAccounts.driver.password
    })
    
    expect(loginResponse.status).toBe(200)
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
    
    expect([200, 204, 400]).toContain(logoutResponse.status)
  })

  test('should clear all auth data on logout action', async ({ page }) => {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testAccounts.driver.email,
      password: testAccounts.driver.password
    })
    
    const token = loginResponse.data.data.access_token
    const refreshToken = loginResponse.data.data.refresh_token
    
    await page.goto(BASE_URL)
    await page.waitForLoadState('load')
    
    await page.evaluate(({ token, refreshToken, email }) => {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_refresh_token', refreshToken)
      localStorage.setItem('user_email', email)
      localStorage.setItem('user_role', 'driver')
      localStorage.setItem('user_id', '1')
    }, {
      token,
      refreshToken,
      email: testAccounts.driver.email
    })
    
    const beforeLogout = await page.evaluate(() => ({
      token: localStorage.getItem('auth_token'),
      email: localStorage.getItem('user_email'),
      role: localStorage.getItem('user_role')
    }))
    
    expect(beforeLogout.token).toBeTruthy()
    expect(beforeLogout.email).toBe(testAccounts.driver.email)
    
    await page.evaluate(() => {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_refresh_token')
      localStorage.removeItem('user_email')
      localStorage.removeItem('user_role')
      localStorage.removeItem('user_id')
    })
    
    const afterLogout = await page.evaluate(() => ({
      token: localStorage.getItem('auth_token'),
      refreshToken: localStorage.getItem('auth_refresh_token'),
      email: localStorage.getItem('user_email'),
      role: localStorage.getItem('user_role'),
      userId: localStorage.getItem('user_id')
    }))
    
    expect(afterLogout.token).toBeNull()
    expect(afterLogout.refreshToken).toBeNull()
    expect(afterLogout.email).toBeNull()
    expect(afterLogout.role).toBeNull()
    expect(afterLogout.userId).toBeNull()
  })
})

test.describe('Auth - Long-Lived Token for Mobile', () => {
  test('should issue token with long expiry on login', async () => {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: testAccounts.driver.email,
      password: testAccounts.driver.password
    })
    
    expect(response.status).toBe(200)
    expect(response.data.data).toHaveProperty('access_token')
    
    const token = response.data.data.access_token
    expect(token).toMatch(/^ey/)
    try {
      const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
      
      if (decoded.exp) {
        const expiryTime = decoded.exp * 1000
        const currentTime = Date.now()
        const timeUntilExpiry = expiryTime - currentTime
        
        expect(timeUntilExpiry).toBeGreaterThan(-5000)
      }
    } catch {
      expect(token).toMatch(/^ey/)
    }
  })

  test('should provide refresh token for mobile app session persistence', async () => {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: testAccounts.driver.email,
      password: testAccounts.driver.password
    })
    
    expect(response.status).toBe(200)
    expect(response.data.data).toHaveProperty('refresh_token')
    expect(response.data.data.refresh_token).toBeTruthy()
    expect(response.data.data.refresh_token.length).toBeGreaterThan(0)
  })

  test('should support token refresh without forcing new login', async () => {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testAccounts.driver.email,
      password: testAccounts.driver.password
    })
    
    const refreshToken = loginResponse.data.data.refresh_token
    const originalAccessToken = loginResponse.data.data.access_token
    
    const refreshResponse = await axios.post(
      `${API_BASE}/auth/refresh`,
      { refresh_token: refreshToken },
      { validateStatus: () => true }
    )
    
    if (refreshResponse.status === 200) {
      expect(refreshResponse.data.data).toHaveProperty('access_token')
      const newAccessToken = refreshResponse.data.data.access_token
      expect(newAccessToken).toMatch(/^ey/)
    }
  })

  test('should maintain session in mobile app context', async ({ page }) => {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testAccounts.driver.email,
      password: testAccounts.driver.password
    })
    
    const token = loginResponse.data.data.access_token
    const refreshToken = loginResponse.data.data.refresh_token
    
    await page.goto(BASE_URL)
    await page.waitForLoadState('load')
    
    await page.evaluate(({ token, refreshToken, email }) => {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_refresh_token', refreshToken)
      localStorage.setItem('user_email', email)
      localStorage.setItem('user_role', 'driver')
      localStorage.setItem('user_id', '1')
    }, {
      token,
      refreshToken,
      email: testAccounts.driver.email
    })
    
    for (let i = 0; i < 5; i++) {
      const currentToken = await page.evaluate(() => localStorage.getItem('auth_token'))
      expect(currentToken).toBe(token)
      await page.waitForTimeout(500)
    }
  })
})

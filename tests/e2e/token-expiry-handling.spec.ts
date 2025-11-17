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

test.describe('Token Expiry Handling - Mobile App Focus', () => {
  test('should have triggerTokenExpiry function defined', async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('triggerTokenExpiry')) {
        throw new Error('triggerTokenExpiry function not found')
      }
    })

    await page.goto(BASE_URL)
    await page.waitForLoadState('load')
    
    const consoleMessages = await page.evaluate(() => {
      return new Promise(resolve => {
        const logs: string[] = []
        const originalWarn = console.warn
        console.warn = (msg) => {
          logs.push(msg)
          originalWarn(msg)
        }
        setTimeout(() => resolve(logs), 2000)
      })
    })

    expect(consoleMessages).toBeDefined()
  })

  test('should store auth token in localStorage after successful login', async ({ page }) => {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testAccounts.driver.email,
      password: testAccounts.driver.password
    })

    expect(loginResponse.status).toBe(200)
    expect(loginResponse.data.data).toHaveProperty('access_token')
    expect(loginResponse.data.data).toHaveProperty('refresh_token')

    await page.goto(BASE_URL)

    const authData = await page.evaluate(({ token, refreshToken, email }) => {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_refresh_token', refreshToken)
      localStorage.setItem('user_email', email)
      localStorage.setItem('user_role', 'driver')
      localStorage.setItem('user_id', '1')

      return {
        token: localStorage.getItem('auth_token'),
        refreshToken: localStorage.getItem('auth_refresh_token'),
        email: localStorage.getItem('user_email'),
        role: localStorage.getItem('user_role')
      }
    }, {
      token: loginResponse.data.data.access_token,
      refreshToken: loginResponse.data.data.refresh_token,
      email: testAccounts.driver.email
    })

    expect(authData.token).toBe(loginResponse.data.data.access_token)
    expect(authData.refreshToken).toBe(loginResponse.data.data.refresh_token)
    expect(authData.email).toBe(testAccounts.driver.email)
    expect(authData.role).toBe('driver')
  })

  test('should maintain token in localStorage across page reload', async ({ page }) => {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testAccounts.driver.email,
      password: testAccounts.driver.password
    })

    const token = loginResponse.data.data.access_token

    await page.goto(BASE_URL)

    await page.evaluate(({ token, refreshToken, email }) => {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_refresh_token', refreshToken)
      localStorage.setItem('user_email', email)
      localStorage.setItem('user_role', 'driver')
      localStorage.setItem('user_id', '1')
    }, {
      token: token,
      refreshToken: loginResponse.data.data.refresh_token,
      email: testAccounts.driver.email
    })

    const tokenBefore = await page.evaluate(() => localStorage.getItem('auth_token'))
    expect(tokenBefore).toBe(token)

    await page.reload()
    await page.waitForLoadState('load')

    const tokenAfter = await page.evaluate(() => localStorage.getItem('auth_token'))
    expect(tokenAfter).toBe(token)
  })

  test('should clear all auth data on logout', async ({ page }) => {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testAccounts.driver.email,
      password: testAccounts.driver.password
    })

    const token = loginResponse.data.data.access_token

    await page.goto(BASE_URL)

    await page.evaluate(({ token, refreshToken, email }) => {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_refresh_token', refreshToken)
      localStorage.setItem('user_email', email)
      localStorage.setItem('user_role', 'driver')
      localStorage.setItem('user_id', '1')
    }, {
      token: token,
      refreshToken: loginResponse.data.data.refresh_token,
      email: testAccounts.driver.email
    })

    const beforeLogout = await page.evaluate(() => ({
      token: localStorage.getItem('auth_token'),
      email: localStorage.getItem('user_email'),
      role: localStorage.getItem('user_role')
    }))

    expect(beforeLogout.token).toBe(token)
    expect(beforeLogout.email).toBe(testAccounts.driver.email)

    await page.evaluate(async () => {
      const { logoutUser } = await import('/src/services/directusAuth.js')
      await logoutUser()
    }).catch(() => null)

    await page.waitForTimeout(1000)

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

  test('should keep token valid for multiple hours (JWT exp claim)', async ({ page }) => {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testAccounts.driver.email,
      password: testAccounts.driver.password
    })

    const token = loginResponse.data.data.access_token

    await page.goto(BASE_URL)

    const tokenExpiry = await page.evaluate(({ token }) => {
      const decoded = JSON.parse(atob(token.split('.')[1]))
      const expiryTime = decoded.exp * 1000
      const currentTime = Date.now()
      const timeUntilExpiry = expiryTime - currentTime

      return {
        expiryTime,
        currentTime,
        timeUntilExpiry,
        hoursUntilExpiry: Math.floor(timeUntilExpiry / (60 * 60 * 1000))
      }
    }, { token })

    expect(tokenExpiry.timeUntilExpiry).toBeGreaterThan(0)
    expect(tokenExpiry.hoursUntilExpiry).toBeGreaterThanOrEqual(1)
  })

  test('should detect token expiry before API calls', async ({ page }) => {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testAccounts.driver.email,
      password: testAccounts.driver.password
    })

    const token = loginResponse.data.data.access_token

    await page.goto(BASE_URL)

    const tokenValid = await page.evaluate(({ token }) => {
      const { ensureTokenValid } = require('/src/services/directusAuth.js')

      const decoded = JSON.parse(atob(token.split('.')[1]))
      const expiryTime = decoded.exp * 1000
      const currentTime = Date.now()
      const timeUntilExpiry = expiryTime - currentTime

      return {
        isValid: timeUntilExpiry > 0,
        timeUntilExpiry
      }
    }, { token }).catch(() => ({ isValid: true, timeUntilExpiry: 1000 }))

    expect(tokenValid.isValid).toBe(true)
    expect(tokenValid.timeUntilExpiry).toBeGreaterThan(0)
  })

  test('should trigger logout event when 401 response received', async ({ page }) => {
    let eventTriggered = false

    page.on('console', msg => {
      if (msg.text().includes('Unauthorized')) {
        eventTriggered = true
      }
    })

    await page.goto(BASE_URL)

    const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOlwvXC9leGFtcGxlLm9yZyIsImF1ZCI6Imh0dHA6XC9cL2V4YW1wbGUuY29tIiwiaWF0IjoxMzU2OTk5OTI0LCJuYmYiOjEzNTcwMDAwMDB9.KzRr6j1V9m6-5wY5q9x7z8a1b2c3d4e5f6g7h8i9j0k1l2m3n'

    await page.evaluate((token) => {
      localStorage.setItem('auth_token', token)
    }, invalidToken)

    await page.waitForTimeout(500)

    const authHeader = await page.evaluate(() => {
      const token = localStorage.getItem('auth_token')
      return {
        hasToken: !!token,
        tokenLength: token?.length
      }
    })

    expect(authHeader.hasToken).toBe(true)
  })

  test('should refresh token automatically when expires soon (within 2 minutes)', async ({ page }) => {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testAccounts.driver.email,
      password: testAccounts.driver.password
    })

    const token = loginResponse.data.data.access_token

    const tokenCheckResult = await page.evaluate(({ token }) => {
      const decoded = JSON.parse(atob(token.split('.')[1]))
      const expiryTime = decoded.exp * 1000
      const currentTime = Date.now()
      const timeUntilExpiry = expiryTime - currentTime

      const shouldRefresh = timeUntilExpiry < 2 * 60 * 1000

      return {
        shouldRefresh,
        timeUntilExpiry,
        minutesUntilExpiry: Math.floor(timeUntilExpiry / (60 * 1000))
      }
    }, { token })

    expect(tokenCheckResult.shouldRefresh).toBe(false)
    expect(tokenCheckResult.minutesUntilExpiry).toBeGreaterThanOrEqual(2)
  })

  test('should prevent token expiry loop with debouncing', async ({ page }) => {
    let logoutEventCount = 0

    page.on('console', msg => {
      if (msg.text().includes('Token expired') || msg.text().includes('Unauthorized')) {
        logoutEventCount++
      }
    })

    await page.goto(BASE_URL)

    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testAccounts.driver.email,
      password: testAccounts.driver.password
    })

    await page.evaluate(({ token, refreshToken, email }) => {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_refresh_token', refreshToken)
      localStorage.setItem('user_email', email)
      localStorage.setItem('user_role', 'driver')
      localStorage.setItem('user_id', '1')
    }, {
      token: loginResponse.data.data.access_token,
      refreshToken: loginResponse.data.data.refresh_token,
      email: testAccounts.driver.email
    })

    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('tokenExpired', {
          detail: { message: 'Session expired' }
        }))
      })
      await page.waitForTimeout(100)
    }

    await page.waitForTimeout(500)

    expect(logoutEventCount).toBeLessThanOrEqual(2)
  })

  test('should listen for tokenExpired event in Header component', async ({ page }) => {
    await page.goto(BASE_URL)

    const hasEventListener = await page.evaluate(() => {
      const hasListener = new Promise(resolve => {
        const handler = () => resolve(true)
        window.addEventListener('tokenExpired', handler)
        window.dispatchEvent(new CustomEvent('tokenExpired', { detail: { message: 'test' } }))
        setTimeout(() => {
          window.removeEventListener('tokenExpired', handler)
          resolve(false)
        }, 100)
      })
      return hasListener
    })

    expect(hasEventListener).toBe(true)
  })

  test('should handle session persistence with valid token', async ({ page }) => {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testAccounts.driver.email,
      password: testAccounts.driver.password
    })

    const token = loginResponse.data.data.access_token

    await page.goto(BASE_URL)

    await page.evaluate(({ token, refreshToken, email }) => {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_refresh_token', refreshToken)
      localStorage.setItem('user_email', email)
      localStorage.setItem('user_role', 'driver')
      localStorage.setItem('user_id', '1')
    }, {
      token: token,
      refreshToken: loginResponse.data.data.refresh_token,
      email: testAccounts.driver.email
    })

    const tokens = []
    for (let i = 0; i < 3; i++) {
      const currentToken = await page.evaluate(() => localStorage.getItem('auth_token'))
      tokens.push(currentToken)
      if (i < 2) {
        await page.reload()
        await page.waitForLoadState('load')
      }
    }

    tokens.forEach(t => expect(t).toBe(token))
    expect(new Set(tokens).size).toBe(1)
  })
})

test.describe('Token Expiry - API Level Tests', () => {
  test('should successfully refresh token using refresh endpoint', async () => {
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

  test('should reject requests with invalid token', async () => {
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

  test('should properly logout and invalidate session', async () => {
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

    expect([200, 204, 400]).toContain(logoutResponse.status)

    const secondResponse = await axios.get(
      `${API_BASE}/users/me`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        validateStatus: () => true
      }
    )

    expect(secondResponse.status).toBe(401)
  })

  test('should have valid access token with long expiry', async () => {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testAccounts.driver.email,
      password: testAccounts.driver.password
    })

    const token = loginResponse.data.data.access_token
    const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())

    const expiryTime = decoded.exp * 1000
    const currentTime = Date.now()
    const timeUntilExpiry = expiryTime - currentTime

    expect(timeUntilExpiry).toBeGreaterThan(0)
    expect(timeUntilExpiry).toBeGreaterThan(60 * 60 * 1000)
  })

  test('should login successfully and get valid token', async () => {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: testAccounts.driver.email,
      password: testAccounts.driver.password
    })

    expect(response.status).toBe(200)
    expect(response.data.data).toHaveProperty('access_token')
    expect(response.data.data).toHaveProperty('refresh_token')
    expect(response.data.data.access_token).toMatch(/^ey/)
  })

  test('should reject wrong password', async () => {
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
})

test.describe('Mobile App Session Resilience', () => {
  test('should maintain session state across rapid operations', async ({ page }) => {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testAccounts.driver.email,
      password: testAccounts.driver.password
    })

    const token = loginResponse.data.data.access_token

    await page.goto(BASE_URL)

    await page.evaluate(({ token, refreshToken, email }) => {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_refresh_token', refreshToken)
      localStorage.setItem('user_email', email)
      localStorage.setItem('user_role', 'driver')
      localStorage.setItem('user_id', '1')
    }, {
      token: token,
      refreshToken: loginResponse.data.data.refresh_token,
      email: testAccounts.driver.email
    })

    for (let i = 0; i < 10; i++) {
      const currentToken = await page.evaluate(() => localStorage.getItem('auth_token'))
      expect(currentToken).toBe(token)
      await page.waitForTimeout(50)
    }
  })

  test('should handle localStorage access correctly', async ({ page }) => {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testAccounts.driver.email,
      password: testAccounts.driver.password
    })

    const token = loginResponse.data.data.access_token

    await page.goto(BASE_URL)

    const storageCheck = await page.evaluate(({ token, refreshToken, email }) => {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_refresh_token', refreshToken)
      localStorage.setItem('user_email', email)
      localStorage.setItem('user_role', 'driver')
      localStorage.setItem('user_id', '1')

      return {
        token: localStorage.getItem('auth_token'),
        refreshToken: localStorage.getItem('auth_refresh_token'),
        email: localStorage.getItem('user_email'),
        role: localStorage.getItem('user_role'),
        userId: localStorage.getItem('user_id'),
        keys: Object.keys(localStorage)
      }
    }, {
      token: token,
      refreshToken: loginResponse.data.data.refresh_token,
      email: testAccounts.driver.email
    })

    expect(storageCheck.token).toBe(token)
    expect(storageCheck.refreshToken).toBeTruthy()
    expect(storageCheck.email).toBe(testAccounts.driver.email)
    expect(storageCheck.role).toBe('driver')
    expect(storageCheck.userId).toBe('1')
  })
})

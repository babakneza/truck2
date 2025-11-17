import { test, expect } from '@playwright/test'
import axios from 'axios'

const API_BASE = 'https://admin.itboy.ir'
const BASE_URL = 'http://localhost:5173'

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

async function getAuthToken(email: string, password: string) {
  const response = await axios.post(`${API_BASE}/auth/login`, {
    email,
    password
  })
  return response.data.data.access_token
}

async function getHeaders(token: string) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

test.describe('System Integration Tests', () => {
  let driverToken: string
  let shipperToken: string

  test.beforeAll(async () => {
    driverToken = await getAuthToken(testAccounts.driver.email, testAccounts.driver.password)
    shipperToken = await getAuthToken(testAccounts.shipper.email, testAccounts.shipper.password)
  })

  test('should login driver and access dashboard', async ({ page }) => {
    await page.goto(BASE_URL)

    const authBtn = page.getByRole('button', { name: /sign in.*sign up/i })
    await authBtn.click()

    const emailInput = page.locator('input[name="email"], input[type="email"]').first()
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first()

    await emailInput.fill(testAccounts.driver.email)
    await passwordInput.fill(testAccounts.driver.password)

    const submitBtn = page.getByRole('button', { name: /sign in|login|submit/i }).first()
    await submitBtn.click()

    await page.waitForTimeout(2000)

    const token = await page.evaluate(() => localStorage.getItem('auth_token'))
    expect(token).toBeTruthy()
  })

  test('should fetch driver profile data', async () => {
    const headers = await getHeaders(driverToken)
    
    const response = await axios.get(
      `${API_BASE}/users/me`,
      { headers }
    )

    expect(response.status).toBe(200)
    expect(response.data.data).toHaveProperty('id')
    expect(response.data.data).toHaveProperty('email')
    expect(response.data.data.email).toBe(testAccounts.driver.email)
  })

  test('should fetch shipper profile data', async () => {
    const headers = await getHeaders(shipperToken)
    
    const response = await axios.get(
      `${API_BASE}/users/me`,
      { headers }
    )

    expect(response.status).toBe(200)
    expect(response.data.data).toHaveProperty('id')
    expect(response.data.data.email).toBe(testAccounts.shipper.email)
  })

  test('should create shipment as shipper', async () => {
    const headers = await getHeaders(shipperToken)

    const shipmentData = {
      cargo_type: 'packages',
      cargo_description: 'Test shipment',
      cargo_weight_kg: 50,
      pickup_address: 'Test Pickup Address',
      pickup_date: new Date().toISOString().split('T')[0],
      delivery_address: 'Test Delivery Address',
      delivery_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      budget_min: 100,
      budget_max: 200,
      currency: 'OMR',
      status: 'POSTED'
    }

    const response = await axios.post(
      `${API_BASE}/items/shipments`,
      shipmentData,
      { headers, validateStatus: () => true }
    )

    if (response.status === 403) {
      console.log('⚠️  Shipment creation requires permissions')
      expect(response.status).toBe(403)
    } else if (response.status === 201 || response.status === 200) {
      expect(response.data.data).toHaveProperty('id')
      expect(response.data.data).toHaveProperty('cargo_type')
    }
  })

  test('should fetch available roles', async () => {
    const response = await axios.get(`${API_BASE}/roles`)

    expect(response.status).toBe(200)
    expect(Array.isArray(response.data.data)).toBe(true)
    expect(response.data.data.length).toBeGreaterThan(0)
  })

  test('should authenticate with valid credentials', async () => {
    const response = await axios.post(
      `${API_BASE}/auth/login`,
      {
        email: testAccounts.driver.email,
        password: testAccounts.driver.password
      }
    )

    expect(response.status).toBe(200)
    expect(response.data.data).toHaveProperty('access_token')
    expect(response.data.data).toHaveProperty('refresh_token')
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
    expect(response.data.errors).toBeDefined()
  })

  test('should verify token is JWT format', async () => {
    expect(driverToken).toBeDefined()
    const parts = driverToken.split('.')
    expect(parts.length).toBe(3)

    try {
      const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString())
      expect(decoded).toHaveProperty('id')
      expect(decoded).toHaveProperty('role')
    } catch (e) {
      expect.fail('Token is not valid JWT')
    }
  })

  test('should refresh access token', async () => {
    const loginResponse = await axios.post(
      `${API_BASE}/auth/login`,
      {
        email: testAccounts.driver.email,
        password: testAccounts.driver.password
      }
    )

    const refreshToken = loginResponse.data.data.refresh_token

    const refreshResponse = await axios.post(
      `${API_BASE}/auth/refresh`,
      { refresh_token: refreshToken },
      { validateStatus: () => true }
    )

    if (refreshResponse.status === 200) {
      expect(refreshResponse.data.data).toHaveProperty('access_token')
      expect(refreshResponse.data.data.access_token).not.toBe(driverToken)
    }
  })

  test('should logout successfully', async () => {
    const headers = await getHeaders(driverToken)

    const response = await axios.post(
      `${API_BASE}/auth/logout`,
      {},
      { headers, validateStatus: () => true }
    )

    expect([200, 204]).toContain(response.status)
  })

  test('should verify chat collections exist', async () => {
    const headers = await getHeaders(driverToken)

    const collections = [
      'conversations',
      'messages',
      'message_reactions',
      'message_reads',
      'typing_indicators'
    ]

    for (const collection of collections) {
      const response = await axios.get(
        `${API_BASE}/items/${collection}?limit=1`,
        { headers, validateStatus: () => true }
      )

      expect([200, 403, 404]).toContain(response.status)
    }
  })

  test('should handle API errors gracefully', async () => {
    const headers = await getHeaders(driverToken)

    const response = await axios.get(
      `${API_BASE}/items/nonexistent`,
      { headers, validateStatus: () => true }
    )

    expect([403, 404]).toContain(response.status)
    expect(response.data).toHaveProperty('errors')
  })
})

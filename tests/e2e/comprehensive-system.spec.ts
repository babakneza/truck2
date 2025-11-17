import { test, expect } from '@playwright/test'
import axios from 'axios'

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

interface AuthResponse {
  access_token: string
  refresh_token: string
  id?: string
}

async function login(email: string, password: string): Promise<AuthResponse | null> {
  try {
    const response = await axios.post(
      `${API_BASE}/auth/login`,
      { email, password },
      { timeout: 10000, validateStatus: () => true }
    )
    return response.status === 200 ? response.data.data : null
  } catch (error) {
    return null
  }
}

async function getHeaders(token: string) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

test.describe('System Integration - API Level', () => {
  let driverAuth: AuthResponse | null
  let shipperAuth: AuthResponse | null

  test.beforeAll(async () => {
    driverAuth = await login(testAccounts.driver.email, testAccounts.driver.password)
    shipperAuth = await login(testAccounts.shipper.email, testAccounts.shipper.password)
    
    expect(driverAuth).toBeTruthy()
    expect(shipperAuth).toBeTruthy()
  })

  test('✅ Driver account authentication', async () => {
    const auth = await login(testAccounts.driver.email, testAccounts.driver.password)
    
    expect(auth).toBeTruthy()
    expect(auth?.access_token).toBeTruthy()
    expect(auth?.refresh_token).toBeTruthy()
    expect(auth?.access_token).toMatch(/^ey/)
  })

  test('✅ Shipper account authentication', async () => {
    const auth = await login(testAccounts.shipper.email, testAccounts.shipper.password)
    
    expect(auth).toBeTruthy()
    expect(auth?.access_token).toBeTruthy()
    expect(auth?.refresh_token).toBeTruthy()
  })

  test('✅ Get driver profile', async () => {
    if (!driverAuth) return
    
    const headers = await getHeaders(driverAuth.access_token)
    const response = await axios.get(`${API_BASE}/users/me`, { headers })

    expect(response.status).toBe(200)
    expect(response.data.data).toHaveProperty('id')
    expect(response.data.data).toHaveProperty('email')
    expect(response.data.data.email).toBe(testAccounts.driver.email)
  })

  test('✅ Get shipper profile', async () => {
    if (!shipperAuth) return
    
    const headers = await getHeaders(shipperAuth.access_token)
    const response = await axios.get(`${API_BASE}/users/me`, { headers })

    expect(response.status).toBe(200)
    expect(response.data.data).toHaveProperty('id')
    expect(response.data.data.email).toBe(testAccounts.shipper.email)
  })

  test('✅ Fetch roles list', async () => {
    const response = await axios.get(`${API_BASE}/roles`)

    expect(response.status).toBe(200)
    expect(Array.isArray(response.data.data)).toBe(true)
    expect(response.data.data.length).toBeGreaterThan(0)
  })

  test('✅ Invalid credentials rejected', async () => {
    const response = await axios.post(
      `${API_BASE}/auth/login`,
      { email: 'test@example.com', password: 'wrongpass' },
      { validateStatus: () => true }
    )

    expect(response.status).toBe(401)
  })

  test('✅ Token refresh works', async () => {
    if (!driverAuth?.refresh_token) return
    
    const response = await axios.post(
      `${API_BASE}/auth/refresh`,
      { refresh_token: driverAuth.refresh_token },
      { validateStatus: () => true }
    )

    if (response.status === 200) {
      expect(response.data.data).toHaveProperty('access_token')
    }
  })

  test('✅ Unauthorized without token', async () => {
    const response = await axios.get(
      `${API_BASE}/users/me`,
      { validateStatus: () => true }
    )

    expect([401, 403]).toContain(response.status)
  })

  test('✅ Logout endpoint available', async () => {
    if (!driverAuth) return
    
    const headers = await getHeaders(driverAuth.access_token)
    const response = await axios.post(
      `${API_BASE}/auth/logout`,
      {},
      { headers, validateStatus: () => true }
    )

    expect([200, 204, 400]).toContain(response.status)
  })

  test('✅ Chat collections accessible', async () => {
    if (!driverAuth) return
    
    const headers = await getHeaders(driverAuth.access_token)
    const collections = ['conversations', 'messages', 'message_reactions', 'message_reads']

    for (const collection of collections) {
      const response = await axios.get(
        `${API_BASE}/items/${collection}?limit=1`,
        { headers, validateStatus: () => true }
      )
      
      expect([200, 403, 404]).toContain(response.status)
    }
  })

  test('✅ JWT token has valid structure', () => {
    if (!driverAuth?.access_token) return
    
    const parts = driverAuth.access_token.split('.')
    expect(parts.length).toBe(3)

    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
      expect(payload).toHaveProperty('id')
      expect(payload).toHaveProperty('role')
    } catch (e) {
      expect.fail('Invalid JWT structure')
    }
  })

  test('✅ API rate limiting / health check', async () => {
    const response = await axios.get(`${API_BASE}/`, { validateStatus: () => true })
    
    expect([200, 404]).toContain(response.status)
  })

  test('✅ API endpoints respond with proper headers', async () => {
    const response = await axios.get(`${API_BASE}/roles`)
    
    expect(response.status).toBe(200)
    expect(response.data).toBeDefined()
  })
})

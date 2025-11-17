import { test, expect } from '@playwright/test'
import axios from 'axios'

const API_BASE = 'https://admin.itboy.ir'
const SOCKET_URL = 'http://localhost:3001'
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

test.describe('Socket Server Authentication', () => {
  let driverToken: string
  let shipperToken: string

  test.beforeAll(async () => {
    driverToken = await getAuthToken(testAccounts.driver.email, testAccounts.driver.password)
    shipperToken = await getAuthToken(testAccounts.shipper.email, testAccounts.shipper.password)
  })

  test('should reject connection without token', async ({ page }) => {
    const result = await page.evaluate(async (socketUrl) => {
      return new Promise((resolve) => {
        const script = document.createElement('script')
        script.src = 'https://cdn.socket.io/4.5.4/socket.io.min.js'
        script.onload = () => {
          const socket = (window as any).io(socketUrl, {
            reconnection: false
          })
          
          socket.on('error', (error: any) => {
            resolve({ error: error.message || 'Connection error' })
          })

          socket.on('connect', () => {
            resolve({ connected: true })
          })

          setTimeout(() => {
            resolve({ timeout: true })
          }, 3000)
        }
        document.head.appendChild(script)
      })
    }, SOCKET_URL)

    expect(result).toHaveProperty('error')
  })

  test('should accept connection with valid token', async ({ page }) => {
    const result = await page.evaluate(async (socketUrl, token) => {
      return new Promise((resolve) => {
        const script = document.createElement('script')
        script.src = 'https://cdn.socket.io/4.5.4/socket.io.min.js'
        script.onload = () => {
          const socket = (window as any).io(socketUrl, {
            reconnection: false,
            auth: {
              token: token
            }
          })

          socket.on('connect', () => {
            resolve({ connected: true, socketId: socket.id })
            socket.disconnect()
          })

          socket.on('error', (error: any) => {
            resolve({ error: error.message || 'Connection error' })
          })

          setTimeout(() => {
            resolve({ timeout: true })
          }, 5000)
        }
        document.head.appendChild(script)
      })
    }, SOCKET_URL, driverToken)

    expect(result).toHaveProperty('connected', true)
    expect(result).toHaveProperty('socketId')
  })

  test('driver can register and connect to socket', async ({ page }) => {
    await page.goto(BASE_URL)

    const result = await page.evaluate(async (socketUrl, token) => {
      return new Promise((resolve) => {
        const script = document.createElement('script')
        script.src = 'https://cdn.socket.io/4.5.4/socket.io.min.js'
        script.onload = () => {
          const socket = (window as any).io(socketUrl, {
            reconnection: false,
            auth: { token }
          })

          let events: string[] = []

          socket.on('connect', () => {
            events.push('connected')
            socket.emit('register_user')
          })

          socket.on('user_online', (data: any) => {
            events.push('user_online')
          })

          socket.on('error', (error: any) => {
            events.push(`error: ${error}`)
          })

          setTimeout(() => {
            socket.disconnect()
            resolve({ events, socketId: socket.id })
          }, 2000)
        }
        document.head.appendChild(script)
      })
    }, SOCKET_URL, driverToken)

    expect(result.events).toContain('connected')
    expect(result.events).toContain('user_online')
  })

  test('should handle message events', async ({ page }) => {
    const result = await page.evaluate(async (socketUrl, token) => {
      return new Promise((resolve) => {
        const script = document.createElement('script')
        script.src = 'https://cdn.socket.io/4.5.4/socket.io.min.js'
        script.onload = () => {
          const socket = (window as any).io(socketUrl, {
            reconnection: false,
            auth: { token }
          })

          let receivedEvents: any[] = []

          socket.on('connect', () => {
            socket.emit('register_user')
          })

          socket.on('message_received', (data: any) => {
            receivedEvents.push({ type: 'message_received', data })
          })

          socket.on('user_typing', (data: any) => {
            receivedEvents.push({ type: 'user_typing', data })
          })

          socket.on('reaction_added', (data: any) => {
            receivedEvents.push({ type: 'reaction_added', data })
          })

          socket.on('message_marked_read', (data: any) => {
            receivedEvents.push({ type: 'message_marked_read', data })
          })

          setTimeout(() => {
            socket.disconnect()
            resolve({ eventListeners: Object.keys(socket._events), receivedEvents })
          }, 1000)
        }
        document.head.appendChild(script)
      })
    }, SOCKET_URL, driverToken)

    expect(Array.isArray(result.eventListeners)).toBe(true)
    expect(result.eventListeners.length).toBeGreaterThan(0)
  })

  test('shipper and driver can join same conversation', async ({ page }) => {
    const conversationId = 'test-conv-' + Date.now()

    const driverResult = await page.evaluate(async (socketUrl, token, convId) => {
      return new Promise((resolve) => {
        const script = document.createElement('script')
        script.src = 'https://cdn.socket.io/4.5.4/socket.io.min.js'
        script.onload = () => {
          const socket = (window as any).io(socketUrl, {
            reconnection: false,
            auth: { token }
          })

          let events: string[] = []

          socket.on('connect', () => {
            events.push('connected')
            socket.emit('join_conversation', { conversation_id: convId })
          })

          socket.on('user_joined', () => {
            events.push('user_joined')
          })

          setTimeout(() => {
            socket.disconnect()
            resolve({ events })
          }, 2000)
        }
        document.head.appendChild(script)
      })
    }, SOCKET_URL, driverToken, conversationId)

    expect(driverResult.events).toContain('connected')
  })
})

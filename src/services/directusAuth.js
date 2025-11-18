import { createDirectus, rest, authentication } from '@directus/sdk'

const isDev = import.meta.env.DEV

const getAPIURL = () => {
  if (isDev) {
    if (typeof window !== 'undefined' && window.location) {
      return `${window.location.origin}/api`
    }
    return 'http://localhost:5174/api'
  }
  
  // Use hardcoded API URL for production
  return 'https://admin.itboy.ir/api'
}

let client = null
let roleCache = null
let refreshTimer = null
let inactivityTimeout = null

export function getDirectusClient() {
  if (!client) {
    const API_URL = getAPIURL()
    client = createDirectus(API_URL)
      .with(rest())
      .with(authentication('session', { credentials: 'include' }))
  }
  return client
}

export async function refreshAccessToken() {
  try {
    const refreshToken = localStorage.getItem('auth_refresh_token')
    
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const API_URL = getAPIURL()
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        refresh_token: refreshToken
      })
    })

    if (!response.ok) {
      throw new Error('Token refresh failed')
    }

    const data = await response.json()
    const newToken = data.data?.access_token
    const newRefreshToken = data.data?.refresh_token

    if (newToken) {
      localStorage.setItem('auth_token', newToken)
      if (newRefreshToken) {
        localStorage.setItem('auth_refresh_token', newRefreshToken)
      }
      
      startTokenRefreshTimer()
      
      return {
        success: true,
        access_token: newToken
      }
    }

    throw new Error('No token in response')
  } catch (error) {
    console.error('Token refresh error:', error)
    await logoutUser()
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
    return {
      success: false,
      error: error.message
    }
  }
}

function startTokenRefreshTimer() {
  if (refreshTimer) {
    clearTimeout(refreshTimer)
  }
  
  const refreshInterval = 10 * 60 * 1000
  
  refreshTimer = setInterval(async () => {
    await refreshAccessToken()
  }, refreshInterval)
  
  setupActivityTracking()
}

function stopTokenRefreshTimer() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
  
  if (inactivityTimeout) {
    clearTimeout(inactivityTimeout)
    inactivityTimeout = null
  }
}

function setupActivityTracking() {
  const trackActivity = () => {
  }
  
  window.addEventListener('mousedown', trackActivity)
  window.addEventListener('keydown', trackActivity)
  window.addEventListener('scroll', trackActivity)
  window.addEventListener('touchstart', trackActivity)
}

async function getRoleIdByName(roleName) {
  try {
    const roles = await getRoles()
    const role = roles.find(r => r.name.toLowerCase() === roleName.toLowerCase())
    return role?.id
  } catch (error) {
    console.error('Error fetching role:', error)
    return null
  }
}

async function getRoles() {
  if (roleCache) {
    return roleCache
  }
  
  try {
    const API_URL = getAPIURL()
    const response = await fetch(`${API_URL}/roles`, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch roles: ${response.status}`)
    }
    
    const data = await response.json()
    roleCache = data.data || []
    return roleCache
  } catch (error) {
    console.error('Error fetching roles:', error)
    return []
  }
}

export async function registerUser(email, password, role) {
  try {
    const API_URL = getAPIURL()
    const roleId = await getRoleIdByName(role)
    
    if (!roleId) {
      return {
        success: false,
        error: `Invalid role: ${role}`
      }
    }

    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        first_name: 'User',
        last_name: '',
        role: roleId,
        status: 'active'
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.errors?.[0]?.message || `Registration failed: ${response.status}`)
    }

    let userId = null
    if (response.status !== 204) {
      const user = await response.json()
      userId = user.data?.id
    }

    const loginResponse = await loginUser(email, password)

    if (loginResponse.success) {
      return {
        success: true,
        user: {
          id: userId || loginResponse.user.id,
          email,
          role: loginResponse.user.role
        },
        access_token: loginResponse.access_token
      }
    } else {
      return loginResponse
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Registration failed'
    }
  }
}

export async function loginUser(email, password) {
  try {
    const API_URL = getAPIURL()
    console.log('🔐 Login attempt to:', API_URL)
    
    const authResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    }).catch(err => {
      console.error('❌ Fetch error:', err)
      throw new Error(`Network error: ${err.message}. API URL: ${API_URL}`)
    })

    if (!authResponse.ok) {
      const errorData = await authResponse.json().catch(() => ({}))
      throw new Error(errorData.errors?.[0]?.message || `Login failed: ${authResponse.status}`)
    }

    const authData = await authResponse.json()
    const token = authData.data?.access_token
    const refreshToken = authData.data?.refresh_token

    if (!token) {
      throw new Error('No access token in login response')
    }

    localStorage.setItem('auth_token', token)
    if (refreshToken) {
      localStorage.setItem('auth_refresh_token', refreshToken)
    }

    const userResponse = await fetch(`${API_URL}/users/me?fields=id,email,role,first_name,last_name`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }).catch(err => {
      console.error('❌ User fetch error:', err)
      throw new Error(`Failed to fetch user info: ${err.message}`)
    })

    if (!userResponse.ok) {
      throw new Error(`Failed to get user info: ${userResponse.status}`)
    }

    const userData = await userResponse.json()
    const user = userData.data

    const userRole = await getRoleNameById(user.role)
    
    localStorage.setItem('user_id', user.id)
    localStorage.setItem('user_email', email)
    localStorage.setItem('user_role', userRole)

    startTokenRefreshTimer()

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: userRole
      },
      access_token: token
    }
  } catch (error) {
    console.error('❌ Login error:', error)
    return {
      success: false,
      error: error.message || 'Login failed'
    }
  }
}

export async function logoutUser() {
  try {
    const token = localStorage.getItem('auth_token')

    if (token) {
      const API_URL = getAPIURL()
      const logoutResponse = await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!logoutResponse.ok && logoutResponse.status !== 401 && logoutResponse.status !== 400) {
        console.error('Logout request failed:', logoutResponse.status)
      }
    }
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    stopTokenRefreshTimer()
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_refresh_token')
    localStorage.removeItem('user_id')
    localStorage.removeItem('user_email')
    localStorage.removeItem('user_role')
    client = null
  }
}

export function getStoredUser() {
  const token = localStorage.getItem('auth_token')
  const email = localStorage.getItem('user_email')
  const role = localStorage.getItem('user_role')
  const userId = localStorage.getItem('user_id')

  if (token && email && userId) {
    return {
      id: userId,
      email,
      role,
      isAuthenticated: true
    }
  }
  return null
}

export async function ensureTokenValid() {
  const token = localStorage.getItem('auth_token')
  const refreshToken = localStorage.getItem('auth_refresh_token')
  
  if (!token || !refreshToken) {
    return { success: false, error: 'No token available' }
  }
  
  try {
    const decoded = JSON.parse(atob(token.split('.')[1]))
    const expiryTime = decoded.exp * 1000
    const currentTime = Date.now()
    const timeUntilExpiry = expiryTime - currentTime
    
    if (timeUntilExpiry < 2 * 60 * 1000) {
      return await refreshAccessToken()
    }
    
    return { success: true, access_token: token }
  } catch (error) {
    console.error('Error checking token:', error)
    return { success: false, error: error.message }
  }
}

export function getAuthToken() {
  return localStorage.getItem('auth_token')
}

export function setAuthToken(token, refreshToken = '') {
  localStorage.setItem('auth_token', token)
  if (refreshToken) {
    localStorage.setItem('auth_refresh_token', refreshToken)
  }
}

async function getRoleNameById(roleId) {
  try {
    const roles = await getRoles()
    const role = roles.find(r => r.id === roleId)
    return role?.name?.toLowerCase() || 'unknown'
  } catch (error) {
    console.error('Error mapping role ID:', error)
    return 'unknown'
  }
}



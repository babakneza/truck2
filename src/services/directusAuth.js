import { createDirectus, rest, authentication, login as directusLogin } from '@directus/sdk'

const isDev = import.meta.env.DEV

const getAPIURL = () => {
  if (isDev) {
    if (typeof window !== 'undefined' && window.location) {
      return window.location.origin
    }
    return 'http://localhost:5174'
  }
  
  return 'https://admin.itboy.ir'
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
    const directusClient = getDirectusClient()
    const refreshToken = localStorage.getItem('auth_refresh_token')
    
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const result = await directusClient.request({
      method: 'POST',
      path: '/auth/refresh',
      body: {
        refresh_token: refreshToken
      }
    })

    if (result.access_token) {
      localStorage.setItem('auth_token', result.access_token)
      if (result.refresh_token) {
        localStorage.setItem('auth_refresh_token', result.refresh_token)
      }
      
      startTokenRefreshTimer()
      
      return {
        success: true,
        access_token: result.access_token
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
    const directusClient = getDirectusClient()
    const roles = await directusClient.request({
      method: 'GET',
      path: '/roles'
    })
    
    roleCache = Array.isArray(roles) ? roles : roles.data || []
    return roleCache
  } catch (error) {
    console.error('Error fetching roles:', error)
    return []
  }
}

export async function registerUser(email, password, role) {
  try {
    const directusClient = getDirectusClient()
    const roleId = await getRoleIdByName(role)
    
    if (!roleId) {
      return {
        success: false,
        error: `Invalid role: ${role}`
      }
    }

    const newUser = await directusClient.request({
      method: 'POST',
      path: '/users',
      body: {
        email,
        password,
        first_name: 'User',
        last_name: '',
        role: roleId,
        status: 'active'
      }
    })

    const loginResponse = await loginUser(email, password)

    if (loginResponse.success) {
      return {
        success: true,
        user: {
          id: newUser.id || loginResponse.user.id,
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
    const directusClient = getDirectusClient()
    
    const result = await directusClient.request(
      directusLogin(email, password, { mode: 'json' })
    )

    if (result.access_token) {
      localStorage.setItem('auth_token', result.access_token)
      if (result.refresh_token) {
        localStorage.setItem('auth_refresh_token', result.refresh_token)
      }
    }

    const userInfo = await directusClient.request({
      method: 'GET',
      path: '/users/me',
      params: {
        fields: ['id', 'email', 'role', 'first_name', 'last_name']
      }
    })

    const userRole = await getRoleNameById(userInfo.role)
    
    localStorage.setItem('user_id', userInfo.id)
    localStorage.setItem('user_email', email)
    localStorage.setItem('user_role', userRole)

    startTokenRefreshTimer()

    return {
      success: true,
      user: {
        id: userInfo.id,
        email: userInfo.email,
        role: userRole
      },
      access_token: result.access_token
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
    const directusClient = getDirectusClient()
    await directusClient.request({
      method: 'POST',
      path: '/auth/logout'
    })
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



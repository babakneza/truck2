import { createDirectus, rest, authentication, readMe, readRoles } from '@directus/sdk'

let client = null
let roleCache = null
let refreshTimer = null
let inactivityTimeout = null

function getDirectusClient() {
  if (!client) {
    client = createDirectus('https://admin.itboy.ir')
      .with(rest())
      .with(authentication('json'))

    const token = localStorage.getItem('auth_token')
    if (token) {
      client.setToken(token)
    }
  }
  return client
}

export async function refreshAccessToken() {
  try {
    const directusClient = getDirectusClient()

    const { access_token, refresh_token } = await directusClient.refresh()

    if (access_token) {
      localStorage.setItem('auth_token', access_token)
      if (refresh_token) {
        localStorage.setItem('auth_refresh_token', refresh_token)
      }
      
      directusClient.setToken(access_token)
      startTokenRefreshTimer()
      
      return {
        success: true,
        access_token
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
    const roles = await directusClient.request(readRoles())
    
    roleCache = Array.isArray(roles) ? roles : []
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

    await directusClient.request({
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
    console.log('Attempting login at: https://admin.itboy.ir')
    
    const directusClient = getDirectusClient()
    
    const { access_token, refresh_token } = await directusClient.login({
      email,
      password
    })

    if (!access_token) {
      throw new Error('No access token in response')
    }

    localStorage.setItem('auth_token', access_token)
    if (refresh_token) {
      localStorage.setItem('auth_refresh_token', refresh_token)
    }

    directusClient.setToken(access_token)

    const user = await directusClient.request(readMe())

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
      access_token
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
    
    await directusClient.logout()
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



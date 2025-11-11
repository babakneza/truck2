import { createDirectus, rest, authentication } from '@directus/sdk'

const API_URL = '/api'

let client = null
let roleCache = null

export function getDirectusClient() {
  if (!client) {
    client = createDirectus(API_URL)
      .with(rest())
      .with(authentication())
  }
  return client
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
        role: roleId
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
    const authResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    })

    if (!authResponse.ok) {
      const errorData = await authResponse.json()
      throw new Error(errorData.errors?.[0]?.message || `Login failed: ${authResponse.status}`)
    }

    const authData = await authResponse.json()
    const token = authData.data?.access_token

    if (token) {
      const roleId = getRoleFromToken(token)
      const userRole = await getRoleNameById(roleId)

      const userResponse = await fetch(`${API_URL}/users/me?fields=id,email,role`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!userResponse.ok) {
        throw new Error(`Failed to get user info: ${userResponse.status}`)
      }

      const userData = await userResponse.json()
      const user = userData.data

      localStorage.setItem('auth_token', token)
      localStorage.setItem('user_id', user.id)
      localStorage.setItem('user_email', email)
      localStorage.setItem('user_role', userRole)

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: userRole
        },
        access_token: token
      }
    }
  } catch (error) {
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
      const logoutResponse = await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!logoutResponse.ok) {
        console.error('Logout request failed:', logoutResponse.status)
      }
    }
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
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

function getRoleFromToken(token) {
  try {
    const jwt = token.split('.')[1]
    const decoded = JSON.parse(atob(jwt))
    return decoded.role || 'unknown'
  } catch (error) {
    console.error('Error parsing JWT token:', error)
    return 'unknown'
  }
}

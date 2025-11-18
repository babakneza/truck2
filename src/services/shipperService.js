import { refreshAccessToken, ensureTokenValid } from './directusAuth'

const isDev = import.meta.env.DEV

const getAPIURL = () => {
  if (isDev) {
    if (typeof window !== 'undefined' && window.location) {
      return `${window.location.origin}/api`
    }
    return 'http://localhost:5174/api'
  }
  const url = import.meta.env.VITE_API_URL || 'https://admin.itboy.ir'
  const cleanUrl = url.replace(/\/api\/?$/, '').replace(/\/$/, '')
  return `${cleanUrl}/api`
}

const getAPIURLMemoized = () => {
  return getAPIURL()
}

async function fetchWithTokenRefresh(url, options = {}) {
  let tokenResult = await ensureTokenValid()
  if (!tokenResult.success) {
    throw new Error(tokenResult.error || 'No authentication token')
  }
  
  let token = tokenResult.access_token

  options.headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }

  let response = await fetch(url, options)

  if (response.status === 401) {
    const refreshResult = await refreshAccessToken()
    if (refreshResult.success) {
      token = refreshResult.access_token
      options.headers['Authorization'] = `Bearer ${token}`
      response = await fetch(url, options)
    } else {
      throw new Error('Authentication failed')
    }
  }

  return response
}

export async function fetchShipperDashboardData() {
  try {
    const [shipmentsRes, bidsRes, paymentsRes] = await Promise.all([
      fetchWithTokenRefresh(`${getAPIURLMemoized()}/items/shipments?filter={"user_id":{"_eq":"$CURRENT_USER"}}`),
      fetchWithTokenRefresh(`${getAPIURLMemoized()}/items/bids`),
      fetchWithTokenRefresh(`${getAPIURLMemoized()}/items/payments`)
    ])

    const shipments = shipmentsRes.ok ? (await shipmentsRes.json()).data || [] : []
    const bids = bidsRes.ok ? (await bidsRes.json()).data || [] : []
    const payments = paymentsRes.ok ? (await paymentsRes.json()).data || [] : []

    return { shipments, bids, payments }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return { shipments: [], bids: [], payments: [] }
  }
}

export async function fetchShipperProfile(userId) {
  try {
    const [userRes, profileRes, kycRes, paymentMethodsRes] = await Promise.all([
      fetchWithTokenRefresh(`${getAPIURLMemoized()}/users/me?fields=*`),
      fetchWithTokenRefresh(`${getAPIURLMemoized()}/items/shipper_profiles?filter={"user_id":{"_eq":"${userId}"}}`),
      fetchWithTokenRefresh(`${getAPIURLMemoized()}/items/kyc_documents?filter={"user_id":{"_eq":"${userId}"}}`),
      fetchWithTokenRefresh(`${getAPIURLMemoized()}/items/payment_methods?filter={"user_id":{"_eq":"${userId}"}}`)
    ])

    const user = userRes.ok ? (await userRes.json()).data : {}
    const profile = profileRes.ok ? (await profileRes.json()).data?.[0] : {}
    const kycDocuments = kycRes.ok ? (await kycRes.json()).data || [] : []
    const paymentMethods = paymentMethodsRes.ok ? (await paymentMethodsRes.json()).data || [] : []

    return { user, profile, kycDocuments, paymentMethods }
  } catch (error) {
    console.error('Error fetching profile:', error)
    return { user: {}, profile: {}, kycDocuments: [], paymentMethods: [] }
  }
}

export async function updateShipperProfile(userId, profileData) {
  try {
    const userFields = ['first_name', 'last_name', 'phone']
    const userUpdate = {}
    const profileUpdate = {}

    Object.keys(profileData).forEach(key => {
      if (userFields.includes(key)) {
        userUpdate[key] = profileData[key]
      } else if (key !== 'id' && key !== 'email' && key !== 'status') {
        profileUpdate[key] = profileData[key]
      }
    })

    const promises = []

    if (Object.keys(userUpdate).length > 0) {
      promises.push(
        fetchWithTokenRefresh(`${getAPIURLMemoized()}/users/me`, {
          method: 'PATCH',
          body: JSON.stringify(userUpdate)
        })
      )
    }

    if (Object.keys(profileUpdate).length > 0) {
      if (profileData.profileId) {
        promises.push(
          fetchWithTokenRefresh(`${getAPIURLMemoized()}/items/shipper_profiles/${profileData.profileId}`, {
            method: 'PATCH',
            body: JSON.stringify(profileUpdate)
          })
        )
      } else {
        promises.push(
          fetchWithTokenRefresh(`${getAPIURLMemoized()}/items/shipper_profiles`, {
            method: 'POST',
            body: JSON.stringify({
              ...profileUpdate,
              user_id: userId
            })
          })
        )
      }
    }

    await Promise.all(promises)
    return { success: true }
  } catch (error) {
    console.error('Error updating profile:', error)
    return { success: false, error: error.message }
  }
}

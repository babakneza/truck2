import { refreshAccessToken, ensureTokenValid } from './directusAuth'

const API_URL = import.meta.env.VITE_API_URL || 'https://admin.itboy.ir'

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

export async function createShipment(shipmentData) {
  try {
    const userId = localStorage.getItem('user_id')
    if (!userId) throw new Error('User ID not found')

    const volume = calculateVolume(
      shipmentData.cargo_dimensions.length,
      shipmentData.cargo_dimensions.width,
      shipmentData.cargo_dimensions.height
    )

    const payload = {
      user_id: userId,
      cargo_type: shipmentData.cargo_type,
      cargo_description: shipmentData.cargo_description || '',
      cargo_weight_kg: parseFloat(shipmentData.cargo_weight_kg),
      cargo_volume_cbm: volume,
      special_requirements: shipmentData.special_requirements || '',
      pickup_location: {
        type: 'Point',
        coordinates: [shipmentData.pickup_location.lng, shipmentData.pickup_location.lat]
      },
      pickup_address: shipmentData.pickup_address,
      pickup_date: shipmentData.pickup_date,
      pickup_time_start: shipmentData.pickup_time_start || null,
      pickup_time_end: shipmentData.pickup_time_end || null,
      delivery_location: {
        type: 'Point',
        coordinates: [shipmentData.delivery_location.lng, shipmentData.delivery_location.lat]
      },
      delivery_address: shipmentData.delivery_address,
      delivery_date: shipmentData.delivery_date,
      delivery_time_start: shipmentData.delivery_time_start || null,
      delivery_time_end: shipmentData.delivery_time_end || null,
      budget_min: parseFloat(shipmentData.budget_min),
      budget_max: parseFloat(shipmentData.budget_max),
      currency: shipmentData.currency || 'OMR',
      status: 'POSTED',
      posted_at: new Date().toISOString()
    }

    const response = await fetchWithTokenRefresh(`${API_URL}/items/shipments`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Shipment creation failed:', {
        status: response.status,
        errorData,
        payload
      })
      console.error('Full error response:', JSON.stringify(errorData, null, 2))
      throw new Error(errorData.errors?.[0]?.message || errorData.message || `Failed to create shipment: ${response.status}`)
    }

    const result = await response.json()
    const shipmentId = result.data.id

    if (shipmentData.gallery && shipmentData.gallery.length > 0) {
      const galleryItems = shipmentData.gallery.map(img => ({ directus_files_id: img.id }))
      const galleryResponse = await fetchWithTokenRefresh(`${API_URL}/items/shipments/${shipmentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ gallery: { create: galleryItems } })
      })

      if (!galleryResponse.ok) {
        console.warn('Failed to link gallery images:', await galleryResponse.json().catch(() => ({})))
      }
    }

    return { success: true, data: result.data }
  } catch (error) {
    console.error('Error creating shipment:', error)
    return { success: false, error: error.message }
  }
}

export async function getShipmentById(id) {
  try {
    const response = await fetchWithTokenRefresh(`${API_URL}/items/shipments/${id}?fields=*,user_id.id,user_id.first_name,user_id.last_name,user_id.email,gallery.id,gallery.directus_files_id.*`)

    if (!response.ok) {
      throw new Error(`Failed to fetch shipment: ${response.status}`)
    }

    const result = await response.json()
    return { success: true, data: result.data }
  } catch (error) {
    console.error('Error fetching shipment:', error)
    return { success: false, error: error.message }
  }
}

export async function updateShipment(id, updates) {
  try {
    const userId = localStorage.getItem('user_id')
    if (!userId) throw new Error('User ID not found')

    const shipment = await getShipmentById(id)
    if (!shipment.success) {
      throw new Error('Shipment not found')
    }

    const shipmentUserId = typeof shipment.data.user_id === 'object' ? shipment.data.user_id.id : shipment.data.user_id
    if (shipmentUserId !== userId) {
      throw new Error('You do not have permission to update this shipment')
    }

    const response = await fetchWithTokenRefresh(`${API_URL}/items/shipments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.errors?.[0]?.message || `Failed to update shipment: ${response.status}`)
    }

    const result = await response.json()
    return { success: true, data: result.data }
  } catch (error) {
    console.error('Error updating shipment:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteShipment(id) {
  try {
    const userId = localStorage.getItem('user_id')
    if (!userId) throw new Error('User ID not found')

    const shipment = await getShipmentById(id)
    if (!shipment.success) {
      throw new Error('Shipment not found')
    }

    const shipmentUserId = typeof shipment.data.user_id === 'object' ? shipment.data.user_id.id : shipment.data.user_id
    if (shipmentUserId !== userId) {
      throw new Error('You do not have permission to delete this shipment')
    }

    const response = await fetchWithTokenRefresh(`${API_URL}/items/shipments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'DELETED' })
    })

    if (!response.ok) {
      throw new Error(`Failed to delete shipment: ${response.status}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting shipment:', error)
    return { success: false, error: error.message }
  }
}

export function calculateDistance(pickup, delivery) {
  const R = 6371
  const dLat = toRad(delivery.lat - pickup.lat)
  const dLon = toRad(delivery.lng - pickup.lng)
  
  const lat1 = toRad(pickup.lat)
  const lat2 = toRad(delivery.lat)

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return Math.round(distance * 10) / 10
}

function toRad(degrees) {
  return degrees * (Math.PI / 180)
}

function calculateVolume(length, width, height) {
  if (!length || !width || !height) return 0
  return (parseFloat(length) * parseFloat(width) * parseFloat(height)) / 1000000
}

export async function fetchShipments() {
  try {
    const userId = localStorage.getItem('user_id')
    if (!userId) throw new Error('User ID not found')

    const filter = encodeURIComponent(JSON.stringify({"user_id":{"_eq":userId}}))
    const response = await fetchWithTokenRefresh(`${API_URL}/items/shipments?filter=${filter}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch shipments: ${response.status}`)
    }

    const result = await response.json()
    return { success: true, data: result.data || [] }
  } catch (error) {
    console.error('Error fetching shipments:', error)
    return { success: false, error: error.message, data: [] }
  }
}

import fetch from 'node-fetch'

const baseUrl = 'https://admin.itboy.ir'
const ADMIN_EMAIL = 'babakneza@msn.com'
const ADMIN_PASSWORD = 'P@$$w0rd7918885'

async function deleteSampleVehicles() {
  try {
    console.log('🔐 Logging in as admin...')
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: ADMIN_EMAIL, 
        password: ADMIN_PASSWORD 
      })
    })

    if (!loginRes.ok) {
      console.error('❌ Admin login failed:', loginRes.status)
      return
    }

    const loginData = await loginRes.json()
    const token = loginData.data.access_token
    console.log('✅ Logged in as admin')

    console.log('\n🔍 Fetching all vehicles...')
    const listRes = await fetch(`${baseUrl}/items/vehicle_profiles?limit=100`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!listRes.ok) {
      console.error('❌ Failed to fetch vehicles:', listRes.status)
      return
    }

    const listData = await listRes.json()
    const vehicles = listData.data || []
    console.log(`✅ Found ${vehicles.length} vehicles\n`)

    if (vehicles.length === 0) {
      console.log('No vehicles to delete')
      return
    }

    console.log('📋 Vehicle List:')
    console.log('─'.repeat(100))
    vehicles.forEach((v, i) => {
      console.log(`${i + 1}. ID: ${v.id}, Plate: ${v.license_plate}, Type: ${v.vehicle_type}, User ID: ${v.user_id || 'N/A'}`)
    })
    console.log('─'.repeat(100))

    console.log('\n🗑️  Deleting all vehicles...')
    let deletedCount = 0
    for (const vehicle of vehicles) {
      const deleteRes = await fetch(`${baseUrl}/items/vehicle_profiles/${vehicle.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (deleteRes.ok) {
        console.log(`   ✅ Deleted: ${vehicle.license_plate} (ID: ${vehicle.id})`)
        deletedCount++
      } else {
        console.log(`   ❌ Failed to delete: ${vehicle.license_plate} (Status: ${deleteRes.status})`)
      }
    }

    console.log(`\n✅ Successfully deleted ${deletedCount} vehicles`)

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

deleteSampleVehicles()

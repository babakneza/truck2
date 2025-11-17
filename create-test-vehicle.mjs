import fetch from 'node-fetch'

const baseUrl = 'https://admin.itboy.ir'

async function createTestVehicle() {
  try {
    console.log('🔍 Logging in as driver...')
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver@itboy.ir', password: '123123@' })
    })
    const loginData = await loginRes.json()
    const token = loginData.data.access_token
    
    console.log('🔍 Fetching driver ID...')
    const meRes = await fetch(`${baseUrl}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const meData = await meRes.json()
    const driverId = meData.data.id
    console.log('✅ Logged in as driver:', driverId)

    console.log('\n📝 Creating test vehicle...')
    const createRes = await fetch(`${baseUrl}/items/vehicle_profiles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vehicle_type: 'Truck',
        license_plate: 'DEMO-002',
        make: 'Volvo',
        model: 'FH16',
        model_year: 2022,
        color: 'White',
        capacity_kg: 25000,
        capacity_cbm: 65,
        registration_number: 'REG-2022-002',
        registration_expiry: '2026-12-31',
        insurance_provider: 'Global Insurance Co',
        insurance_policy_number: 'POL-2022-002',
        insurance_expiry: '2026-06-30',
        vehicle_condition: 'Excellent',
        is_active: true,
        last_inspection_date: '2025-10-15',
        inspection_expiry_date: '2026-10-15',
        documents_verified: true,
        document_expiry_alerts_enabled: true
      })
    })

    if (!createRes.ok) {
      console.error('❌ Failed to create vehicle:', createRes.status)
      console.log('Response:', await createRes.text())
      return
    }

    const vehicleData = await createRes.json()
    console.log('✅ Vehicle created with ID:', vehicleData.data.id)
    console.log('   License Plate:', vehicleData.data.license_plate)
    console.log('   Make/Model:', vehicleData.data.make, vehicleData.data.model)
    console.log('   Driver ID:', vehicleData.data.driver_id)

    console.log('\n📋 Fetching vehicles...')
    const listRes = await fetch(`${baseUrl}/items/vehicle_profiles`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const listData = await listRes.json()
    console.log('✅ Total vehicles:', listData.data?.length || 0)

  } catch (e) {
    console.error('Error:', e.message)
  }
}

createTestVehicle()

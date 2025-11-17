import fetch from 'node-fetch'

const baseUrl = 'https://admin.itboy.ir'
const testEmail = 'driver2@itboy.ir'
const testPassword = '123123@'

async function testVehicleCreation() {
  try {
    console.log('🔐 Logging in...')
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: testEmail, 
        password: testPassword 
      })
    })

    if (!loginRes.ok) {
      console.error('❌ Login failed:', loginRes.status)
      return
    }

    const loginData = await loginRes.json()
    const token = loginData.data.access_token

    console.log('   Full login response:', JSON.stringify(loginData, null, 2))

    const meRes = await fetch(`${baseUrl}/users/me?fields=id`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const meData = await meRes.json()
    const userId = meData.data.id

    console.log('✅ Logged in successfully')
    console.log(`   User ID: ${userId}`)

    console.log('\n🔍 Fetching existing vehicles...')
    const listRes = await fetch(`${baseUrl}/items/vehicle_profiles`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!listRes.ok) {
      console.error('❌ Failed to fetch vehicles:', listRes.status)
      return
    }

    const listData = await listRes.json()
    console.log(`✅ Found ${listData.data?.length || 0} existing vehicles`)

    console.log('\n📝 Creating test vehicle...')
    const createRes = await fetch(`${baseUrl}/items/vehicle_profiles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vehicle_type: 'Truck',
        license_plate: 'TEST-CREATION-001',
        make: 'Volvo',
        model: 'FH16',
        model_year: 2022,
        color: 'White',
        capacity_kg: 25000,
        capacity_cbm: 65,
        is_active: true,
        document_expiry_alerts_enabled: true,
        user_id: userId
      })
    })

    console.log(`\n📊 Create Response Status: ${createRes.status}`)
    
    if (!createRes.ok) {
      const errorData = await createRes.json()
      console.error('❌ Failed to create vehicle')
      console.error('Response:', JSON.stringify(errorData, null, 2))
      return
    }

    const vehicleData = await createRes.json()
    console.log('✅ Vehicle created successfully')
    console.log('Response:', JSON.stringify(vehicleData, null, 2))
    
    const createdVehicleId = vehicleData.data?.id

    console.log('\n🔍 Fetching all vehicles after creation...')
    const listRes2 = await fetch(`${baseUrl}/items/vehicle_profiles`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    const listData2 = await listRes2.json()
    console.log(`✅ Now found ${listData2.data?.length || 0} vehicles`)
    console.log('\n📋 Full GET response:')
    console.log(JSON.stringify(listData2, null, 2))
    
    if (listData2.data) {
      console.log('\n📋 All vehicles:')
      listData2.data.forEach((v, i) => {
        console.log(`${i + 1}. ID: ${v.id}, Plate: ${v.license_plate}, User ID: ${v.user_id}`)
      })
    }

    if (createdVehicleId) {
      console.log(`\n🔍 Fetching created vehicle (ID: ${createdVehicleId})...`)
      const getRes = await fetch(`${baseUrl}/items/vehicle_profiles/${createdVehicleId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (getRes.ok) {
        const vehicleDetail = await getRes.json()
        console.log('✅ Successfully fetched created vehicle')
        console.log('Vehicle details:', JSON.stringify(vehicleDetail.data, null, 2))
      } else {
        console.error(`❌ Failed to fetch created vehicle: ${getRes.status}`)
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testVehicleCreation()

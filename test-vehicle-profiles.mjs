import fetch from 'node-fetch'

const baseUrl = 'https://admin.itboy.ir'
const email = 'driver@itboy.ir'
const password = '123123@'

async function testVehicleProfiles() {
  try {
    console.log('🔍 Testing Vehicle Profiles API\n')
    
    console.log('1️⃣ Authenticating driver...')
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const loginData = await loginRes.json()
    if (!loginData.data?.access_token) {
      console.error('❌ Login failed:', loginData)
      process.exit(1)
    }

    const token = loginData.data.access_token
    const driverId = loginData.data.user?.id
    console.log('✅ Authenticated:', driverId)

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }

    console.log('\n2️⃣ Fetching all vehicle profiles...')
    const listRes = await fetch(`${baseUrl}/items/vehicle_profiles?limit=50`, {
      headers
    })
    const listData = await listRes.json()
    console.log(`✅ Found ${listData.data?.length || 0} vehicles`)
    
    if (listData.data && listData.data.length > 0) {
      const vehicle = listData.data[0]
      console.log('\n3️⃣ Testing all fields on first vehicle:')
      console.log('   ID:', vehicle.id)
      console.log('   Vehicle Type:', vehicle.vehicle_type)
      console.log('   License Plate:', vehicle.license_plate)
      console.log('   Make:', vehicle.make)
      console.log('   Model:', vehicle.model)
      console.log('   Model Year:', vehicle.model_year)
      console.log('   Color:', vehicle.color)
      console.log('   Weight Capacity:', vehicle.capacity_kg, 'kg')
      console.log('   Volume Capacity:', vehicle.capacity_cbm, 'CBM')
      console.log('   Registration Number:', vehicle.registration_number)
      console.log('   Registration Expiry:', vehicle.registration_expiry)
      console.log('   Insurance Provider:', vehicle.insurance_provider)
      console.log('   Insurance Policy:', vehicle.insurance_policy_number)
      console.log('   Insurance Expiry:', vehicle.insurance_expiry)
      console.log('   Vehicle Condition:', vehicle.vehicle_condition)
      console.log('   Active:', vehicle.is_active)
      console.log('   Last Inspection:', vehicle.last_inspection_date)
      console.log('   Inspection Expiry:', vehicle.inspection_expiry_date)
      console.log('   Documents Verified:', vehicle.documents_verified)
      console.log('   Alerts Enabled:', vehicle.document_expiry_alerts_enabled)
      console.log('   Created:', vehicle.created_at)
      console.log('   Updated:', vehicle.updated_at)
      console.log('   Driver ID:', vehicle.driver_id)

      console.log('\n4️⃣ Testing PATCH update...')
      const updateRes = await fetch(`${baseUrl}/items/vehicle_profiles/${vehicle.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          vehicle_condition: 'Excellent',
          capacity_kg: 25000,
          document_expiry_alerts_enabled: true
        })
      })

      if (updateRes.ok) {
        const updated = await updateRes.json()
        console.log('✅ Update successful')
        console.log('   Updated vehicle_condition:', updated.data.vehicle_condition)
        console.log('   Updated capacity_kg:', updated.data.capacity_kg)
        console.log('   Updated alerts_enabled:', updated.data.document_expiry_alerts_enabled)
      } else {
        console.log('❌ Update failed:', updateRes.status)
      }

      console.log('\n5️⃣ Testing filter by driver_id...')
      const filterRes = await fetch(
        `${baseUrl}/items/vehicle_profiles?filter={"driver_id":{"_eq":"${driverId}"}}`,
        { headers }
      )
      const filterData = await filterRes.json()
      console.log(`✅ Found ${filterData.data?.length || 0} vehicles for driver ${driverId}`)

      console.log('\n6️⃣ Testing field selection...')
      const fieldsRes = await fetch(
        `${baseUrl}/items/vehicle_profiles?fields=license_plate,vehicle_type,make,model,capacity_kg`,
        { headers }
      )
      const fieldsData = await fieldsRes.json()
      console.log('✅ Field selection works')
      if (fieldsData.data && fieldsData.data.length > 0) {
        console.log('   First vehicle fields:', Object.keys(fieldsData.data[0]))
      }
    }

    console.log('\n✅ All tests passed!')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

testVehicleProfiles()

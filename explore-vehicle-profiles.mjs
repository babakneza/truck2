import fetch from 'node-fetch'

const baseUrl = 'https://admin.itboy.ir'

async function exploreVehicleProfiles() {
  try {
    console.log('🔍 Logging in...')
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'driver@itboy.ir',
        password: '123123@'
      })
    })

    const loginData = await loginRes.json()
    if (!loginData.data?.access_token) {
      console.error('❌ Login failed:', loginData)
      return
    }

    const token = loginData.data.access_token
    console.log('✅ Logged in successfully')

    console.log('\n🔍 Testing vehicle_profiles collection access...')
    
    const testResponse = await fetch(
      `${baseUrl}/items/vehicle_profiles?limit=1`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )
    
    if (!testResponse.ok) {
      console.log('❌ Collection fetch failed:', testResponse.status)
      console.log('Response:', await testResponse.text())
      console.log('\n🔍 Checking available collections...')
      
      const collectionsRes = await fetch(`${baseUrl}/collections`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const collections = await collectionsRes.json()
      console.log('Available collections:')
      collections.data.forEach(c => console.log('  - ' + c.collection))
      return
    }
    
    console.log('✅ vehicle_profiles collection exists')
    
    console.log('\n🔍 Fetching sample vehicle profile data...')
    const dataResponse = await fetch(
      `${baseUrl}/items/vehicle_profiles?limit=5`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )
    
    if (!dataResponse.ok) {
      console.log('❌ Data fetch failed:', dataResponse.status)
      console.log('Response:', await dataResponse.text())
      return
    }
    
    const dataData = await dataResponse.json()
    console.log('\n✅ Sample Vehicle Profiles Data:')
    console.log(JSON.stringify(dataData, null, 2))
    
  } catch (error) {
    console.error('Error:', error.message)
  }
}

exploreVehicleProfiles()

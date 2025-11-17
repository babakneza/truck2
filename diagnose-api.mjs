import axios from 'axios'

const API_URL = 'https://admin.itboy.ir/api'

async function diagnoseAPI() {
  console.log('🔍 DIAGNOSING TRUCK2 API\n')

  try {
    console.log('1️⃣  Testing basic API connectivity...')
    const healthCheck = await axios.get(`${API_URL}`, {
      validateStatus: () => true
    })
    console.log(`   Status: ${healthCheck.status}`)
    console.log(`   Response: ${JSON.stringify(healthCheck.data).slice(0, 100)}...\n`)
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}\n`)
  }

  try {
    console.log('2️⃣  Checking public registration endpoint...')
    const regTest = await axios.post(`${API_URL}/users`, 
      {
        email: 'test@example.com',
        password: 'Test123!',
        role: null
      },
      { validateStatus: () => true }
    )
    console.log(`   Status: ${regTest.status}`)
    console.log(`   Response: ${JSON.stringify(regTest.data).slice(0, 150)}...\n`)
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}\n`)
  }

  try {
    console.log('3️⃣  Checking roles endpoint...')
    const rolesTest = await axios.get(`${API_URL}/roles`, {
      validateStatus: () => true
    })
    console.log(`   Status: ${rolesTest.status}`)
    if (rolesTest.data?.data) {
      console.log(`   Found ${rolesTest.data.data.length} roles:`)
      rolesTest.data.data.forEach(r => console.log(`   - ${r.name} (${r.id})`))
    } else {
      console.log(`   Response: ${JSON.stringify(rolesTest.data).slice(0, 100)}...`)
    }
    console.log()
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}\n`)
  }

  try {
    console.log('4️⃣  Testing login endpoint...')
    const loginTest = await axios.post(`${API_URL}/auth/login`,
      {
        email: 'test@example.com',
        password: 'Test123!'
      },
      { validateStatus: () => true }
    )
    console.log(`   Status: ${loginTest.status}`)
    console.log(`   Response: ${JSON.stringify(loginTest.data).slice(0, 150)}...\n`)
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}\n`)
  }

  console.log('✅ Diagnostic complete')
}

diagnoseAPI()

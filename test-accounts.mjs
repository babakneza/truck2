import axios from 'axios'

const baseURL = 'https://admin.itboy.ir'

const credentials = [
  { email: 'driver2@itboy.ir', password: '123123@', role: 'driver' },
  { email: 'shipper@itboy.ir', password: '123123@', role: 'shipper' }
]

async function verifyAccounts() {
  console.log('🧪 Testing provided accounts\n')

  for (const account of credentials) {
    console.log(`\n📧 Testing: ${account.email}`)
    console.log(`   Role: ${account.role}`)
    
    try {
      const response = await axios.post(`${baseURL}/auth/login`, {
        email: account.email,
        password: account.password
      }, { validateStatus: () => true })

      console.log(`   Status: ${response.status}`)
      
      if (response.status === 200) {
        const { access_token, refresh_token } = response.data.data || {}
        console.log(`   ✅ Login successful!`)
        console.log(`   Access Token: ${access_token?.slice(0, 20)}...`)
        console.log(`   Refresh Token: ${refresh_token?.slice(0, 20)}...`)

        try {
          const userResponse = await axios.get(`${baseURL}/users/me`, {
            headers: {
              'Authorization': `Bearer ${access_token}`
            }
          })
          console.log(`   User ID: ${userResponse.data.data.id}`)
          console.log(`   Email: ${userResponse.data.data.email}`)
          console.log(`   Role: ${userResponse.data.data.role}`)
        } catch (err) {
          console.log(`   ⚠️  Could not fetch user info: ${err.message}`)
        }
      } else {
        console.log(`   ❌ Login failed`)
        console.log(`   Response: ${JSON.stringify(response.data).slice(0, 100)}`)
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`)
    }
  }

  console.log('\n\n✅ Account testing complete')
}

verifyAccounts()

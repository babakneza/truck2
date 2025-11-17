import fetch from 'node-fetch'

const baseUrl = 'https://admin.itboy.ir'

async function debugDriverId() {
  try {
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver@itboy.ir', password: '123123@' })
    })
    const loginData = await loginRes.json()
    
    console.log('Full login response:')
    console.log(JSON.stringify(loginData, null, 2))
    
    const token = loginData.data.access_token
    
    console.log('\n🔍 Fetching /users/me...')
    const meRes = await fetch(`${baseUrl}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const meData = await meRes.json()
    console.log(JSON.stringify(meData, null, 2))
    
  } catch (e) {
    console.error('Error:', e.message)
  }
}

debugDriverId()

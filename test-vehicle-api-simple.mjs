import fetch from 'node-fetch'

const baseUrl = 'https://admin.itboy.ir'

async function test() {
  try {
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver@itboy.ir', password: '123123@' })
    })
    const loginData = await loginRes.json()
    const token = loginData.data.access_token
    
    console.log('1️⃣ Testing simple fetch without limit/filter:')
    const res1 = await fetch(`${baseUrl}/items/vehicle_profiles`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    console.log('Status:', res1.status)
    if (!res1.ok) {
      console.log('Response:', await res1.text())
    } else {
      const data = await res1.json()
      console.log('Found', data.data?.length || 0, 'vehicles')
    }

    console.log('\n2️⃣ Testing with limit:')
    const res2 = await fetch(`${baseUrl}/items/vehicle_profiles?limit=100`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    console.log('Status:', res2.status)
    if (!res2.ok) {
      console.log('Response:', await res2.text())
    } else {
      const data = await res2.json()
      console.log('Found', data.data?.length || 0, 'vehicles')
    }
  } catch (e) {
    console.error('Error:', e.message)
  }
}

test()

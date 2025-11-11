import fetch from 'node-fetch'

const DIRECTUS_URL = 'https://admin.itboy.ir'
const STATIC_TOKEN = 'AkXqjTVuseEt5XaRHzvuXPyIhYzF4jgb'

async function testRoleQuery() {
  try {
    console.log('Testing role query with raw fetch...')
    const res = await fetch(`${DIRECTUS_URL}/roles`, {
      headers: {
        'Authorization': `Bearer ${STATIC_TOKEN}`
      }
    })
    
    if (!res.ok) {
      console.error(`Error: ${res.status}`)
      const error = await res.json()
      console.error('Response:', error)
      return
    }
    
    const data = await res.json()
    console.log('All roles:', JSON.stringify(data, null, 2))
    
    if (data && data.data && Array.isArray(data.data)) {
      const shipper = data.data.find(r => r.name === 'Shipper')
      const driver = data.data.find(r => r.name === 'Driver')
      console.log('Shipper role:', shipper)
      console.log('Driver role:', driver)
    }
  } catch (error) {
    console.error('Error:', error.message)
  }
}

testRoleQuery()

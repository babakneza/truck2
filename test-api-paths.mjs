import axios from 'axios'

async function testAPIPaths() {
  const baseURL = 'https://admin.itboy.ir'
  
  const paths = [
    '/users',
    '/api/users',
    '/items/users',
    '/auth/login',
    '/api/auth/login',
    '/roles',
    '/api/roles',
    '/items/roles'
  ]

  console.log('🔎 Testing Directus API paths\n')
  console.log(`Base URL: ${baseURL}\n`)

  for (const path of paths) {
    try {
      const url = `${baseURL}${path}`
      const response = await axios.get(url, {
        timeout: 5000,
        validateStatus: () => true,
        headers: {
          'Accept': 'application/json'
        }
      })
      
      console.log(`${path}`)
      console.log(`  Status: ${response.status}`)
      if (response.status !== 404 && response.data) {
        const dataStr = JSON.stringify(response.data).slice(0, 80)
        console.log(`  Response: ${dataStr}...`)
      }
      console.log()
    } catch (error) {
      console.log(`${path}`)
      console.log(`  ❌ ${error.code || error.message}\n`)
    }
  }

  console.log('\nTesting POST endpoints:\n')

  try {
    const loginUrl = `${baseURL}/auth/login`
    const loginResponse = await axios.post(loginUrl, 
      { email: 'test@example.com', password: 'test' },
      { validateStatus: () => true }
    )
    console.log(`POST ${loginUrl}`)
    console.log(`  Status: ${loginResponse.status}`)
    console.log(`  Response: ${JSON.stringify(loginResponse.data).slice(0, 80)}\n`)
  } catch (error) {
    console.log(`POST /auth/login - ${error.message}\n`)
  }
}

testAPIPaths()

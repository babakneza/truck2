import axios from 'axios'

async function findCorrectAPI() {
  const baseURLs = [
    'https://admin.itboy.ir/api',
    'https://admin.itboy.ir',
    'https://admin.itboy.ir/admin/api',
    'https://admin.itboy.ir/directus/api',
    'http://localhost:8055',
    'http://localhost:8055/api'
  ]

  console.log('🔎 Searching for correct API endpoint...\n')

  for (const url of baseURLs) {
    try {
      const response = await axios.get(url, {
        timeout: 3000,
        validateStatus: () => true
      })
      console.log(`✅ ${url}`)
      console.log(`   Status: ${response.status}`)
      console.log(`   Response: ${JSON.stringify(response.data).slice(0, 100)}\n`)
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`❌ ${url} - Connection refused\n`)
      } else {
        console.log(`⚠️  ${url} - ${error.code || error.message}\n`)
      }
    }
  }

  console.log('Testing roles endpoint on different paths:\n')
  const rolePaths = [
    'https://admin.itboy.ir/api/roles',
    'https://admin.itboy.ir/items/roles',
    'https://admin.itboy.ir/admin/api/roles'
  ]

  for (const path of rolePaths) {
    try {
      const response = await axios.get(path, {
        timeout: 3000,
        validateStatus: () => true
      })
      console.log(`✅ ${path}`)
      console.log(`   Status: ${response.status}\n`)
    } catch (error) {
      console.log(`❌ ${path} - ${error.code || error.message}\n`)
    }
  }
}

findCorrectAPI()

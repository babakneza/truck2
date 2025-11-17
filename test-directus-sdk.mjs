import { createDirectus, rest, authentication } from '@directus/sdk'

const possibleURLs = [
  'https://admin.itboy.ir',
  'https://admin.itboy.ir/api',
  'https://admin.itboy.ir/admin'
]

async function testDirectusURLs() {
  console.log('🧪 Testing Directus SDK with different URLs\n')

  for (const url of possibleURLs) {
    try {
      console.log(`Testing: ${url}`)
      const client = createDirectus(url)
        .with(rest())
        .with(authentication())

      const rolesResponse = await client.request({
        method: 'GET',
        path: '/roles'
      }).catch(err => ({ error: err.message }))

      if (rolesResponse.error) {
        console.log(`   ❌ Error: ${rolesResponse.error}`)
      } else {
        console.log(`   ✅ Success!`)
        console.log(`   Response: ${JSON.stringify(rolesResponse).slice(0, 100)}...`)
      }
    } catch (error) {
      console.log(`   ❌ Exception: ${error.message}`)
    }
    console.log()
  }
}

testDirectusURLs()

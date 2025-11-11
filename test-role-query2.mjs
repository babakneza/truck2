import { createDirectus, rest, staticToken } from '@directus/sdk'

const DIRECTUS_URL = 'https://admin.itboy.ir'
const STATIC_TOKEN = 'AkXqjTVuseEt5XaRHzvuXPyIhYzF4jgb'

async function testRoleQuery() {
  try {
    const client = createDirectus(DIRECTUS_URL)
      .with(rest())
      .with(staticToken(STATIC_TOKEN))

    console.log('Testing role query...')
    const roles = await client.request({
      method: 'GET',
      path: '/roles'
    })
    
    console.log('All roles retrieved:', roles)
    
    if (Array.isArray(roles)) {
      const shipper = roles.find(r => r.name === 'Shipper')
      const driver = roles.find(r => r.name === 'Driver')
      console.log('Shipper role:', shipper)
      console.log('Driver role:', driver)
    } else if (roles && roles.data && Array.isArray(roles.data)) {
      const shipper = roles.data.find(r => r.name === 'Shipper')
      const driver = roles.data.find(r => r.name === 'Driver')
      console.log('Shipper role:', shipper)
      console.log('Driver role:', driver)
    }
  } catch (error) {
    console.error('Error:', error.message)
    console.error('Stack:', error.stack)
  }
}

testRoleQuery()

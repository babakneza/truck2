import { createDirectus, rest, authentication } from '@directus/sdk'

const DIRECTUS_URL = 'https://admin.itboy.ir'

async function testRoleQuery() {
  try {
    const client = createDirectus(DIRECTUS_URL)
      .with(rest())
      .with(authentication())

    console.log('Testing role query with filter format 1...')
    try {
      const resp1 = await client.request({
        method: 'GET',
        path: `/roles?filter[name][_eq]=Shipper`
      })
      console.log('Result 1:', resp1)
    } catch (e) {
      console.log('Format 1 failed:', e.message)
    }

    console.log('\nTesting role query with filter format 2...')
    try {
      const resp2 = await client.request({
        method: 'GET',
        path: '/roles'
      })
      console.log('All roles:', resp2)
      if (Array.isArray(resp2)) {
        console.log('Shipper role:', resp2.find(r => r.name === 'Shipper'))
        console.log('Driver role:', resp2.find(r => r.name === 'Driver'))
      }
    } catch (e) {
      console.log('Format 2 failed:', e.message)
    }
  } catch (error) {
    console.error('Error:', error.message)
  }
}

testRoleQuery()

import https from 'https'

const API_URL = 'https://admin.itboy.ir'
const TOKEN = 'h1YYv7_krvVsEIntDQtFeFqY6fxwDNJ2'

function makeRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data)
    const options = {
      hostname: 'admin.itboy.ir',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }

    const req = https.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => {
        body += chunk
      })
      res.on('end', () => {
        resolve({ status: res.statusCode, body: body })
      })
    })

    req.on('error', (e) => {
      reject(e)
    })

    req.write(payload)
    req.end()
  })
}

async function getRoles() {
  try {
    const res = await makeRequest('/roles', 'GET', {})
    if (res.status === 200) {
      const data = JSON.parse(res.body)
      return data.data || []
    }
    return []
  } catch (error) {
    console.error('Error fetching roles:', error.message)
    return []
  }
}

async function createDriverUserPermission() {
  try {
    console.log('🔧 Fixing Driver Role Permissions...\n')

    const roles = await getRoles()
    const driverRole = roles.find(r => r.name.toLowerCase() === 'driver')
    
    if (!driverRole) {
      console.error('❌ Driver role not found')
      return
    }

    console.log(`✅ Found Driver role: ${driverRole.id}`)

    const permissions = [
      {
        role: driverRole.id,
        collection: 'users',
        action: 'read',
        policy: 'allow',
        permissions: {},
        validation: {}
      }
    ]

    for (const perm of permissions) {
      console.log(`\n📝 Creating permission: ${perm.collection}/${perm.action}`)
      
      const res = await makeRequest('/permissions', 'POST', perm)
      
      if (res.status === 200 || res.status === 201) {
        console.log(`✅ Permission created successfully`)
      } else if (res.status === 409 || res.status === 422) {
        console.log(`⚠️  Permission already exists (${res.status})`)
      } else {
        console.log(`❌ Failed with status ${res.status}`)
        try {
          const errorData = JSON.parse(res.body)
          console.log(`   Error: ${errorData.errors?.[0]?.message || res.body}`)
        } catch (e) {
          console.log(`   Response: ${res.body}`)
        }
      }
    }

    console.log('\n✅ Driver permissions fixed!')
  } catch (error) {
    console.error('Error:', error.message)
  }
}

createDriverUserPermission()

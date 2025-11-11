import https from 'https'

const rolesMap = {
  'Shipper': null,
  'Driver': null,
  'Admin': null
}

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null
    const options = {
      hostname: 'admin.itboy.ir',
      path: path,
      method: method,
      headers: {
        'Authorization': 'Bearer h1YYv7_krvVsEIntDQtFeFqY6fxwDNJ2',
        'Content-Type': 'application/json'
      }
    }

    if (payload) {
      options.headers['Content-Length'] = Buffer.byteLength(payload)
    }

    const req = https.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => { body += chunk })
      res.on('end', () => { resolve({ status: res.statusCode, body: body }) })
    })

    req.on('error', (e) => { reject(e) })
    if (payload) req.write(payload)
    req.end()
  })
}

async function getRoleIds() {
  console.log('Fetching role IDs...\n')
  
  const res = await makeRequest('GET', '/roles')
  const data = JSON.parse(res.body)
  
  if (data.data) {
    data.data.forEach(role => {
      if (role.name === 'Shipper') rolesMap['Shipper'] = role.id
      if (role.name === 'Driver') rolesMap['Driver'] = role.id
      if (role.name === 'Admin') rolesMap['Admin'] = role.id
    })
  }
  
  console.log('Roles found:')
  console.log(`  Shipper: ${rolesMap['Shipper']}`)
  console.log(`  Driver: ${rolesMap['Driver']}`)
  console.log(`  Admin: ${rolesMap['Admin']}\n`)
  
  return Object.values(rolesMap).every(id => id !== null)
}

async function testPermission() {
  console.log('Testing single permission creation...\n')
  
  const payload = {
    role: rolesMap['Shipper'],
    collection: 'conversations',
    action: 'read',
    permissions: {},
    validation: {},
    fields: ['*']
  }
  
  console.log('Sending payload:')
  console.log(JSON.stringify(payload, null, 2))
  console.log()
  
  const res = await makeRequest('POST', '/permissions', payload)
  console.log(`Status: ${res.status}`)
  console.log(`Response:`)
  console.log(res.body)
}

async function main() {
  try {
    const allRolesFound = await getRoleIds()
    
    if (!allRolesFound) {
      console.error('Error: Not all required roles were found.')
      process.exit(1)
    }
    
    await testPermission()
  } catch (err) {
    console.error('Fatal error:', err.message)
    process.exit(1)
  }
}

main()

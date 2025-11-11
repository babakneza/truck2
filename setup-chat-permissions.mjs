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

async function setupShipperDriverPermissions(roleId, roleName) {
  console.log(`Setting up ${roleName} role permissions for chat collections...\n`)
  
  const permissions = [
    { collection: 'conversations', actions: ['create', 'read', 'update', 'delete'] },
    { collection: 'messages', actions: ['create', 'read', 'update', 'delete'] },
    { collection: 'message_reads', actions: ['create', 'read'] },
    { collection: 'message_attachments', actions: ['create', 'read', 'delete'] },
    { collection: 'message_reactions', actions: ['create', 'read', 'delete'] },
    { collection: 'chat_participants', actions: ['read'] },
    { collection: 'typing_indicators', actions: ['create', 'delete'] },
    { collection: 'conversation_settings', actions: ['create', 'read', 'update'] },
    { collection: 'chat_notifications', actions: ['read'] }
  ]

  for (const perm of permissions) {
    for (const action of perm.actions) {
      let filter = {}
      
      switch(perm.collection) {
        case 'conversations':
          if (action === 'read' || action === 'update') {
            filter = { _or: [{ initiator_id: { _eq: '$CURRENT_USER' } }, { receiver_id: { _eq: '$CURRENT_USER' } }] }
          }
          if (action === 'delete') {
            filter = { initiator_id: { _eq: '$CURRENT_USER' } }
          }
          break
        case 'messages':
          if (action === 'read') {
            filter = { conversation_id: { _or: [{ initiator_id: { _eq: '$CURRENT_USER' } }, { receiver_id: { _eq: '$CURRENT_USER' } }] } }
          }
          if (action === 'update' || action === 'delete') {
            filter = { sender_id: { _eq: '$CURRENT_USER' }, is_deleted: { _eq: false } }
          }
          break
        case 'message_reads':
          if (action === 'read') {
            filter = { reader_id: { _eq: '$CURRENT_USER' } }
          }
          break
        case 'message_attachments':
          if (action === 'read') {
            filter = { message_id: { conversation_id: { _or: [{ initiator_id: { _eq: '$CURRENT_USER' } }, { receiver_id: { _eq: '$CURRENT_USER' } }] } } }
          }
          if (action === 'delete') {
            filter = { uploaded_by_id: { _eq: '$CURRENT_USER' } }
          }
          break
        case 'message_reactions':
          if (action === 'delete') {
            filter = { user_id: { _eq: '$CURRENT_USER' } }
          }
          break
        case 'chat_participants':
          if (action === 'read') {
            filter = { user_id: { _eq: '$CURRENT_USER' } }
          }
          break
        case 'typing_indicators':
          if (action === 'delete') {
            filter = { user_id: { _eq: '$CURRENT_USER' } }
          }
          break
        case 'conversation_settings':
          if (action === 'read' || action === 'update') {
            filter = { user_id: { _eq: '$CURRENT_USER' } }
          }
          break
        case 'chat_notifications':
          if (action === 'read') {
            filter = { recipient_id: { _eq: '$CURRENT_USER' } }
          }
          break
      }
      
      const payload = {
        role: roleId,
        collection: perm.collection,
        action: action,
        permissions: filter,
        validation: {},
        fields: '*',
        policy: 'create'
      }
      
      try {
        const res = await makeRequest('POST', '/permissions', payload)
        if (res.status === 200 || res.status === 201) {
          console.log(`  ✓ ${perm.collection}.${action}`)
        } else {
          console.log(`  ✗ ${perm.collection}.${action} - Status: ${res.status}`)
        }
      } catch (err) {
        console.error(`  ✗ ${perm.collection}.${action} - ${err.message}`)
      }
    }
  }
  
  console.log(`${roleName} permissions complete\n`)
}

async function setupAdminPermissions(roleId) {
  console.log('Setting up Admin role permissions for chat collections...\n')
  
  const collections = [
    'conversations',
    'messages',
    'message_reads',
    'message_attachments',
    'message_reactions',
    'chat_participants',
    'typing_indicators',
    'conversation_settings',
    'chat_notifications'
  ]

  for (const collection of collections) {
    for (const action of ['create', 'read', 'update', 'delete']) {
      const payload = {
        role: roleId,
        collection: collection,
        action: action,
        permissions: {},
        validation: {},
        fields: '*',
        policy: 'create'
      }
      
      try {
        const res = await makeRequest('POST', '/permissions', payload)
        if (res.status === 200 || res.status === 201) {
          console.log(`  ✓ ${collection}.${action}`)
        } else {
          console.log(`  ✗ ${collection}.${action} - Status: ${res.status}`)
        }
      } catch (err) {
        console.error(`  ✗ ${collection}.${action} - ${err.message}`)
      }
    }
  }
  
  console.log('Admin permissions complete\n')
}

async function main() {
  try {
    const allRolesFound = await getRoleIds()
    
    if (!allRolesFound) {
      console.error('Error: Not all required roles were found. Please create Shipper, Driver, and Admin roles first.')
      process.exit(1)
    }
    
    if (rolesMap['Shipper']) await setupShipperDriverPermissions(rolesMap['Shipper'], 'Shipper')
    if (rolesMap['Driver']) await setupShipperDriverPermissions(rolesMap['Driver'], 'Driver')
    if (rolesMap['Admin']) await setupAdminPermissions(rolesMap['Admin'])
    
    console.log('✓ Chat system permissions setup complete!')
  } catch (err) {
    console.error('Fatal error:', err.message)
    process.exit(1)
  }
}

main()

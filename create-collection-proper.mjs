import https from 'https'

const collectionMeta = {
  collection: 'users',
  meta: {
    icon: 'people',
    display_template: '{{ first_name }} {{ last_name }} ({{ email }})',
    sort: 1
  }
}

const fields = [
  {
    field: 'id',
    type: 'integer',
    meta: {
      hidden: true,
      interface: 'input',
      readonly: true
    },
    schema: {
      is_primary_key: true,
      has_auto_increment: true
    }
  },
  {
    field: 'uuid',
    type: 'uuid',
    meta: {
      interface: 'input',
      readonly: true
    },
    schema: {
      is_unique: true
    }
  },
  {
    field: 'email',
    type: 'string',
    meta: {
      interface: 'input',
      options: {
        placeholder: 'user@example.com'
      },
      width: 'full'
    },
    schema: {
      is_unique: true,
      max_length: 255
    }
  },
  {
    field: 'phone',
    type: 'string',
    meta: {
      interface: 'input',
      options: {
        placeholder: '+968XXXXXXXXX'
      }
    },
    schema: {
      is_unique: true
    }
  },
  {
    field: 'password_hash',
    type: 'hash',
    meta: {
      interface: 'input-hash',
      hidden: true,
      special: ['hash', 'conceal']
    }
  },
  {
    field: 'first_name',
    type: 'string',
    meta: {
      interface: 'input',
      width: 'half'
    },
    schema: {
      max_length: 100
    }
  },
  {
    field: 'last_name',
    type: 'string',
    meta: {
      interface: 'input',
      width: 'half'
    },
    schema: {
      max_length: 100
    }
  },
  {
    field: 'user_type',
    type: 'string',
    meta: {
      interface: 'select-dropdown',
      options: {
        choices: [
          { text: 'Shipper', value: 'shipper' },
          { text: 'Driver', value: 'driver' },
          { text: 'Admin', value: 'admin' }
        ]
      },
      width: 'half'
    }
  },
  {
    field: 'is_active',
    type: 'boolean',
    meta: {
      interface: 'boolean',
      width: 'half'
    },
    schema: {
      default_value: true
    }
  },
  {
    field: 'status',
    type: 'string',
    meta: {
      interface: 'select-dropdown',
      options: {
        choices: [
          { text: 'INACTIVE', value: 'INACTIVE' },
          { text: 'ACTIVE', value: 'ACTIVE' },
          { text: 'SUSPENDED', value: 'SUSPENDED' },
          { text: 'DELETED', value: 'DELETED' }
        ]
      }
    }
  },
  {
    field: 'phone_verified',
    type: 'boolean',
    schema: {
      default_value: false
    }
  },
  {
    field: 'email_verified',
    type: 'boolean',
    schema: {
      default_value: false
    }
  },
  {
    field: 'kyc_status',
    type: 'string',
    meta: {
      interface: 'select-dropdown',
      options: {
        choices: [
          { text: 'PENDING', value: 'PENDING' },
          { text: 'VERIFIED', value: 'VERIFIED' },
          { text: 'REJECTED', value: 'REJECTED' },
          { text: 'EXPIRED', value: 'EXPIRED' }
        ]
      }
    }
  },
  {
    field: 'last_login_at',
    type: 'timestamp',
    meta: {
      interface: 'datetime',
      readonly: true
    }
  },
  {
    field: 'login_attempts',
    type: 'integer',
    schema: {
      default_value: 0
    }
  },
  {
    field: 'last_login_attempt_at',
    type: 'timestamp',
    meta: {
      interface: 'datetime',
      readonly: true
    }
  },
  {
    field: 'created_at',
    type: 'timestamp',
    meta: {
      interface: 'datetime',
      readonly: true,
      special: ['date-created']
    }
  },
  {
    field: 'updated_at',
    type: 'timestamp',
    meta: {
      interface: 'datetime',
      readonly: true,
      special: ['date-updated']
    }
  }
]

function makeRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data)
    const options = {
      hostname: 'admin.itboy.ir',
      path: path,
      method: method,
      headers: {
        'Authorization': 'Bearer h1YYv7_krvVsEIntDQtFeFqY6fxwDNJ2',
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

async function createCollectionWithFields() {
  try {
    console.log('Creating collection...')
    const collRes = await makeRequest('/collections', 'POST', collectionMeta)
    console.log('Collection Status:', collRes.status)

    console.log('\nCreating fields...')
    for (const field of fields) {
      const fieldRes = await makeRequest(`/fields/users/${field.field}`, 'PATCH', field)
      console.log(`Field "${field.field}" Status:`, fieldRes.status)
    }

    console.log('\nCollection created successfully with all fields!')
  } catch (err) {
    console.error('Error:', err.message)
  }
}

createCollectionWithFields()

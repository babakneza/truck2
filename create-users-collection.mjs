import https from 'https'

const payload = {
  collection: 'users',
  meta: {
    icon: 'people',
    display_template: '{{ first_name }} {{ last_name }} ({{ email }})',
    sort: 1
  },
  schema: {
    name: 'users',
    comment: null
  },
  fields: [
    {
      field: 'id',
      type: 'integer',
      meta: {
        hidden: true,
        interface: 'input',
        readonly: true
      },
      schema: {
        name: 'id',
        table: 'users',
        type: 'integer',
        data_type: 'int',
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
        name: 'uuid',
        table: 'users',
        type: 'uuid',
        data_type: 'char',
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
        name: 'email',
        table: 'users',
        type: 'string',
        data_type: 'varchar',
        max_length: 255,
        is_unique: true
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
        name: 'phone',
        table: 'users',
        type: 'string',
        data_type: 'varchar',
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
      },
      schema: {
        name: 'password_hash',
        table: 'users',
        type: 'string',
        data_type: 'varchar'
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
        name: 'first_name',
        table: 'users',
        type: 'string',
        data_type: 'varchar',
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
        name: 'last_name',
        table: 'users',
        type: 'string',
        data_type: 'varchar',
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
      },
      schema: {
        name: 'user_type',
        table: 'users',
        type: 'string',
        data_type: 'varchar'
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
        name: 'is_active',
        table: 'users',
        type: 'boolean',
        data_type: 'tinyint',
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
      },
      schema: {
        name: 'status',
        table: 'users',
        type: 'string',
        data_type: 'varchar'
      }
    },
    {
      field: 'phone_verified',
      type: 'boolean',
      schema: {
        name: 'phone_verified',
        table: 'users',
        type: 'boolean',
        data_type: 'tinyint',
        default_value: false
      }
    },
    {
      field: 'email_verified',
      type: 'boolean',
      schema: {
        name: 'email_verified',
        table: 'users',
        type: 'boolean',
        data_type: 'tinyint',
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
      },
      schema: {
        name: 'kyc_status',
        table: 'users',
        type: 'string',
        data_type: 'varchar'
      }
    },
    {
      field: 'last_login_at',
      type: 'timestamp',
      meta: {
        interface: 'datetime',
        readonly: true
      },
      schema: {
        name: 'last_login_at',
        table: 'users',
        type: 'timestamp',
        data_type: 'datetime'
      }
    },
    {
      field: 'login_attempts',
      type: 'integer',
      schema: {
        name: 'login_attempts',
        table: 'users',
        type: 'integer',
        data_type: 'int',
        default_value: 0
      }
    },
    {
      field: 'last_login_attempt_at',
      type: 'timestamp',
      meta: {
        interface: 'datetime',
        readonly: true
      },
      schema: {
        name: 'last_login_attempt_at',
        table: 'users',
        type: 'timestamp',
        data_type: 'datetime'
      }
    },
    {
      field: 'created_at',
      type: 'timestamp',
      meta: {
        interface: 'datetime',
        readonly: true,
        special: ['date-created']
      },
      schema: {
        name: 'created_at',
        table: 'users',
        type: 'timestamp',
        data_type: 'datetime'
      }
    },
    {
      field: 'updated_at',
      type: 'timestamp',
      meta: {
        interface: 'datetime',
        readonly: true,
        special: ['date-updated']
      },
      schema: {
        name: 'updated_at',
        table: 'users',
        type: 'timestamp',
        data_type: 'datetime'
      }
    }
  ]
}

const data = JSON.stringify(payload)

const options = {
  hostname: 'admin.itboy.ir',
  path: '/collections',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer h1YYv7_krvVsEIntDQtFeFqY6fxwDNJ2',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}

const req = https.request(options, (res) => {
  let body = ''
  res.on('data', (chunk) => {
    body += chunk
  })
  res.on('end', () => {
    console.log('Status:', res.statusCode)
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✓ Users collection created successfully with all fields!')
    } else {
      console.log('Response:', body)
    }
  })
})

req.on('error', (e) => {
  console.error('Error:', e.message)
})

req.write(data)
req.end()

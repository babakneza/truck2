import https from 'https'

const payload = {
  collection: 'verification_codes',
  meta: {
    icon: 'vpn_key',
    display_template: '{{ code }} - {{ type }}',
    sort: 2
  },
  schema: {
    name: 'verification_codes',
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
        table: 'verification_codes',
        type: 'integer',
        data_type: 'int',
        is_primary_key: true,
        has_auto_increment: true
      }
    },
    {
      field: 'user_id',
      type: 'integer',
      meta: {
        interface: 'many-to-one',
        special: ['m2o']
      },
      schema: {
        name: 'user_id',
        table: 'verification_codes',
        type: 'integer',
        data_type: 'int'
      }
    },
    {
      field: 'code',
      type: 'string',
      meta: {
        interface: 'input'
      },
      schema: {
        name: 'code',
        table: 'verification_codes',
        type: 'string',
        data_type: 'varchar',
        max_length: 10,
        is_unique: true
      }
    },
    {
      field: 'type',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'PHONE', value: 'PHONE' },
            { text: 'EMAIL', value: 'EMAIL' },
            { text: 'PASSWORD_RESET', value: 'PASSWORD_RESET' }
          ]
        }
      },
      schema: {
        name: 'type',
        table: 'verification_codes',
        type: 'string',
        data_type: 'varchar'
      }
    },
    {
      field: 'is_used',
      type: 'boolean',
      meta: {
        interface: 'boolean'
      },
      schema: {
        name: 'is_used',
        table: 'verification_codes',
        type: 'boolean',
        data_type: 'tinyint',
        default_value: false
      }
    },
    {
      field: 'attempts',
      type: 'integer',
      meta: {
        interface: 'input'
      },
      schema: {
        name: 'attempts',
        table: 'verification_codes',
        type: 'integer',
        data_type: 'int',
        default_value: 0
      }
    },
    {
      field: 'expires_at',
      type: 'timestamp',
      meta: {
        interface: 'datetime'
      },
      schema: {
        name: 'expires_at',
        table: 'verification_codes',
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
        table: 'verification_codes',
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
      console.log('✓ Verification codes collection created successfully with all fields!')
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

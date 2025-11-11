import https from 'https'

const collections = [
  {
    collection: 'token_blacklist',
    meta: {
      icon: 'block',
      display_template: 'Token - {{ user_id }}',
      sort: 3
    },
    schema: {
      name: 'token_blacklist',
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
          table: 'token_blacklist',
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
          table: 'token_blacklist',
          type: 'integer',
          data_type: 'int'
        }
      },
      {
        field: 'token',
        type: 'text',
        meta: {
          interface: 'input-multiline'
        },
        schema: {
          name: 'token',
          table: 'token_blacklist',
          type: 'text',
          data_type: 'longtext'
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
          table: 'token_blacklist',
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
          table: 'token_blacklist',
          type: 'timestamp',
          data_type: 'datetime'
        }
      }
    ]
  },
  {
    collection: 'shipper_profiles',
    meta: {
      icon: 'business',
      display_template: '{{ user_id.first_name }} - Shipper',
      sort: 4
    },
    schema: {
      name: 'shipper_profiles',
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
          table: 'shipper_profiles',
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
          table: 'shipper_profiles',
          type: 'integer',
          data_type: 'int',
          is_unique: true
        }
      },
      {
        field: 'company_name',
        type: 'string',
        meta: {
          interface: 'input'
        },
        schema: {
          name: 'company_name',
          table: 'shipper_profiles',
          type: 'string',
          data_type: 'varchar',
          max_length: 255
        }
      },
      {
        field: 'tax_id',
        type: 'string',
        meta: {
          interface: 'input'
        },
        schema: {
          name: 'tax_id',
          table: 'shipper_profiles',
          type: 'string',
          data_type: 'varchar',
          max_length: 50
        }
      },
      {
        field: 'business_type',
        type: 'string',
        meta: {
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: 'Individual', value: 'individual' },
              { text: 'Small Business', value: 'small_business' },
              { text: 'Enterprise', value: 'enterprise' }
            ]
          }
        },
        schema: {
          name: 'business_type',
          table: 'shipper_profiles',
          type: 'string',
          data_type: 'varchar'
        }
      },
      {
        field: 'address',
        type: 'text',
        meta: {
          interface: 'input-multiline'
        },
        schema: {
          name: 'address',
          table: 'shipper_profiles',
          type: 'text',
          data_type: 'longtext'
        }
      },
      {
        field: 'city',
        type: 'string',
        meta: {
          interface: 'input'
        },
        schema: {
          name: 'city',
          table: 'shipper_profiles',
          type: 'string',
          data_type: 'varchar',
          max_length: 100
        }
      },
      {
        field: 'country',
        type: 'string',
        meta: {
          interface: 'input'
        },
        schema: {
          name: 'country',
          table: 'shipper_profiles',
          type: 'string',
          data_type: 'varchar',
          max_length: 100,
          default_value: 'Oman'
        }
      },
      {
        field: 'total_shipments_posted',
        type: 'integer',
        meta: {
          interface: 'input'
        },
        schema: {
          name: 'total_shipments_posted',
          table: 'shipper_profiles',
          type: 'integer',
          data_type: 'int',
          default_value: 0
        }
      },
      {
        field: 'completed_shipments',
        type: 'integer',
        meta: {
          interface: 'input'
        },
        schema: {
          name: 'completed_shipments',
          table: 'shipper_profiles',
          type: 'integer',
          data_type: 'int',
          default_value: 0
        }
      },
      {
        field: 'average_rating',
        type: 'decimal',
        meta: {
          interface: 'input'
        },
        schema: {
          name: 'average_rating',
          table: 'shipper_profiles',
          type: 'decimal',
          data_type: 'decimal',
          numeric_precision: 3,
          numeric_scale: 2
        }
      },
      {
        field: 'total_ratings',
        type: 'integer',
        meta: {
          interface: 'input'
        },
        schema: {
          name: 'total_ratings',
          table: 'shipper_profiles',
          type: 'integer',
          data_type: 'int',
          default_value: 0
        }
      },
      {
        field: 'avg_response_time_minutes',
        type: 'integer',
        meta: {
          interface: 'input'
        },
        schema: {
          name: 'avg_response_time_minutes',
          table: 'shipper_profiles',
          type: 'integer',
          data_type: 'int',
          default_value: 0
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
          table: 'shipper_profiles',
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
          table: 'shipper_profiles',
          type: 'timestamp',
          data_type: 'datetime'
        }
      }
    ]
  },
  {
    collection: 'driver_profiles',
    meta: {
      icon: 'local_shipping',
      display_template: '{{ user_id.first_name }} - Driver',
      sort: 5
    },
    schema: {
      name: 'driver_profiles',
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
          table: 'driver_profiles',
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
          table: 'driver_profiles',
          type: 'integer',
          data_type: 'int',
          is_unique: true
        }
      },
      {
        field: 'license_number',
        type: 'string',
        meta: {
          interface: 'input'
        },
        schema: {
          name: 'license_number',
          table: 'driver_profiles',
          type: 'string',
          data_type: 'varchar',
          max_length: 50,
          is_unique: true
        }
      },
      {
        field: 'license_expiry_date',
        type: 'date',
        meta: {
          interface: 'datetime'
        },
        schema: {
          name: 'license_expiry_date',
          table: 'driver_profiles',
          type: 'date',
          data_type: 'date'
        }
      },
      {
        field: 'license_document_url',
        type: 'string',
        meta: {
          interface: 'input'
        },
        schema: {
          name: 'license_document_url',
          table: 'driver_profiles',
          type: 'string',
          data_type: 'varchar',
          max_length: 500
        }
      },
      {
        field: 'driving_experience_years',
        type: 'integer',
        meta: {
          interface: 'input'
        },
        schema: {
          name: 'driving_experience_years',
          table: 'driver_profiles',
          type: 'integer',
          data_type: 'int',
          default_value: 0
        }
      },
      {
        field: 'total_trips_completed',
        type: 'integer',
        meta: {
          interface: 'input'
        },
        schema: {
          name: 'total_trips_completed',
          table: 'driver_profiles',
          type: 'integer',
          data_type: 'int',
          default_value: 0
        }
      },
      {
        field: 'total_shipments_delivered',
        type: 'integer',
        meta: {
          interface: 'input'
        },
        schema: {
          name: 'total_shipments_delivered',
          table: 'driver_profiles',
          type: 'integer',
          data_type: 'int',
          default_value: 0
        }
      },
      {
        field: 'average_rating',
        type: 'decimal',
        meta: {
          interface: 'input'
        },
        schema: {
          name: 'average_rating',
          table: 'driver_profiles',
          type: 'decimal',
          data_type: 'decimal',
          numeric_precision: 3,
          numeric_scale: 2
        }
      },
      {
        field: 'total_ratings',
        type: 'integer',
        meta: {
          interface: 'input'
        },
        schema: {
          name: 'total_ratings',
          table: 'driver_profiles',
          type: 'integer',
          data_type: 'int',
          default_value: 0
        }
      },
      {
        field: 'acceptance_rate',
        type: 'decimal',
        meta: {
          interface: 'input'
        },
        schema: {
          name: 'acceptance_rate',
          table: 'driver_profiles',
          type: 'decimal',
          data_type: 'decimal',
          numeric_precision: 5,
          numeric_scale: 2,
          default_value: 100
        }
      },
      {
        field: 'on_time_delivery_rate',
        type: 'decimal',
        meta: {
          interface: 'input'
        },
        schema: {
          name: 'on_time_delivery_rate',
          table: 'driver_profiles',
          type: 'decimal',
          data_type: 'decimal',
          numeric_precision: 5,
          numeric_scale: 2,
          default_value: 100
        }
      },
      {
        field: 'available_for_bidding',
        type: 'boolean',
        meta: {
          interface: 'boolean'
        },
        schema: {
          name: 'available_for_bidding',
          table: 'driver_profiles',
          type: 'boolean',
          data_type: 'tinyint',
          default_value: true
        }
      },
      {
        field: 'preferred_routes',
        type: 'json',
        meta: {
          interface: 'input-code',
          options: {
            language: 'json'
          }
        },
        schema: {
          name: 'preferred_routes',
          table: 'driver_profiles',
          type: 'json',
          data_type: 'json'
        }
      },
      {
        field: 'total_earnings',
        type: 'decimal',
        meta: {
          interface: 'input'
        },
        schema: {
          name: 'total_earnings',
          table: 'driver_profiles',
          type: 'decimal',
          data_type: 'decimal',
          numeric_precision: 12,
          numeric_scale: 2,
          default_value: 0
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
          table: 'driver_profiles',
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
          table: 'driver_profiles',
          type: 'timestamp',
          data_type: 'datetime'
        }
      }
    ]
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

async function createAllCollections() {
  try {
    for (const collection of collections) {
      console.log(`Creating collection: ${collection.collection}...`)
      const res = await makeRequest('/collections', 'POST', collection)
      if (res.status === 200 || res.status === 201) {
        console.log(`✓ ${collection.collection} created successfully!\n`)
      } else {
        console.log(`✗ ${collection.collection} failed with status ${res.status}`)
        console.log(`Response: ${res.body}\n`)
      }
    }
    console.log('All collections created successfully!')
  } catch (err) {
    console.error('Error:', err.message)
  }
}

createAllCollections()

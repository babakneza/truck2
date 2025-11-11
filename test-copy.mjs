import https from 'https'

const vehicleProfiles = {
  collection: 'vehicle_profiles',
  meta: {
    icon: 'directions_car',
    display_template: '{{ license_plate }} - {{ vehicle_type }}',
    sort: 6
  },
  schema: { name: 'vehicle_profiles' },
  fields: [
    { field: 'id', type: 'integer', meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
    { field: 'driver_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'vehicle_type', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Motorcycle', value: 'motorcycle' }, { text: 'Light Truck', value: 'light_truck' }, { text: 'Medium Truck', value: 'medium_truck' }, { text: 'Heavy Truck', value: 'heavy_truck' }, { text: 'Refrigerated', value: 'refrigerated' }, { text: 'Tanker', value: 'tanker' }] } }, schema: {} },
    { field: 'license_plate', type: 'string', meta: { interface: 'input' }, schema: { max_length: 50, is_unique: true } },
    { field: 'model_year', type: 'integer', meta: { interface: 'input' }, schema: {} },
    { field: 'make', type: 'string', meta: { interface: 'input' }, schema: { max_length: 100 } },
    { field: 'model', type: 'string', meta: { interface: 'input' }, schema: { max_length: 100 } },
    { field: 'color', type: 'string', meta: { interface: 'input' }, schema: { max_length: 50 } },
    { field: 'capacity_kg', type: 'integer', meta: { interface: 'input' }, schema: { default_value: 0 } },
    { field: 'capacity_cbm', type: 'decimal', meta: { interface: 'input' }, schema: { numeric_precision: 8, numeric_scale: 2 } },
    { field: 'registration_number', type: 'string', meta: { interface: 'input' }, schema: { max_length: 100 } },
    { field: 'registration_expiry', type: 'date', meta: { interface: 'datetime' }, schema: {} },
    { field: 'insurance_provider', type: 'string', meta: { interface: 'input' }, schema: { max_length: 100 } },
    { field: 'insurance_policy_number', type: 'string', meta: { interface: 'input' }, schema: { max_length: 100 } },
    { field: 'insurance_expiry', type: 'date', meta: { interface: 'datetime' }, schema: {} },
    { field: 'vehicle_condition', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Excellent', value: 'excellent' }, { text: 'Good', value: 'good' }, { text: 'Fair', value: 'fair' }, { text: 'Needs Repair', value: 'needs_repair' }] } }, schema: {} },
    { field: 'is_active', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: true } },
    { field: 'last_inspection_date', type: 'date', meta: { interface: 'datetime' }, schema: {} },
    { field: 'inspection_expiry_date', type: 'date', meta: { interface: 'datetime' }, schema: {} },
    { field: 'documents_verified', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: false } },
    { field: 'document_expiry_alerts_enabled', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: true } },
    { field: 'created_at', type: 'timestamp', meta: { special: ['date-created'], readonly: true }, schema: {} },
    { field: 'updated_at', type: 'timestamp', meta: { special: ['date-updated'], readonly: true }, schema: {} }
  ]
}

const kycDocuments = {
  collection: 'kyc_documents',
  meta: { icon: 'description', display_template: '{{ document_type }} - {{ user_id.email }}', sort: 7 },
  schema: { name: 'kyc_documents' },
  fields: [
    { field: 'id', type: 'integer', meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
    { field: 'user_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'document_type', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'National ID', value: 'NATIONAL_ID' }, { text: 'Passport', value: 'PASSPORT' }, { text: 'Business License', value: 'BUSINESS_LICENSE' }, { text: 'Tax Certificate', value: 'TAX_CERTIFICATE' }, { text: 'Driver License', value: 'DRIVER_LICENSE' }, { text: 'Vehicle Registration', value: 'VEHICLE_REGISTRATION' }, { text: 'Insurance', value: 'INSURANCE' }] } }, schema: {} },
    { field: 'document_url', type: 'string', meta: { interface: 'input' }, schema: { max_length: 500 } },
    { field: 'document_expiry_date', type: 'date', meta: { interface: 'datetime' }, schema: {} },
    { field: 'verified_by_admin', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: false } },
    { field: 'verified_at', type: 'timestamp', meta: { interface: 'datetime' }, schema: {} },
    { field: 'verification_notes', type: 'text', meta: { interface: 'input-multiline' }, schema: {} },
    { field: 'rejection_reason', type: 'text', meta: { interface: 'input-multiline' }, schema: {} },
    { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Pending', value: 'PENDING' }, { text: 'Approved', value: 'APPROVED' }, { text: 'Rejected', value: 'REJECTED' }, { text: 'Expired', value: 'EXPIRED' }] } }, schema: {} },
    { field: 'created_at', type: 'timestamp', meta: { special: ['date-created'], readonly: true }, schema: {} },
    { field: 'updated_at', type: 'timestamp', meta: { special: ['date-updated'], readonly: true }, schema: {} }
  ]
}

const paymentMethods = {
  collection: 'payment_methods',
  meta: { icon: 'credit_card', display_template: '{{ payment_type }} - {{ card_last_four_digits }}', sort: 8 },
  schema: { name: 'payment_methods' },
  fields: [
    { field: 'id', type: 'integer', meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
    { field: 'user_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'payment_type', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Credit Card', value: 'credit_card' }, { text: 'Debit Card', value: 'debit_card' }, { text: 'Bank Transfer', value: 'bank_transfer' }, { text: 'Wallet', value: 'wallet' }] } }, schema: {} },
    { field: 'is_default', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: false } },
    { field: 'card_holder_name', type: 'string', meta: { interface: 'input' }, schema: { max_length: 100 } },
    { field: 'card_last_four_digits', type: 'string', meta: { interface: 'input' }, schema: { max_length: 4 } },
    { field: 'card_expiry_month', type: 'integer', meta: { interface: 'input' }, schema: {} },
    { field: 'card_expiry_year', type: 'integer', meta: { interface: 'input' }, schema: {} },
    { field: 'bank_account_number', type: 'string', meta: { interface: 'input' }, schema: { max_length: 50 } },
    { field: 'bank_name', type: 'string', meta: { interface: 'input' }, schema: { max_length: 100 } },
    { field: 'payment_gateway_token', type: 'string', meta: { interface: 'input' }, schema: { max_length: 255 } },
    { field: 'is_verified', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: false } },
    { field: 'is_active', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: true } },
    { field: 'created_at', type: 'timestamp', meta: { special: ['date-created'], readonly: true }, schema: {} },
    { field: 'updated_at', type: 'timestamp', meta: { special: ['date-updated'], readonly: true }, schema: {} }
  ]
}

function makeRequest(data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data)
    const options = {
      hostname: 'admin.itboy.ir',
      path: '/collections',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer h1YYv7_krvVsEIntDQtFeFqY6fxwDNJ2',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }

    const req = https.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => { body += chunk })
      res.on('end', () => { resolve({ status: res.statusCode, body: body }) })
    })

    req.on('error', (e) => { reject(e) })
    req.write(payload)
    req.end()
  })
}

async function create() {
  const colls = [vehicleProfiles, kycDocuments, paymentMethods]
  for (const coll of colls) {
    try {
      console.log(`Creating ${coll.collection}...`)
      const res = await makeRequest(coll)
      if (res.status === 200 || res.status === 201) {
        console.log(`✓ ${coll.collection}\n`)
      } else {
        console.log(`✗ ${coll.collection}: ${res.status}\n`)
      }
    } catch (err) {
      console.error(`Error: ${err.message}`)
    }
  }
}

create()

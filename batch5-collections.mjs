import https from 'https'

const driverBankAccounts = {
  collection: 'driver_bank_accounts',
  meta: { icon: 'account_balance', display_template: '{{ bank_name }} - {{ account_number_masked }}', sort: 18 },
  schema: { name: 'driver_bank_accounts' },
  fields: [
    { field: 'id', type: 'integer', meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
    { field: 'driver_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'bank_name', type: 'string', meta: { interface: 'input' }, schema: { max_length: 100 } },
    { field: 'account_holder_name', type: 'string', meta: { interface: 'input' }, schema: { max_length: 100 } },
    { field: 'account_number', type: 'string', meta: { interface: 'input', special: ['conceal'] }, schema: { max_length: 50 } },
    { field: 'account_number_masked', type: 'string', meta: { interface: 'input', readonly: true }, schema: { max_length: 50 } },
    { field: 'iban', type: 'string', meta: { interface: 'input' }, schema: { max_length: 34 } },
    { field: 'routing_number', type: 'string', meta: { interface: 'input' }, schema: { max_length: 20 } },
    { field: 'account_type', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Checking', value: 'checking' }, { text: 'Savings', value: 'savings' }, { text: 'Business', value: 'business' }] } }, schema: {} },
    { field: 'is_verified', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: false } },
    { field: 'verification_method', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Micro Deposit', value: 'micro_deposit' }, { text: 'Document', value: 'document' }, { text: 'Auto', value: 'auto' }] } }, schema: {} },
    { field: 'verified_at', type: 'timestamp', meta: { interface: 'datetime' }, schema: {} },
    { field: 'is_primary', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: false } },
    { field: 'is_active', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: true } },
    { field: 'created_at', type: 'timestamp', meta: { special: ['date-created'], readonly: true }, schema: {} },
    { field: 'updated_at', type: 'timestamp', meta: { special: ['date-updated'], readonly: true }, schema: {} }
  ]
}

const payouts = {
  collection: 'payouts',
  meta: { icon: 'trending_up', display_template: 'Payout to {{ driver_bank_accounts.account_holder_name }}', sort: 19 },
  schema: { name: 'payouts' },
  fields: [
    { field: 'id', type: 'integer', meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
    { field: 'driver_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'bank_account_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'amount', type: 'decimal', meta: { interface: 'input' }, schema: { numeric_precision: 12, numeric_scale: 2 } },
    { field: 'currency', type: 'string', meta: { interface: 'input' }, schema: { max_length: 3, default_value: 'OMR' } },
    { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Pending', value: 'PENDING' }, { text: 'Processing', value: 'PROCESSING' }, { text: 'Completed', value: 'COMPLETED' }, { text: 'Failed', value: 'FAILED' }] } }, schema: {} },
    { field: 'payout_period_start', type: 'date', meta: { interface: 'datetime' }, schema: {} },
    { field: 'payout_period_end', type: 'date', meta: { interface: 'datetime' }, schema: {} },
    { field: 'payment_reference', type: 'string', meta: { interface: 'input' }, schema: { max_length: 100, is_unique: true } },
    { field: 'initiated_at', type: 'timestamp', meta: { interface: 'datetime' }, schema: {} },
    { field: 'completed_at', type: 'timestamp', meta: { interface: 'datetime' }, schema: {} },
    { field: 'failure_reason', type: 'text', meta: { interface: 'input-multiline' }, schema: {} },
    { field: 'created_at', type: 'timestamp', meta: { special: ['date-created'], readonly: true }, schema: {} }
  ]
}

const paymentAuthorizations = {
  collection: 'payment_authorizations',
  meta: { icon: 'verified', display_template: 'Auth - {{ payments.payment_reference }}', sort: 20 },
  schema: { name: 'payment_authorizations' },
  fields: [
    { field: 'id', type: 'integer', meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
    { field: 'payment_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'bid_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'authorization_code', type: 'string', meta: { interface: 'input' }, schema: { max_length: 255 } },
    { field: 'authorization_amount', type: 'decimal', meta: { interface: 'input' }, schema: { numeric_precision: 12, numeric_scale: 2 } },
    { field: 'authorized_at', type: 'timestamp', meta: { interface: 'datetime' }, schema: {} },
    { field: 'expires_at', type: 'timestamp', meta: { interface: 'datetime' }, schema: {} },
    { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Authorized', value: 'AUTHORIZED' }, { text: 'Captured', value: 'CAPTURED' }, { text: 'Expired', value: 'EXPIRED' }, { text: 'Failed', value: 'FAILED' }] } }, schema: {} },
    { field: 'created_at', type: 'timestamp', meta: { special: ['date-created'], readonly: true }, schema: {} },
    { field: 'updated_at', type: 'timestamp', meta: { special: ['date-updated'], readonly: true }, schema: {} }
  ]
}

const bidStatistics = {
  collection: 'bid_statistics',
  meta: { icon: 'assessment', display_template: 'Stats - {{ shipments.shipment_reference_number }}', sort: 21 },
  schema: { name: 'bid_statistics' },
  fields: [
    { field: 'id', type: 'integer', meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
    { field: 'shipment_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: { is_unique: true } },
    { field: 'bid_count', type: 'integer', meta: { interface: 'input' }, schema: { default_value: 0 } },
    { field: 'min_price', type: 'decimal', meta: { interface: 'input' }, schema: { numeric_precision: 12, numeric_scale: 2 } },
    { field: 'max_price', type: 'decimal', meta: { interface: 'input' }, schema: { numeric_precision: 12, numeric_scale: 2 } },
    { field: 'avg_price', type: 'decimal', meta: { interface: 'input' }, schema: { numeric_precision: 12, numeric_scale: 2 } },
    { field: 'last_updated_at', type: 'timestamp', meta: { interface: 'datetime' }, schema: {} }
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
  const colls = [driverBankAccounts, payouts, paymentAuthorizations, bidStatistics]
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
  console.log('All collections created successfully!')
}

create()

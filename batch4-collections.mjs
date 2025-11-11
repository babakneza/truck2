import https from 'https'

const payments = {
  collection: 'payments',
  meta: { icon: 'payment', display_template: '{{ payment_reference }} - {{ status }}', sort: 14 },
  schema: { name: 'payments' },
  fields: [
    { field: 'id', type: 'integer', meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
    { field: 'shipment_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'bid_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'shipper_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'driver_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'amount', type: 'decimal', meta: { interface: 'input' }, schema: { numeric_precision: 12, numeric_scale: 2 } },
    { field: 'currency', type: 'string', meta: { interface: 'input' }, schema: { max_length: 3, default_value: 'OMR' } },
    { field: 'payment_reference', type: 'string', meta: { interface: 'input' }, schema: { max_length: 100, is_unique: true } },
    { field: 'payment_provider', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'OmanNet', value: 'omannet' }, { text: 'AmwalPay', value: 'amwalpay' }] } }, schema: {} },
    { field: 'provider_transaction_id', type: 'string', meta: { interface: 'input' }, schema: { max_length: 255 } },
    { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Pending', value: 'PENDING' }, { text: 'Authorized', value: 'AUTHORIZED' }, { text: 'Captured', value: 'CAPTURED' }, { text: 'Failed', value: 'FAILED' }, { text: 'Refunded', value: 'REFUNDED' }] } }, schema: {} },
    { field: 'payment_method_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'authorized_at', type: 'timestamp', meta: { interface: 'datetime' }, schema: {} },
    { field: 'captured_at', type: 'timestamp', meta: { interface: 'datetime' }, schema: {} },
    { field: 'failed_at', type: 'timestamp', meta: { interface: 'datetime' }, schema: {} },
    { field: 'failure_reason', type: 'text', meta: { interface: 'input-multiline' }, schema: {} },
    { field: 'refunded_amount', type: 'decimal', meta: { interface: 'input' }, schema: { numeric_precision: 12, numeric_scale: 2, default_value: 0 } },
    { field: 'created_at', type: 'timestamp', meta: { special: ['date-created'], readonly: true }, schema: {} },
    { field: 'updated_at', type: 'timestamp', meta: { special: ['date-updated'], readonly: true }, schema: {} }
  ]
}

const escrow = {
  collection: 'escrow',
  meta: { icon: 'security', display_template: 'Escrow - {{ payments.payment_reference }}', sort: 15 },
  schema: { name: 'escrow' },
  fields: [
    { field: 'id', type: 'integer', meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
    { field: 'payment_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: { is_unique: true } },
    { field: 'amount_held', type: 'decimal', meta: { interface: 'input' }, schema: { numeric_precision: 12, numeric_scale: 2 } },
    { field: 'reason', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Delivery Pending', value: 'DELIVERY_PENDING' }, { text: 'Dispute', value: 'DISPUTE' }, { text: 'Refund Pending', value: 'REFUND_PENDING' }] } }, schema: {} },
    { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Held', value: 'HELD' }, { text: 'Released', value: 'RELEASED' }, { text: 'Disputed', value: 'DISPUTED' }, { text: 'Refunded', value: 'REFUNDED' }] } }, schema: {} },
    { field: 'held_at', type: 'timestamp', meta: { interface: 'datetime' }, schema: {} },
    { field: 'released_at', type: 'timestamp', meta: { interface: 'datetime' }, schema: {} },
    { field: 'release_reason', type: 'text', meta: { interface: 'input-multiline' }, schema: {} },
    { field: 'created_at', type: 'timestamp', meta: { special: ['date-created'], readonly: true }, schema: {} },
    { field: 'updated_at', type: 'timestamp', meta: { special: ['date-updated'], readonly: true }, schema: {} }
  ]
}

const refunds = {
  collection: 'refunds',
  meta: { icon: 'undo', display_template: 'Refund - {{ payments.payment_reference }}', sort: 16 },
  schema: { name: 'refunds' },
  fields: [
    { field: 'id', type: 'integer', meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
    { field: 'payment_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'refund_amount', type: 'decimal', meta: { interface: 'input' }, schema: { numeric_precision: 12, numeric_scale: 2 } },
    { field: 'reason', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Shipment Cancelled', value: 'SHIPMENT_CANCELLED' }, { text: 'Dispute Resolved', value: 'DISPUTE_RESOLVED' }, { text: 'Payment Failed', value: 'PAYMENT_FAILED' }, { text: 'Other', value: 'OTHER' }] } }, schema: {} },
    { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Pending', value: 'PENDING' }, { text: 'Processing', value: 'PROCESSING' }, { text: 'Completed', value: 'COMPLETED' }, { text: 'Failed', value: 'FAILED' }] } }, schema: {} },
    { field: 'provider_refund_id', type: 'string', meta: { interface: 'input' }, schema: { max_length: 255 } },
    { field: 'initiated_by', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Shipper', value: 'SHIPPER' }, { text: 'Driver', value: 'DRIVER' }, { text: 'Admin', value: 'ADMIN' }, { text: 'System', value: 'SYSTEM' }] } }, schema: {} },
    { field: 'initiated_at', type: 'timestamp', meta: { interface: 'datetime' }, schema: {} },
    { field: 'completed_at', type: 'timestamp', meta: { interface: 'datetime' }, schema: {} },
    { field: 'failure_reason', type: 'text', meta: { interface: 'input-multiline' }, schema: {} },
    { field: 'created_at', type: 'timestamp', meta: { special: ['date-created'], readonly: true }, schema: {} }
  ]
}

const shipmentTracking = {
  collection: 'shipment_tracking',
  meta: { icon: 'pin_drop', display_template: 'Tracking - {{ shipments.shipment_reference_number }}', sort: 17 },
  schema: { name: 'shipment_tracking' },
  fields: [
    { field: 'id', type: 'integer', meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
    { field: 'shipment_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'driver_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'latitude', type: 'decimal', meta: { interface: 'input' }, schema: { numeric_precision: 10, numeric_scale: 8 } },
    { field: 'longitude', type: 'decimal', meta: { interface: 'input' }, schema: { numeric_precision: 11, numeric_scale: 8 } },
    { field: 'accuracy_meters', type: 'decimal', meta: { interface: 'input' }, schema: { numeric_precision: 8, numeric_scale: 2 } },
    { field: 'speed_kmh', type: 'decimal', meta: { interface: 'input' }, schema: { numeric_precision: 6, numeric_scale: 2 } },
    { field: 'heading', type: 'decimal', meta: { interface: 'input' }, schema: { numeric_precision: 5, numeric_scale: 2 } },
    { field: 'altitude_meters', type: 'decimal', meta: { interface: 'input' }, schema: { numeric_precision: 8, numeric_scale: 2 } },
    { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'In Transit', value: 'IN_TRANSIT' }, { text: 'Stopped', value: 'STOPPED' }, { text: 'Arrived', value: 'ARRIVED' }, { text: 'Delivered', value: 'DELIVERED' }] } }, schema: {} },
    { field: 'location_name', type: 'string', meta: { interface: 'input' }, schema: { max_length: 255 } },
    { field: 'timestamp', type: 'timestamp', meta: { interface: 'datetime' }, schema: {} },
    { field: 'created_at', type: 'timestamp', meta: { special: ['date-created'], readonly: true }, schema: {} }
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
  const colls = [payments, escrow, refunds, shipmentTracking]
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

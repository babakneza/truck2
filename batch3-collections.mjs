import https from 'https'

const shipments = {
  collection: 'shipments',
  meta: {
    icon: 'local_shipping',
    display_template: '{{ shipment_reference_number }} - {{ status }}',
    sort: 9
  },
  schema: { name: 'shipments' },
  fields: [
    { field: 'id', type: 'integer', meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
    { field: 'shipment_reference_number', type: 'string', meta: { interface: 'input' }, schema: { max_length: 50, is_unique: true } },
    { field: 'shipper_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'cargo_type', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'General', value: 'general' }, { text: 'Fragile', value: 'fragile' }, { text: 'Hazmat', value: 'hazmat' }, { text: 'Food', value: 'food' }, { text: 'Furniture', value: 'furniture' }, { text: 'Vehicles', value: 'vehicles' }, { text: 'Machinery', value: 'machinery' }] } }, schema: {} },
    { field: 'cargo_description', type: 'text', meta: { interface: 'input-multiline' }, schema: {} },
    { field: 'cargo_weight_kg', type: 'decimal', meta: { interface: 'input' }, schema: { numeric_precision: 12, numeric_scale: 2 } },
    { field: 'cargo_volume_cbm', type: 'decimal', meta: { interface: 'input' }, schema: { numeric_precision: 12, numeric_scale: 2 } },
    { field: 'special_requirements', type: 'text', meta: { interface: 'input-multiline' }, schema: {} },
    { field: 'pickup_location_name', type: 'string', meta: { interface: 'input' }, schema: { max_length: 255 } },
    { field: 'pickup_latitude', type: 'decimal', meta: { interface: 'input' }, schema: { numeric_precision: 10, numeric_scale: 8 } },
    { field: 'pickup_longitude', type: 'decimal', meta: { interface: 'input' }, schema: { numeric_precision: 11, numeric_scale: 8 } },
    { field: 'pickup_date', type: 'date', meta: { interface: 'datetime' }, schema: {} },
    { field: 'pickup_time_start', type: 'time', meta: { interface: 'datetime' }, schema: {} },
    { field: 'pickup_time_end', type: 'time', meta: { interface: 'datetime' }, schema: {} },
    { field: 'delivery_location_name', type: 'string', meta: { interface: 'input' }, schema: { max_length: 255 } },
    { field: 'delivery_latitude', type: 'decimal', meta: { interface: 'input' }, schema: { numeric_precision: 10, numeric_scale: 8 } },
    { field: 'delivery_longitude', type: 'decimal', meta: { interface: 'input' }, schema: { numeric_precision: 11, numeric_scale: 8 } },
    { field: 'delivery_date', type: 'date', meta: { interface: 'datetime' }, schema: {} },
    { field: 'delivery_time_start', type: 'time', meta: { interface: 'datetime' }, schema: {} },
    { field: 'delivery_time_end', type: 'time', meta: { interface: 'datetime' }, schema: {} },
    { field: 'budget_min', type: 'decimal', meta: { interface: 'input' }, schema: { numeric_precision: 12, numeric_scale: 2 } },
    { field: 'budget_max', type: 'decimal', meta: { interface: 'input' }, schema: { numeric_precision: 12, numeric_scale: 2 } },
    { field: 'currency', type: 'string', meta: { interface: 'input' }, schema: { max_length: 3, default_value: 'OMR' } },
    { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Draft', value: 'DRAFT' }, { text: 'Posted', value: 'POSTED' }, { text: 'Active', value: 'ACTIVE' }, { text: 'Bidding Closed', value: 'BIDDING_CLOSED' }, { text: 'Accepted', value: 'ACCEPTED' }, { text: 'In Transit', value: 'IN_TRANSIT' }, { text: 'Delivered', value: 'DELIVERED' }, { text: 'Cancelled', value: 'CANCELLED' }] } }, schema: {} },
    { field: 'accepted_driver_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'accepted_bid_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'bidding_ends_at', type: 'timestamp', meta: { interface: 'datetime' }, schema: {} },
    { field: 'posted_at', type: 'timestamp', meta: { interface: 'datetime' }, schema: {} },
    { field: 'created_at', type: 'timestamp', meta: { special: ['date-created'], readonly: true }, schema: {} },
    { field: 'updated_at', type: 'timestamp', meta: { special: ['date-updated'], readonly: true }, schema: {} }
  ]
}

const bids = {
  collection: 'bids',
  meta: { icon: 'gavel', display_template: 'Bid #{{ id }} by {{ driver_id.first_name }}', sort: 10 },
  schema: { name: 'bids' },
  fields: [
    { field: 'id', type: 'integer', meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
    { field: 'shipment_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'driver_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'vehicle_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'quoted_price', type: 'decimal', meta: { interface: 'input' }, schema: { numeric_precision: 12, numeric_scale: 2 } },
    { field: 'eta_datetime', type: 'timestamp', meta: { interface: 'datetime' }, schema: {} },
    { field: 'duration_hours', type: 'decimal', meta: { interface: 'input' }, schema: { numeric_precision: 8, numeric_scale: 2 } },
    { field: 'fuel_surcharge', type: 'decimal', meta: { interface: 'input' }, schema: { numeric_precision: 12, numeric_scale: 2, default_value: 0 } },
    { field: 'toll_costs', type: 'decimal', meta: { interface: 'input' }, schema: { numeric_precision: 12, numeric_scale: 2, default_value: 0 } },
    { field: 'total_amount', type: 'decimal', meta: { interface: 'input' }, schema: { numeric_precision: 12, numeric_scale: 2 } },
    { field: 'message', type: 'text', meta: { interface: 'input-multiline' }, schema: {} },
    { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Pending', value: 'PENDING' }, { text: 'Updated', value: 'UPDATED' }, { text: 'Accepted', value: 'ACCEPTED' }, { text: 'Rejected', value: 'REJECTED' }, { text: 'Withdrawn', value: 'WITHDRAWN' }, { text: 'Expired', value: 'EXPIRED' }, { text: 'Cancelled', value: 'CANCELLED_AFTER_ACCEPT' }] } }, schema: {} },
    { field: 'bid_expiration', type: 'timestamp', meta: { interface: 'datetime' }, schema: {} },
    { field: 'edit_count', type: 'integer', meta: { interface: 'input' }, schema: { default_value: 0 } },
    { field: 'expires_at', type: 'timestamp', meta: { interface: 'datetime' }, schema: {} },
    { field: 'created_at', type: 'timestamp', meta: { special: ['date-created'], readonly: true }, schema: {} },
    { field: 'updated_at', type: 'timestamp', meta: { special: ['date-updated'], readonly: true }, schema: {} }
  ]
}

const shipmentItems = {
  collection: 'shipment_items',
  meta: { icon: 'list', display_template: '{{ item_description }} ({{ quantity }})', sort: 11 },
  schema: { name: 'shipment_items' },
  fields: [
    { field: 'id', type: 'integer', meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
    { field: 'shipment_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'item_description', type: 'string', meta: { interface: 'input' }, schema: { max_length: 255 } },
    { field: 'quantity', type: 'integer', meta: { interface: 'input' }, schema: { default_value: 1 } },
    { field: 'unit_of_measurement', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Pieces', value: 'pieces' }, { text: 'KG', value: 'kg' }, { text: 'CBM', value: 'cbm' }, { text: 'Pallets', value: 'pallets' }, { text: 'Boxes', value: 'boxes' }] } }, schema: {} },
    { field: 'unit_price', type: 'decimal', meta: { interface: 'input' }, schema: { numeric_precision: 12, numeric_scale: 2 } },
    { field: 'total_price', type: 'decimal', meta: { interface: 'input' }, schema: { numeric_precision: 12, numeric_scale: 2 } },
    { field: 'special_handling', type: 'text', meta: { interface: 'input-multiline' }, schema: {} },
    { field: 'created_at', type: 'timestamp', meta: { special: ['date-created'], readonly: true }, schema: {} },
    { field: 'updated_at', type: 'timestamp', meta: { special: ['date-updated'], readonly: true }, schema: {} }
  ]
}

const bidAttachments = {
  collection: 'bid_attachments',
  meta: { icon: 'attachment', display_template: '{{ file_name }}', sort: 12 },
  schema: { name: 'bid_attachments' },
  fields: [
    { field: 'id', type: 'integer', meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
    { field: 'bid_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'file_url', type: 'string', meta: { interface: 'input' }, schema: { max_length: 500 } },
    { field: 'file_name', type: 'string', meta: { interface: 'input' }, schema: { max_length: 255 } },
    { field: 'file_size', type: 'integer', meta: { interface: 'input' }, schema: {} },
    { field: 'file_type', type: 'string', meta: { interface: 'input' }, schema: { max_length: 50 } },
    { field: 'uploaded_by_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'created_at', type: 'timestamp', meta: { special: ['date-created'], readonly: true }, schema: {} }
  ]
}

const bidEditHistory = {
  collection: 'bid_edit_history',
  meta: { icon: 'history', display_template: 'Edit #{{ id }} - Bid {{ bid_id }}', sort: 13 },
  schema: { name: 'bid_edit_history' },
  fields: [
    { field: 'id', type: 'integer', meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
    { field: 'bid_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'edited_by_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'changes_json', type: 'json', meta: { interface: 'input-code' }, schema: {} },
    { field: 'edit_reason', type: 'string', meta: { interface: 'input' }, schema: { max_length: 255 } },
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
  const colls = [shipments, bids, shipmentItems, bidAttachments, bidEditHistory]
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

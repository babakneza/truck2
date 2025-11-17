import https from 'https'

const galleryField = {
  field: 'gallery',
  type: 'json',
  meta: {
    interface: 'input-code',
    options: {
      language: 'json'
    },
    readonly: false,
    note: 'Stores array of image file objects for shipment cargo gallery'
  },
  schema: {
    name: 'gallery',
    table: 'shipments',
    type: 'json',
    data_type: 'json',
    nullable: true
  }
}

function makeRequest(method, path, data) {
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

async function addGalleryField() {
  try {
    console.log('Deleting existing gallery field if present...')
    
    const deleteRes = await makeRequest('DELETE', '/collections/shipments/fields/gallery')
    console.log('Delete attempt - Status:', deleteRes.status)
    
    console.log('Creating gallery field as JSON type...')
    
    const res = await makeRequest('POST', '/collections/shipments/fields', galleryField)
    
    if (res.status === 200 || res.status === 201) {
      console.log('✓ Gallery field added successfully!')
      console.log('Response:', res.body)
    } else {
      console.log('✗ Failed with status', res.status)
      console.log('Response:', res.body)
    }
  } catch (err) {
    console.error('Error:', err.message)
  }
}

addGalleryField()

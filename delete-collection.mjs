import https from 'https'

const options = {
  hostname: 'admin.itboy.ir',
  path: '/collections/users',
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer h1YYv7_krvVsEIntDQtFeFqY6fxwDNJ2'
  }
}

const req = https.request(options, (res) => {
  console.log('Delete Status:', res.statusCode)
})

req.on('error', (e) => {
  console.error('Error:', e.message)
})

req.end()

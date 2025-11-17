import axios from 'axios'

async function quickTest() {
  console.log('🧪 Quick API Test\n')

  try {
    console.log('Testing login...')
    const response = await axios.post('https://admin.itboy.ir/auth/login', {
      email: 'driver2@itboy.ir',
      password: '123123@'
    }, { timeout: 5000 })

    if (response.status === 200) {
      console.log('✅ Login successful')
      console.log('Access Token:', response.data.data.access_token?.slice(0, 20) + '...')
      console.log('User Info:', {
        id: response.data.data.id,
        email: response.data.data.email
      })
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

quickTest()

import fetch from 'node-fetch'

const API_URL = 'https://admin.itboy.ir'
const ADMIN_TOKEN = 'h1YYv7_krvVsEIntDQtFeFqY6fxwDNJ2'

async function addFieldsToShipperProfiles() {
  try {
    console.log('Adding nationality and id_number fields to shipper_profiles...\n')

    const fields = [
      {
        collection: 'shipper_profiles',
        field: 'nationality',
        type: 'string',
        meta: {
          interface: 'input',
          options: {
            placeholder: 'e.g., Omani, Indian, Pakistani'
          },
          display: 'raw',
          readonly: false,
          hidden: false,
          width: 'half',
          note: 'Shipper nationality'
        },
        schema: {
          name: 'nationality',
          table: 'shipper_profiles',
          data_type: 'varchar',
          max_length: 100,
          is_nullable: true
        }
      },
      {
        collection: 'shipper_profiles',
        field: 'id_number',
        type: 'string',
        meta: {
          interface: 'input',
          options: {
            placeholder: 'National ID / Passport Number'
          },
          display: 'raw',
          readonly: false,
          hidden: false,
          width: 'half',
          note: 'National ID or Passport Number'
        },
        schema: {
          name: 'id_number',
          table: 'shipper_profiles',
          data_type: 'varchar',
          max_length: 100,
          is_nullable: true
        }
      }
    ]

    for (const field of fields) {
      console.log(`Creating field: ${field.field}...`)
      
      const response = await fetch(`${API_URL}/fields/${field.collection}/${field.field}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(field)
      })

      if (response.ok) {
        console.log(`✓ Field ${field.field} created successfully`)
      } else if (response.status === 204) {
        console.log(`✓ Field ${field.field} created successfully (no content)`)
      } else {
        const error = await response.text()
        console.log(`✗ Failed to create field ${field.field}: ${error}`)
      }
    }

    console.log('\n✓ All fields added successfully!')
    
    console.log('\nVerifying fields...')
    const verifyResponse = await fetch(`${API_URL}/fields/shipper_profiles`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    })

    if (verifyResponse.ok) {
      const fieldsData = await verifyResponse.json()
      const addedFields = fieldsData.data.filter(f => 
        f.field === 'nationality' || f.field === 'id_number'
      )
      console.log('\nAdded fields:')
      addedFields.forEach(f => {
        console.log(`  - ${f.field} (${f.type})`)
      })
    }

  } catch (error) {
    console.error('Error:', error.message)
  }
}

addFieldsToShipperProfiles()

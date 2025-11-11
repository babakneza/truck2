import https from 'https'

const conversations = {
  collection: 'conversations',
  meta: {
    icon: 'chat',
    display_template: '{{ participant_names }} - {{ last_message_at }}',
    sort: 22
  },
  schema: { name: 'conversations' },
  fields: [
    { field: 'id', type: 'integer', meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
    { field: 'conversation_id', type: 'string', meta: { interface: 'input' }, schema: { max_length: 36, is_unique: true } },
    { field: 'shipment_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'bid_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'initiator_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'receiver_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'conversation_type', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Shipment', value: 'SHIPMENT' }, { text: 'General', value: 'GENERAL' }, { text: 'Support', value: 'SUPPORT' }] } }, schema: {} },
    { field: 'is_active', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: true } },
    { field: 'total_message_count', type: 'integer', meta: { interface: 'input' }, schema: { default_value: 0 } },
    { field: 'last_message_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'last_message_at', type: 'timestamp', meta: { interface: 'datetime' }, schema: {} },
    { field: 'initiator_archived', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: false } },
    { field: 'receiver_archived', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: false } },
    { field: 'is_closed', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: false } },
    { field: 'closed_reason', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Shipment Completed', value: 'SHIPMENT_COMPLETED' }, { text: 'Manual Close', value: 'MANUAL_CLOSE' }, { text: 'Blocked User', value: 'BLOCKED_USER' }, { text: 'Inactive 30 Days', value: 'INACTIVE_30_DAYS' }] } }, schema: {} },
    { field: 'closed_at', type: 'timestamp', meta: { interface: 'datetime' }, schema: {} },
    { field: 'created_at', type: 'timestamp', meta: { special: ['date-created'], readonly: true }, schema: {} },
    { field: 'updated_at', type: 'timestamp', meta: { special: ['date-updated'], readonly: true }, schema: {} }
  ]
}

const messages = {
  collection: 'messages',
  meta: {
    icon: 'mail',
    display_template: '{{ users.first_name }}: {{ message_text }}',
    sort: 23
  },
  schema: { name: 'messages' },
  fields: [
    { field: 'id', type: 'integer', meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
    { field: 'message_id', type: 'string', meta: { interface: 'input' }, schema: { is_unique: true } },
    { field: 'conversation_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'sender_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'message_text', type: 'text', meta: { interface: 'input-multiline' }, schema: { max_length: 5000 } },
    { field: 'message_type', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Text', value: 'TEXT' }, { text: 'Image', value: 'IMAGE' }, { text: 'File', value: 'FILE' }, { text: 'Location', value: 'LOCATION' }, { text: 'System', value: 'SYSTEM' }] } }, schema: {} },
    { field: 'system_message_type', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'User Joined', value: 'USER_JOINED' }, { text: 'User Left', value: 'USER_LEFT' }, { text: 'Conversation Created', value: 'CONVERSATION_CREATED' }, { text: 'Shipment Accepted', value: 'SHIPMENT_ACCEPTED' }, { text: 'Delivery Completed', value: 'DELIVERY_COMPLETED' }] } }, schema: {} },
    { field: 'edited_at', type: 'timestamp', meta: { interface: 'datetime' }, schema: {} },
    { field: 'edit_count', type: 'integer', meta: { interface: 'input' }, schema: { default_value: 0 } },
    { field: 'edit_history', type: 'json', meta: { interface: 'input-rich-text-html' }, schema: {} },
    { field: 'is_deleted', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: false } },
    { field: 'deleted_reason', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'User Request', value: 'USER_REQUEST' }, { text: 'Moderation', value: 'MODERATION' }, { text: 'Abuse', value: 'ABUSE' }, { text: 'Spam', value: 'SPAM' }] } }, schema: {} },
    { field: 'deleted_by_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'deleted_at', type: 'timestamp', meta: { interface: 'datetime' }, schema: {} },
    { field: 'reaction_count', type: 'integer', meta: { interface: 'input' }, schema: { default_value: 0 } },
    { field: 'has_attachments', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: false } },
    { field: 'attachment_count', type: 'integer', meta: { interface: 'input' }, schema: { default_value: 0 } },
    { field: 'metadata', type: 'json', meta: { interface: 'input-rich-text-html' }, schema: {} },
    { field: 'created_at', type: 'timestamp', meta: { special: ['date-created'], readonly: true }, schema: {} },
    { field: 'updated_at', type: 'timestamp', meta: { special: ['date-updated'], readonly: true }, schema: {} }
  ]
}

const messageReads = {
  collection: 'message_reads',
  meta: {
    icon: 'done_all',
    display_template: '{{ messages.sender.first_name }} to {{ users.first_name }}',
    sort: 24
  },
  schema: { name: 'message_reads' },
  fields: [
    { field: 'id', type: 'integer', meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
    { field: 'message_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'conversation_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'reader_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Sent', value: 'SENT' }, { text: 'Delivered', value: 'DELIVERED' }, { text: 'Read', value: 'READ' }] } }, schema: {} },
    { field: 'delivered_at', type: 'timestamp', meta: { interface: 'datetime' }, schema: {} },
    { field: 'read_at', type: 'timestamp', meta: { interface: 'datetime' }, schema: {} },
    { field: 'created_at', type: 'timestamp', meta: { special: ['date-created'], readonly: true }, schema: {} }
  ]
}

const messageAttachments = {
  collection: 'message_attachments',
  meta: {
    icon: 'attachment',
    display_template: '{{ file_name }}',
    sort: 25
  },
  schema: { name: 'message_attachments' },
  fields: [
    { field: 'id', type: 'integer', meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
    { field: 'message_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'file_name', type: 'string', meta: { interface: 'input' }, schema: { max_length: 255 } },
    { field: 'file_url', type: 'string', meta: { interface: 'input' }, schema: { max_length: 500 } },
    { field: 'file_size', type: 'integer', meta: { interface: 'input' }, schema: {} },
    { field: 'file_type', type: 'string', meta: { interface: 'input' }, schema: { max_length: 50 } },
    { field: 'file_extension', type: 'string', meta: { interface: 'input' }, schema: { max_length: 10 } },
    { field: 'thumbnail_url', type: 'string', meta: { interface: 'input' }, schema: { max_length: 500 } },
    { field: 'category', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Image', value: 'IMAGE' }, { text: 'Document', value: 'DOCUMENT' }, { text: 'Video', value: 'VIDEO' }, { text: 'Audio', value: 'AUDIO' }, { text: 'Other', value: 'OTHER' }] } }, schema: {} },
    { field: 'uploaded_by_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'scanned_for_virus', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: false } },
    { field: 'is_safe', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: true } },
    { field: 'download_count', type: 'integer', meta: { interface: 'input' }, schema: { default_value: 0 } },
    { field: 'created_at', type: 'timestamp', meta: { special: ['date-created'], readonly: true }, schema: {} }
  ]
}

const messageReactions = {
  collection: 'message_reactions',
  meta: {
    icon: 'emotion',
    display_template: '{{ reaction_emoji }} by {{ users.first_name }}',
    sort: 26
  },
  schema: { name: 'message_reactions' },
  fields: [
    { field: 'id', type: 'integer', meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
    { field: 'message_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'user_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'reaction_emoji', type: 'string', meta: { interface: 'input' }, schema: { max_length: 10 } },
    { field: 'reaction_type', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Like', value: 'LIKE' }, { text: 'Love', value: 'LOVE' }, { text: 'Laugh', value: 'LAUGH' }, { text: 'Sad', value: 'SAD' }, { text: 'Angry', value: 'ANGRY' }, { text: 'Wow', value: 'WOW' }, { text: 'Custom', value: 'CUSTOM' }] } }, schema: {} },
    { field: 'created_at', type: 'timestamp', meta: { special: ['date-created'], readonly: true }, schema: {} }
  ]
}

const chatParticipants = {
  collection: 'chat_participants',
  meta: {
    icon: 'group',
    display_template: '{{ users.first_name }} in conversation',
    sort: 27
  },
  schema: { name: 'chat_participants' },
  fields: [
    { field: 'id', type: 'integer', meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
    { field: 'conversation_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'user_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'role', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Initiator', value: 'INITIATOR' }, { text: 'Receiver', value: 'RECEIVER' }, { text: 'Admin', value: 'ADMIN' }] } }, schema: {} },
    { field: 'unread_count', type: 'integer', meta: { interface: 'input' }, schema: { default_value: 0 } },
    { field: 'is_muted', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: false } },
    { field: 'muted_until', type: 'timestamp', meta: { interface: 'datetime' }, schema: {} },
    { field: 'is_blocked', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: false } },
    { field: 'blocked_at', type: 'timestamp', meta: { interface: 'datetime' }, schema: {} },
    { field: 'last_read_message_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'last_read_at', type: 'timestamp', meta: { interface: 'datetime' }, schema: {} },
    { field: 'joined_at', type: 'timestamp', meta: { special: ['date-created'], readonly: true }, schema: {} },
    { field: 'left_at', type: 'timestamp', meta: { interface: 'datetime' }, schema: {} },
    { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Active', value: 'ACTIVE' }, { text: 'Inactive', value: 'INACTIVE' }, { text: 'Archived', value: 'ARCHIVED' }, { text: 'Blocked', value: 'BLOCKED' }] } }, schema: {} }
  ]
}

const typingIndicators = {
  collection: 'typing_indicators',
  meta: {
    icon: 'edit',
    display_template: '{{ users.first_name }} is typing...',
    sort: 28
  },
  schema: { name: 'typing_indicators' },
  fields: [
    { field: 'id', type: 'integer', meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
    { field: 'conversation_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'user_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'started_at', type: 'timestamp', meta: { special: ['date-created'], readonly: true }, schema: {} },
    { field: 'expires_at', type: 'timestamp', meta: { interface: 'datetime' }, schema: {} }
  ]
}

const conversationSettings = {
  collection: 'conversation_settings',
  meta: {
    icon: 'settings',
    display_template: 'Settings for {{ users.first_name }}',
    sort: 29
  },
  schema: { name: 'conversation_settings' },
  fields: [
    { field: 'id', type: 'integer', meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
    { field: 'conversation_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'user_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'color_tag', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Red', value: 'RED' }, { text: 'Orange', value: 'ORANGE' }, { text: 'Yellow', value: 'YELLOW' }, { text: 'Green', value: 'GREEN' }, { text: 'Blue', value: 'BLUE' }, { text: 'Purple', value: 'PURPLE' }] } }, schema: {} },
    { field: 'is_starred', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: false } },
    { field: 'notifications_enabled', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: true } },
    { field: 'notification_type', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'All', value: 'ALL' }, { text: 'Mentions Only', value: 'MENTIONS_ONLY' }, { text: 'None', value: 'NONE' }] } }, schema: {} },
    { field: 'desktop_notifications', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: true } },
    { field: 'mobile_notifications', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: true } },
    { field: 'sound_enabled', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: true } },
    { field: 'show_read_receipts', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: true } },
    { field: 'custom_label', type: 'string', meta: { interface: 'input' }, schema: { max_length: 100 } },
    { field: 'created_at', type: 'timestamp', meta: { special: ['date-created'], readonly: true }, schema: {} },
    { field: 'updated_at', type: 'timestamp', meta: { special: ['date-updated'], readonly: true }, schema: {} }
  ]
}

const chatNotifications = {
  collection: 'chat_notifications',
  meta: {
    icon: 'notifications',
    display_template: '{{ users.first_name }} - {{ notification_type }}',
    sort: 30
  },
  schema: { name: 'chat_notifications' },
  fields: [
    { field: 'id', type: 'integer', meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
    { field: 'conversation_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'message_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'recipient_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'sender_id', type: 'integer', meta: { interface: 'many-to-one', special: ['m2o'] }, schema: {} },
    { field: 'notification_type', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Message', value: 'MESSAGE' }, { text: 'Mention', value: 'MENTION' }, { text: 'System', value: 'SYSTEM' }] } }, schema: {} },
    { field: 'title', type: 'string', meta: { interface: 'input' }, schema: { max_length: 100 } },
    { field: 'body', type: 'text', meta: { interface: 'input-multiline' }, schema: { max_length: 500 } },
    { field: 'is_sent', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: false } },
    { field: 'is_read', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: false } },
    { field: 'sent_at', type: 'timestamp', meta: { interface: 'datetime' }, schema: {} },
    { field: 'read_at', type: 'timestamp', meta: { interface: 'datetime' }, schema: {} },
    { field: 'device_tokens', type: 'json', meta: { interface: 'input-rich-text-html' }, schema: {} },
    { field: 'delivery_status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Pending', value: 'PENDING' }, { text: 'Sent', value: 'SENT' }, { text: 'Failed', value: 'FAILED' }, { text: 'Bounced', value: 'BOUNCED' }] } }, schema: {} },
    { field: 'error_message', type: 'text', meta: { interface: 'input-multiline' }, schema: { max_length: 500 } },
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
  const colls = [
    conversations,
    messages,
    messageReads,
    messageAttachments,
    messageReactions,
    chatParticipants,
    typingIndicators,
    conversationSettings,
    chatNotifications
  ]

  console.log('Starting chat collections creation...\n')

  for (const coll of colls) {
    try {
      console.log(`Creating ${coll.collection}...`)
      const res = await makeRequest(coll)
      if (res.status === 200 || res.status === 201) {
        console.log(`✓ ${coll.collection} created successfully\n`)
      } else {
        console.log(`✗ ${coll.collection}: ${res.status}`)
        console.log(`Response: ${res.body}\n`)
      }
    } catch (err) {
      console.error(`Error creating ${coll.collection}: ${err.message}\n`)
    }
  }
  console.log('Chat collections creation complete!')
}

create()

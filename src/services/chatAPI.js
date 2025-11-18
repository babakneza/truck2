import { ensureTokenValid } from './directusAuth'

const isDev = import.meta.env.DEV

const getAPIURL = () => {
  if (isDev) {
    if (typeof window !== 'undefined' && window.location) {
      return `${window.location.origin}/api`
    }
    return 'http://localhost:5174/api'
  }
  return 'https://admin.itboy.ir'
}

const getAPIURLMemoized = () => {
  return getAPIURL()
}

const getHeaders = async () => {
  const tokenResult = await ensureTokenValid()
  const token = tokenResult.success ? tokenResult.access_token : localStorage.getItem('auth_token')
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}

const normalizeMessage = (message) => {
  const senderId = message.sender_id
  const content = message.message_text

  if (!content || !content.toString().trim()) {
    return null
  }

  if (!senderId) {
    console.warn('Message missing sender ID:', { id: message.id, message })
    return null
  }

  return {
    ...message,
    sender_id: senderId,
    content: content,
    user_id: senderId
  }
}

const makeRequest = async (method, endpoint, body = null) => {
  const options = {
    method,
    headers: await getHeaders()
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  const API_URL = getAPIURLMemoized()
  console.log(`🔗 ${method} ${API_URL}${endpoint}`)
  const response = await fetch(`${API_URL}${endpoint}`, options)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    console.error(`❌ API Error: ${response.status}`, error)
    throw new Error(error.errors?.[0]?.message || `API Error: ${response.statusText}`)
  }

  return response.json()
}

export const chatAPI = {
  users: {
    getUser: async (userId) => {
      try {
        const customParams = new URLSearchParams()
        customParams.append('filter', JSON.stringify({ user_id: { _eq: userId } }))
        customParams.append('fields', 'user_id,profile_photo.*')
        const customUserData = await makeRequest('GET', `/items/users?${customParams}`)
        const customUser = customUserData.data?.[0]

        const directusParams = new URLSearchParams()
        directusParams.append('filter', JSON.stringify({ id: { _eq: userId } }))
        directusParams.append('fields', 'id,first_name,last_name,email')
        const directusData = await makeRequest('GET', `/users?${directusParams}`)
        const directusUser = directusData.data?.[0]

        return {
          ...directusUser,
          profile_photo: customUser?.profile_photo || null
        }
      } catch (err) {
        console.warn(`Failed to fetch user ${userId}:`, err)
        return null
      }
    },

    getAvailableDrivers: async () => {
      try {
        const currentUserId = localStorage.getItem('user_id')
        
        const directusParams = new URLSearchParams()
        directusParams.append('filter', JSON.stringify({
          _and: [
            { id: { _neq: currentUserId } }
          ]
        }))
        directusParams.append('fields', 'id,first_name,last_name,email')
        directusParams.append('limit', 100)
        
        const directusData = await makeRequest('GET', `/users?${directusParams}`)
        const directusUsers = directusData.data || []
        
        const enrichedDrivers = await Promise.all(
          directusUsers.map(async (user) => {
            try {
              const customParams = new URLSearchParams()
              customParams.append('filter', JSON.stringify({ user_id: { _eq: user.id } }))
              customParams.append('fields', 'user_id,profile_photo.*')
              const customUserData = await makeRequest('GET', `/items/users?${customParams}`)
              const customUser = customUserData.data?.[0]
              
              return {
                id: user.id,
                email: user.email,
                name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                profile_photo: customUser?.profile_photo || null
              }
            } catch (err) {
              console.warn(`Failed to enrich user ${user.id}:`, err)
              return {
                id: user.id,
                email: user.email,
                name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                profile_photo: null
              }
            }
          })
        )
        
        return enrichedDrivers
      } catch (err) {
        console.error('Failed to fetch available drivers:', err)
        return []
      }
    }
  },

  conversations: {
    list: async (filters = {}) => {
      const userId = localStorage.getItem('user_id')
      const params = new URLSearchParams()
      params.append('filter', JSON.stringify(filters))
      params.append('fields', 'id,conversation_id,shipment_id,bid_id,initiator_id,receiver_id,conversation_type,is_active,total_message_count,last_message_id,last_message_at,initiator_archived,receiver_archived,is_closed,created_at,updated_at')
      params.append('sort', '-last_message_at')
      params.append('limit', 50)

      console.log(`📡 API call: /items/conversations?${params}`)
      const data = await makeRequest('GET', `/items/conversations?${params}`)
      console.log(`📡 Response data length:`, data.data?.length || 0)

      const conversations = data.data || []
      console.log(`📋 Starting enrichment for ${conversations.length} conversations`)
      const enrichedConversations = await Promise.all(conversations.map(async (conv) => {
        const otherUserId = conv.receiver_id === userId ? conv.initiator_id : conv.receiver_id
        console.log(`🔄 Enriching conversation ${conv.id}, total_message_count: ${conv.total_message_count}`)

        try {
          const directusParams = new URLSearchParams()
          directusParams.append('filter', JSON.stringify({ id: { _eq: otherUserId } }))
          directusParams.append('fields', 'id,first_name,last_name,email')
          const directusData = await makeRequest('GET', `/users?${directusParams}`)
          const directusUser = directusData.data?.[0]

          const customParams = new URLSearchParams()
          customParams.append('filter', JSON.stringify({ user_id: { _eq: otherUserId } }))
          customParams.append('fields', 'user_id,profile_photo.*')
          const customData = await makeRequest('GET', `/items/users?${customParams}`)
          const customUser = customData.data?.[0]

          console.log(`🔍 Enriching user ${otherUserId}:`, { directusUser, customUser })

          const userName = directusUser ? `${directusUser.first_name || ''} ${directusUser.last_name || ''}`.trim() || directusUser.email : `User ${otherUserId}`
          let userAvatar = customUser?.profile_photo || null

          if (userAvatar) {
            const baseURL = getAPIURLMemoized()
            if (typeof userAvatar === 'object' && userAvatar.id) {
              userAvatar = `${baseURL}/assets/${userAvatar.id}`
            } else if (typeof userAvatar === 'string') {
              if (!userAvatar.includes('http') && !userAvatar.startsWith(`${baseURL}`)) {
                userAvatar = `${baseURL}/assets/${userAvatar}`
              }
            }
          }

          let lastMessagePreview = 'No messages yet'
          let formattedLastMessageTime = conv.created_at

          console.log(`📊 Conversation ${conv.id}:`, {
            total_message_count: conv.total_message_count,
            last_message_at: conv.last_message_at,
            last_message_id: conv.last_message_id
          })

          if (conv.total_message_count > 0 && conv.last_message_id) {
            try {
              const msgParams = new URLSearchParams()
              msgParams.append('filter', JSON.stringify({ id: { _eq: conv.last_message_id } }))
              msgParams.append('fields', 'id,message_text,created_at')
              const msgData = await makeRequest('GET', `/items/messages?${msgParams}`)
              const lastMsg = msgData.data?.[0]
              if (lastMsg && lastMsg.message_text) {
                lastMessagePreview = lastMsg.message_text.substring(0, 50)
                formattedLastMessageTime = lastMsg.created_at || conv.last_message_at
                console.log(`✅ Found last message: "${lastMessagePreview}"`)
              } else {
                console.warn(`❌ No message text for last_message_id ${conv.last_message_id}`)
                if (conv.last_message_at) formattedLastMessageTime = conv.last_message_at
              }
            } catch (err) {
              console.warn(`Failed to fetch message ${conv.last_message_id}:`, err.message)
              if (conv.last_message_at) formattedLastMessageTime = conv.last_message_at
            }
          } else if (conv.last_message_at) {
            formattedLastMessageTime = conv.last_message_at
          }

          return {
            ...conv,
            otherUserId,
            otherUserName: userName,
            otherUserProfilePhoto: userAvatar,
            last_message_preview: lastMessagePreview,
            last_message_display_time: formattedLastMessageTime
          }
        } catch (err) {
          console.error(`❌ ENRICHMENT FAILED for conversation ${conv.id} (user ${otherUserId}):`, err.message, err)
          return {
            ...conv,
            otherUserId,
            otherUserName: `User ${otherUserId}`,
            otherUserProfilePhoto: null,
            last_message_preview: 'No messages yet',
            last_message_display_time: conv.created_at,
            enrichmentError: err.message
          }
        }
      }))

      console.log(`✅ Enrichment complete. Result:`, enrichedConversations.map(c => ({
        id: c.id,
        total_message_count: c.total_message_count,
        otherUserName: c.otherUserName,
        error: c.enrichmentError
      })))
      return enrichedConversations
    },

    create: async (conversationData) => {
      const data = await makeRequest('POST', '/items/conversations', conversationData)
      return data.data
    },

    update: async (id, updates) => {
      const data = await makeRequest('PATCH', `/items/conversations/${id}`, updates)
      return data.data
    },

    delete: async (id) => {
      await makeRequest('DELETE', `/items/conversations/${id}`)
    },

    archive: async (id, userRole) => {
      const updateData = userRole === 'initiator'
        ? { initiator_archived: true }
        : { receiver_archived: true }
      return this.update(id, updateData)
    },

    updateMessageCount: async (conversationId, lastMessageId) => {
      try {
        const params = new URLSearchParams()
        params.append('filter', JSON.stringify({ id: { _eq: conversationId } }))
        params.append('fields', 'id,total_message_count')
        
        const conversationData = await makeRequest('GET', `/items/conversations?${params}`)
        const conversation = conversationData.data?.[0]
        
        if (!conversation) {
          console.warn(`Conversation ${conversationId} not found`)
          return null
        }
        
        const newTotalCount = (conversation.total_message_count || 0) + 1
        const updateData = {
          total_message_count: newTotalCount,
          last_message_id: lastMessageId,
          last_message_at: new Date().toISOString()
        }
        
        return this.update(conversationId, updateData)
      } catch (err) {
        console.error(`Failed to update message count for conversation ${conversationId}:`, err)
        return null
      }
    },

    decrementMessageCount: async (conversationId, deletedMessageId) => {
      try {
        const params = new URLSearchParams()
        params.append('filter', JSON.stringify({ id: { _eq: conversationId } }))
        params.append('fields', 'id,total_message_count,last_message_id')
        
        const conversationData = await makeRequest('GET', `/items/conversations?${params}`)
        const conversation = conversationData.data?.[0]
        
        if (!conversation) {
          console.warn(`Conversation ${conversationId} not found`)
          return null
        }
        
        const newTotalCount = Math.max((conversation.total_message_count || 1) - 1, 0)
        const updateData = {
          total_message_count: newTotalCount
        }
        
        if (conversation.last_message_id === deletedMessageId) {
          if (newTotalCount > 0) {
            const msgParams = new URLSearchParams()
            msgParams.append('filter', JSON.stringify({ 
              _and: [
                { conversation_id: { _eq: conversationId } },
                { id: { _neq: deletedMessageId } }
              ]
            }))
            msgParams.append('fields', 'id,created_at')
            msgParams.append('sort', '-created_at')
            msgParams.append('limit', 1)
            
            const messagesData = await makeRequest('GET', `/items/messages?${msgParams}`)
            const lastMessage = messagesData.data?.[0]
            
            if (lastMessage) {
              updateData.last_message_id = lastMessage.id
              updateData.last_message_at = lastMessage.created_at
            }
          } else {
            updateData.last_message_id = null
            updateData.last_message_at = null
          }
        }
        
        return this.update(conversationId, updateData)
      } catch (err) {
        console.error(`Failed to decrement message count for conversation ${conversationId}:`, err)
        return null
      }
    }
  },

  messages: {
    list: async (conversationId, limit = 30, offset = 0) => {
      const filters = { conversation_id: { _eq: conversationId } }
      const params = new URLSearchParams()
      params.append('filter', JSON.stringify(filters))
      params.append('fields', 'id,message_id,conversation_id,sender_id,message_text,message_type,edited_at,edit_count,is_deleted,deleted_at,reaction_count,created_at,updated_at')
      params.append('sort', 'created_at')
      params.append('limit', limit)
      params.append('offset', offset)

      const data = await makeRequest('GET', `/items/messages?${params}`)
      const messages = data.data || []

      const normalizedMessages = messages
        .map(msg => normalizeMessage(msg))
        .filter(msg => msg !== null)

      try {
        const currentUserId = localStorage.getItem('user_id')
        const messageReads = await chatAPI.messageReads.getForConversation(conversationId)

        return normalizedMessages.map(msg => {
          const msgReadRecords = messageReads.filter(r => r.message_id === msg.id)
          if (!msgReadRecords.length) return msg

          const isSentByUs = msg.sender_id === currentUserId

          if (isSentByUs) {
            const allRead = msgReadRecords.every(r => r.status === 'READ')
            return { ...msg, status: allRead ? 'READ' : 'DELIVERED' }
          } else {
            const ourRecord = msgReadRecords.find(r => r.reader_id === currentUserId)
            if (ourRecord) {
              return { ...msg, status: ourRecord.status, delivered_at: ourRecord.delivered_at, read_at: ourRecord.read_at }
            }
            return msg
          }
        })
      } catch (error) {
        console.error('Failed to merge read status:', error)
        return normalizedMessages
      }
    },

    send: async (conversationId, messageText) => {
      const userId = localStorage.getItem('user_id')
      const messageData = {
        conversation_id: conversationId,
        message_text: messageText,
        sender_id: userId
      }

      const data = await makeRequest('POST', '/items/messages', messageData)
      const normalized = normalizeMessage(data.data)
      if (!normalized) {
        throw new Error('Failed to normalize sent message')
      }

      try {
        const params = new URLSearchParams()
        params.append('filter', JSON.stringify({ id: { _eq: conversationId } }))
        params.append('fields', 'id,total_message_count')
        
        const conversationData = await makeRequest('GET', `/items/conversations?${params}`)
        const conversation = conversationData.data?.[0]
        
        if (conversation) {
          const newTotalCount = (conversation.total_message_count || 0) + 1
          const updateData = {
            total_message_count: newTotalCount,
            last_message_id: normalized.id,
            last_message_at: new Date().toISOString()
          }
          
          await makeRequest('PATCH', `/items/conversations/${conversationId}`, updateData)
          console.log(`✅ Updated conversation ${conversationId}: count=${newTotalCount}, last_message_id=${normalized.id}`)
        }
      } catch (err) {
        console.error(`Failed to update conversation after message send:`, err)
      }
      
      return normalized
    },

    edit: async (id, newText) => {
      const data = await makeRequest('PATCH', `/items/messages/${id}`, {
        message_text: newText
      })
      return normalizeMessage(data.data)
    },

    delete: async (id, conversationId = null) => {
      try {
        let convId = conversationId
        
        if (!convId) {
          const msgParams = new URLSearchParams()
          msgParams.append('filter', JSON.stringify({ id: { _eq: id } }))
          msgParams.append('fields', 'id,conversation_id')
          const msgData = await makeRequest('GET', `/items/messages?${msgParams}`)
          const message = msgData.data?.[0]
          if (message) {
            convId = message.conversation_id
          }
        }
        
        await makeRequest('DELETE', `/items/messages/${id}`)
        
        if (convId) {
          try {
            const params = new URLSearchParams()
            params.append('filter', JSON.stringify({ id: { _eq: convId } }))
            params.append('fields', 'id,total_message_count,last_message_id')
            
            const conversationData = await makeRequest('GET', `/items/conversations?${params}`)
            const conversation = conversationData.data?.[0]
            
            if (conversation) {
              const newTotalCount = Math.max((conversation.total_message_count || 1) - 1, 0)
              const updateData = {
                total_message_count: newTotalCount
              }
              
              if (conversation.last_message_id === id) {
                if (newTotalCount > 0) {
                  const msgParams = new URLSearchParams()
                  msgParams.append('filter', JSON.stringify({ 
                    _and: [
                      { conversation_id: { _eq: convId } },
                      { id: { _neq: id } }
                    ]
                  }))
                  msgParams.append('fields', 'id,created_at')
                  msgParams.append('sort', '-created_at')
                  msgParams.append('limit', 1)
                  
                  const messagesData = await makeRequest('GET', `/items/messages?${msgParams}`)
                  const lastMessage = messagesData.data?.[0]
                  
                  if (lastMessage) {
                    updateData.last_message_id = lastMessage.id
                    updateData.last_message_at = lastMessage.created_at
                  }
                } else {
                  updateData.last_message_id = null
                  updateData.last_message_at = null
                }
              }
              
              await makeRequest('PATCH', `/items/conversations/${convId}`, updateData)
              console.log(`✅ Updated conversation after message delete: count=${newTotalCount}`)
            }
          } catch (err) {
            console.error(`Failed to update conversation after message delete:`, err)
          }
        }
      } catch (err) {
        console.error(`Failed to delete message ${id}:`, err)
        throw err
      }
    },

    pin: async () => {
      console.warn('Pin functionality not yet implemented')
    },

    unpin: async () => {
      console.warn('Unpin functionality not yet implemented')
    }
  },

  messageReads: {
    getForMessage: async (messageId, conversationId = null) => {
      const filters = { message_id: { _eq: messageId } }
      if (conversationId) {
        filters.id = { _eq: conversationId }
      }
      const params = new URLSearchParams()
      params.append('filter', JSON.stringify(filters))
      params.append('fields', 'id,message_id,conversation_id,reader_id,status,delivered_at,read_at,created_at')

      const data = await makeRequest('GET', `/items/message_reads?${params}`)
      return data.data || []
    },

    markAsDelivered: async (messageId, conversationId = null) => {
      const userId = localStorage.getItem('user_id')

      try {
        // Check if a record already exists for this message and reader
        const existingReads = await chatAPI.messageReads.getForMessage(messageId)
        const existingRecord = existingReads.find(r => r.reader_id === userId)

        if (existingRecord) {
          // Record already exists, don't create duplicate
          console.log(`ℹ️ Message read record already exists (status=${existingRecord.status})`)
          return existingRecord
        }

        // Create new DELIVERED record
        const deliveredAt = new Date().toISOString()
        const readData = {
          message_id: messageId,
          reader_id: userId,
          status: 'DELIVERED',
          delivered_at: deliveredAt
        }

        const data = await makeRequest('POST', '/items/message_reads', readData)
        console.log(`✅ Created message_reads record with DELIVERED status`)
        
        if (conversationId) {
          const socket = (await import('./chatSocket')).default
          socket.markMessageAsDelivered(conversationId, messageId, deliveredAt)
        }
        
        return data.data
      } catch (error) {
        console.error('❌ Error in markAsDelivered:', error)
        throw error
      }
    },

    markAsRead: async (messageId, conversationId = null) => {
      const userId = localStorage.getItem('user_id')

      try {
        // First, check if a DELIVERED record already exists
        const existingReads = await chatAPI.messageReads.getForMessage(messageId)
        const existingRecord = existingReads.find(
          r => r.reader_id === userId && r.status === 'DELIVERED'
        )

        const readAt = new Date().toISOString()

        if (existingRecord) {
          // Update existing DELIVERED record to READ
          const updateData = {
            status: 'READ',
            read_at: readAt
          }
          const data = await makeRequest('PATCH', `/items/message_reads/${existingRecord.id}`, updateData)
          console.log(`✅ Updated message_reads record ${existingRecord.id} to READ`)
          
          if (conversationId) {
            const socket = (await import('./chatSocket')).default
            socket.markMessageAsRead(conversationId, messageId, readAt)
          }
          
          return data.data
        } else {
          // No DELIVERED record exists, create new READ record
          const readData = {
            message_id: messageId,
            reader_id: userId,
            status: 'READ',
            delivered_at: readAt,
            read_at: readAt
          }
          const data = await makeRequest('POST', '/items/message_reads', readData)
          console.log(`✅ Created new message_reads record with READ status`)
          
          if (conversationId) {
            const socket = (await import('./chatSocket')).default
            socket.markMessageAsRead(conversationId, messageId, readAt)
          }
          
          return data.data
        }
      } catch (error) {
        console.error('❌ Error in markAsRead:', error)
        throw error
      }
    },

    getForConversation: async (conversationId) => {
      try {
        const filters = { conversation_id: { _eq: conversationId } }
        const params = new URLSearchParams()
        params.append('filter', JSON.stringify(filters))
        params.append('fields', 'id,message_id,conversation_id,reader_id,status,delivered_at,read_at,created_at')
        const data = await makeRequest('GET', `/items/message_reads?${params}`)
        return data.data || []
      } catch (error) {
        console.error('Failed to fetch message_reads for conversation:', error)
        return []
      }
    },

    list: async () => {
      console.warn('Message reads list functionality not yet implemented')
      return []
    }
  },

  attachments: {
    upload: async (file) => {
      const formData = new FormData()
      formData.append('file', file)

      const tokenResult = await ensureTokenValid()
      const token = tokenResult.success ? tokenResult.access_token : localStorage.getItem('auth_token')
      const baseURL = getAPIURLMemoized()
      const response = await fetch(`${baseURL}/files`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      if (!response.ok) {
        throw new Error('File upload failed')
      }

      return response.json()
    },

    linkToMessage: async (messageId, fileId, fileName, fileType, fileSize) => {
      const attachmentData = {
        message_id: messageId,
        file_id: fileId,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        is_virus_scanned: true,
        virus_scan_result: 'CLEAN'
      }

      const data = await makeRequest('POST', '/items/message_attachments', attachmentData)
      return data.data
    },

    list: async (messageId) => {
      const filters = { message_id: { _eq: messageId } }
      const params = new URLSearchParams()
      params.append('filter', JSON.stringify(filters))
      params.append('fields', 'id,message_id,file_name,file_type,file_size,file_url,thumbnail_url,created_at')

      const data = await makeRequest('GET', `/items/message_attachments?${params}`)
      return data.data || []
    },

    delete: async (id) => {
      await makeRequest('DELETE', `/items/message_attachments/${id}`)
    }
  },

  reactions: {
    add: async (messageId, emoji) => {
      const reactionData = {
        message_id: messageId,
        user_id: localStorage.getItem('user_id'),
        reaction_emoji: emoji,
        created_at: new Date().toISOString()
      }

      const data = await makeRequest('POST', '/items/message_reactions', reactionData)
      return data.data
    },

    remove: async (id) => {
      await makeRequest('DELETE', `/items/message_reactions/${id}`)
    },

    list: async (messageId) => {
      const filters = { message_id: { _eq: messageId } }
      const params = new URLSearchParams()
      params.append('filter', JSON.stringify(filters))
      params.append('fields', 'id,message_id,user_id,reaction_emoji,created_at')

      const data = await makeRequest('GET', `/items/message_reactions?${params}`)
      return data.data || []
    }
  },

  typingIndicators: {
    start: async (conversationId) => {
      const expiresAt = new Date()
      expiresAt.setSeconds(expiresAt.getSeconds() + 5)

      const indicatorData = {
        conversation_id: conversationId,
        user_id: localStorage.getItem('user_id'),
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString()
      }

      const data = await makeRequest('POST', '/items/typing_indicators', indicatorData)
      return data.data
    },

    stop: async (conversationId) => {
      const userId = localStorage.getItem('user_id')
      const filters = { conversation_id: { _eq: conversationId }, user_id: { _eq: userId } }
      const params = new URLSearchParams()
      params.append('filter', JSON.stringify(filters))

      const data = await makeRequest('GET', `/items/typing_indicators?${params}`)
      const records = data.data || []

      for (const record of records) {
        await makeRequest('DELETE', `/items/typing_indicators/${record.id}`)
      }
    },

    getActive: async (conversationId) => {
      const now = new Date().toISOString()
      const filters = { conversation_id: { _eq: conversationId }, expires_at: { _gt: now } }
      const params = new URLSearchParams()
      params.append('filter', JSON.stringify(filters))
      params.append('fields', 'id,user_id,started_at,expires_at')

      const data = await makeRequest('GET', `/items/typing_indicators?${params}`)
      return data.data || []
    }
  },

  participants: {
    add: async (conversationId, userId) => {
      const participantData = {
        conversation_id: conversationId,
        user_id: userId,
        role: 'PARTICIPANT',
        join_date: new Date().toISOString()
      }

      const data = await makeRequest('POST', '/items/chat_participants', participantData)
      return data.data
    },

    list: async (conversationId) => {
      const filters = { conversation_id: { _eq: conversationId } }
      const params = new URLSearchParams()
      params.append('filter', JSON.stringify(filters))
      params.append('fields', 'id,user_id,join_date,is_admin,is_muted,unread_count,role,created_at')

      const data = await makeRequest('GET', `/items/chat_participants?${params}`)
      return data.data || []
    }
  },

  settings: {
    get: async (conversationId) => {
      const userId = localStorage.getItem('user_id')
      const filters = {
        _and: [
          { conversation_id: { _eq: conversationId } },
          { user_id: { _eq: userId } }
        ]
      }
      const params = new URLSearchParams()
      params.append('filter', JSON.stringify(filters))
      params.append('fields', 'id,is_muted,mute_duration_hours,mute_until,notification_level,is_pinned,display_name_override,color_tag,block_user')

      const data = await makeRequest('GET', `/items/conversation_settings?${params}`)
      return data.data?.[0] || null
    },

    update: async (conversationId, settings) => {
      const userId = localStorage.getItem('user_id')
      const settingData = { ...settings, conversation_id: conversationId, user_id: userId }

      const existing = await this.get(conversationId)
      if (existing) {
        const data = await makeRequest('PATCH', `/items/conversation_settings/${existing.id}`, settingData)
        return data.data
      } else {
        const data = await makeRequest('POST', '/items/conversation_settings', settingData)
        return data.data
      }
    },

    mute: async (conversationId, durationHours = 0) => {
      return this.update(conversationId, {
        is_muted: true,
        mute_duration_hours: durationHours,
        mute_until: durationHours > 0 ? new Date(Date.now() + durationHours * 3600000).toISOString() : null
      })
    },

    unmute: async (conversationId) => {
      return this.update(conversationId, { is_muted: false, mute_until: null })
    }
  },

  notifications: {
    list: async (limit = 20) => {
      const userId = localStorage.getItem('user_id')
      const filters = { user_id: { _eq: userId }, is_sent: { _eq: true } }
      const params = new URLSearchParams()
      params.append('filter', JSON.stringify(filters))
      params.append('fields', 'id,notification_id,user_id,conversation_id,message_id,from_user_id,notification_type,notification_title,notification_body,is_read,read_at,created_at')
      params.append('sort', '-created_at')
      params.append('limit', limit)

      const data = await makeRequest('GET', `/items/chat_notifications?${params}`)
      return data.data || []
    },

    markAsRead: async (notificationId) => {
      const data = await makeRequest('PATCH', `/items/chat_notifications/${notificationId}`, {
        is_read: true,
        read_at: new Date().toISOString()
      })
      return data.data
    }
  }

}

export default chatAPI
import { io } from 'socket.io-client'

let socket = null
let offlineQueue = []
let isConnected = false

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'
const SOCKET_URL_VPS = import.meta.env.VITE_SOCKET_URL_VPS || 'http://162.0.230.19:3001'

const shouldUseVPS = () => {
  const isDev = import.meta.env.DEV
  return !isDev || localStorage.getItem('USE_VPS_SOCKET') === 'true'
}

const getSocketURL = () => {
  return shouldUseVPS() ? SOCKET_URL_VPS : SOCKET_URL
}

export const chatSocket = {
  connect: (token, userId, callbacks = {}) => {
    return new Promise((resolve, reject) => {
      if (socket?.connected) {
        resolve(socket)
        return
      }

      socket = io(getSocketURL(), {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling']
      })

      socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id)
        isConnected = true
        socket.emit('register_user', { userId })
      })

      socket.on('user_registered', (data) => {
        console.log('✅ User registration confirmed:', data.userId)
        isConnected = true

        offlineQueue.forEach(event => {
          socket.emit(event.type, event.data)
        })
        offlineQueue = []

        if (callbacks.onConnect) callbacks.onConnect()
        resolve(socket)
      })

      socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error)
        isConnected = false
        if (callbacks.onError) callbacks.onError(error)
        reject(error)
      })

      socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason)
        isConnected = false
        if (callbacks.onDisconnect) callbacks.onDisconnect(reason)
      })

      socket.on('error', (error) => {
        console.error('⚠️ Socket error:', error)
        if (callbacks.onError) callbacks.onError(error)
      })

      socket.on('message_received', (data) => {
        if (callbacks.onMessageReceived) callbacks.onMessageReceived(data)
      })

      socket.on('typing:indicator', (data) => {
        console.log('🎯 Socket received typing:indicator event:', data)
        if (data.isTyping && callbacks.onUserTyping) {
          console.log('📝 Calling onUserTyping callback')
          callbacks.onUserTyping({
            conversation_id: data.conversationId,
            conversationId: data.conversationId,
            userId: data.userId,
            user_id: data.userId,
            is_typing: true,
            isTyping: true
          })
        } else if (!data.isTyping && callbacks.onUserStoppedTyping) {
          console.log('⛔ Calling onUserStoppedTyping callback')
          callbacks.onUserStoppedTyping({
            conversation_id: data.conversationId,
            conversationId: data.conversationId,
            userId: data.userId,
            user_id: data.userId
          })
        }
      })

      socket.on('message_marked_read', (data) => {
        if (callbacks.onMessageRead) callbacks.onMessageRead(data)
      })

      socket.on('message_delivered', (data) => {
        if (callbacks.onMessageDelivered) callbacks.onMessageDelivered(data)
      })

      socket.on('reaction_added', (data) => {
        if (callbacks.onReactionAdded) callbacks.onReactionAdded(data)
      })

      socket.on('reaction_removed', (data) => {
        if (callbacks.onReactionRemoved) callbacks.onReactionRemoved(data)
      })

      socket.on('user_online', (data) => {
        if (callbacks.onUserOnline) callbacks.onUserOnline(data)
      })

      socket.on('user_offline', (data) => {
        if (callbacks.onUserOffline) callbacks.onUserOffline(data)
      })

      socket.on('user_joined', (data) => {
        if (callbacks.onUserJoined) callbacks.onUserJoined(data)
      })

      socket.on('user_left', (data) => {
        if (callbacks.onUserLeft) callbacks.onUserLeft(data)
      })

      socket.on('conversation_updated', (data) => {
        if (callbacks.onConversationUpdated) callbacks.onConversationUpdated(data)
      })
    })
  },

  disconnect: () => {
    if (socket?.connected) {
      socket.disconnect()
      isConnected = false
      socket = null
    }
  },

  isConnected: () => isConnected && socket?.connected,

  joinConversation: (conversationId) => {
    if (!isConnected) {
      offlineQueue.push({
        type: 'join_conversation',
        data: { conversation_id: conversationId }
      })
      return
    }

    socket.emit('join_conversation', { conversation_id: conversationId })
  },

  leaveConversation: (conversationId) => {
    if (!isConnected) {
      offlineQueue.push({
        type: 'leave_conversation',
        data: { conversation_id: conversationId }
      })
      return
    }

    socket.emit('leave_conversation', { conversation_id: conversationId })
  },

  sendMessage: (conversationId, messageId, content, created_at = null) => {
    const data = {
      conversation_id: conversationId,
      message_id: messageId,
      content,
      created_at: created_at || new Date().toISOString()
    }

    if (!isConnected) {
      offlineQueue.push({
        type: 'send_message',
        data
      })
      return { queued: true }
    }

    socket.emit('send_message', data)
    return { queued: false, socketId: socket.id }
  },

  setTyping: (conversationId, isTyping = true) => {
    if (!isConnected) {
      console.warn('⚠️ Socket not connected, cannot emit typing event')
      return
    }

    if (isTyping) {
      console.log(`📤 Socket emitting typing:start for conversation:`, conversationId)
      socket.emit('typing:start', { conversationId })
    } else {
      console.log(`📤 Socket emitting typing:stop for conversation:`, conversationId)
      socket.emit('typing:stop', { conversationId })
    }
  },

  startTyping: (conversationId) => {
    console.log(`📤 startTyping emitting for conversation:`, conversationId)
    chatSocket.setTyping(conversationId, true)
  },

  stopTyping: (conversationId) => {
    console.log(`📤 stopTyping emitting for conversation:`, conversationId)
    chatSocket.setTyping(conversationId, false)
  },

  addReaction: (conversationId, messageId, emoji) => {
    const data = {
      conversation_id: conversationId,
      message_id: messageId,
      emoji
    }

    if (!isConnected) {
      offlineQueue.push({
        type: 'add_reaction',
        data
      })
      return
    }

    socket.emit('add_reaction', data)
  },

  removeReaction: (conversationId, messageId, emoji) => {
    const data = {
      conversation_id: conversationId,
      message_id: messageId,
      emoji
    }

    if (!isConnected) {
      offlineQueue.push({
        type: 'remove_reaction',
        data
      })
      return
    }

    socket.emit('remove_reaction', data)
  },

  markMessageAsRead: (conversationId, messageId, readAt = null) => {
    const data = {
      conversation_id: conversationId,
      message_id: messageId,
      ...(readAt && { read_at: readAt })
    }

    if (!isConnected) {
      offlineQueue.push({
        type: 'message_read',
        data
      })
      return
    }

    socket.emit('message_read', data)
  },

  markMessageAsDelivered: (conversationId, messageId, deliveredAt = null) => {
    const data = {
      conversation_id: conversationId,
      message_id: messageId,
      ...(deliveredAt && { delivered_at: deliveredAt })
    }

    socket.emit('message_delivered', data)
  },

  broadcastConversationUpdate: (conversationId, totalMessageCount, lastMessageId, lastMessageAt, lastMessagePreview = null) => {
    if (!isConnected) return

    const data = {
      conversation_id: conversationId,
      total_message_count: totalMessageCount,
      last_message_id: lastMessageId,
      last_message_at: lastMessageAt,
      ...(lastMessagePreview && { last_message_preview: lastMessagePreview })
    }

    socket.emit('update_conversation', data)
  },

  on: (event, callback) => {
    if (socket) {
      socket.on(event, callback)
    }
  },

  off: (event, callback) => {
    if (socket) {
      socket.off(event, callback)
    }
  },

  once: (event, callback) => {
    if (socket) {
      socket.once(event, callback)
    }
  },

  emit: (event, data) => {
    if (!isConnected) {
      offlineQueue.push({
        type: event,
        data
      })
      return
    }

    socket.emit(event, data)
  },

  getOfflineQueue: () => [...offlineQueue],

  clearOfflineQueue: () => {
    offlineQueue = []
  }
}

export default chatSocket

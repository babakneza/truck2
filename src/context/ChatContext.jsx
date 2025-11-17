/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import chatAPI from '../services/chatAPI'
import chatSocket from '../services/chatSocket'

const ChatContext = createContext()

export const useChatContext = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider')
  }
  return context
}

export const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages] = useState({})
  const [participants, setParticipants] = useState({})
  const [typingUsers, setTypingUsers] = useState({})
  const [unreadCounts, setUnreadCounts] = useState({})
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [socketConnected, setSocketConnected] = useState(false)
  const [attachmentsByMessageId] = useState({})

  const userId = localStorage.getItem('user_id')
  const userToken = localStorage.getItem('auth_token')

  useEffect(() => {
    if (!userId || !userToken) return

    const initializeSocket = async () => {
      try {
        await chatSocket.connect(userToken, userId, {
          onConnect: () => setSocketConnected(true),
          onDisconnect: () => setSocketConnected(false),
          onMessageReceived: handleMessageReceived,
          onUserTyping: handleUserTyping,
          onUserStoppedTyping: handleUserStoppedTyping,
          onMessageRead: handleMessageRead,
          onMessageDelivered: handleMessageDelivered,
          onReactionAdded: handleReactionAdded,
          onReactionRemoved: handleReactionRemoved,
          onUserOnline: handleUserOnline,
          onUserOffline: handleUserOffline,
          onUserJoined: handleUserJoined,
          onUserLeft: handleUserLeft,
          onConversationUpdated: handleConversationUpdated,
          onError: (err) => setError(err.message)
        })
      } catch (err) {
        console.error('Failed to connect socket:', err)
        setError('Failed to connect to chat server')
      }
    }

    initializeSocket()

    return () => {
      chatSocket.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userToken])

  useEffect(() => {
    if (!activeConversation?.id) return

    const pollInterval = setInterval(async () => {
      try {
        const messageReads = await chatAPI.messageReads.getForConversation(activeConversation.id)
        
        setMessages(prev => {
          const convMessages = prev[activeConversation.id] || []
          let hasUpdates = false
          
          const updatedMessages = convMessages.map(msg => {
            const readRecord = messageReads.find(r => r.message_id === msg.id)
            if (readRecord && readRecord.status && readRecord.status !== msg.status) {
              hasUpdates = true
              return {
                ...msg,
                status: readRecord.status,
                delivered_at: readRecord.delivered_at,
                read_at: readRecord.read_at
              }
            }
            return msg
          })
          
          if (hasUpdates) {
            return {
              ...prev,
              [activeConversation.id]: updatedMessages
            }
          }
          return prev
        })
      } catch (err) {
        console.error('Failed to poll message reads:', err)
      }
    }, 2000)

    return () => clearInterval(pollInterval)
  }, [activeConversation?.id])

  useEffect(() => {
    if (!socketConnected) return

    const pollConversationsInterval = setInterval(async () => {
      try {
        const filters = {
          _or: [
            { initiator_id: { _eq: userId } },
            { receiver_id: { _eq: userId } }
          ]
        }
        const updatedConversations = await chatAPI.conversations.list(filters)
        
        setConversations(prev => {
          const updated = prev.length !== updatedConversations.length || 
            prev.some((conv, idx) => {
              const updated = updatedConversations[idx]
              return !updated || 
                     conv.last_message_at !== updated.last_message_at ||
                     conv.total_message_count !== updated.total_message_count
            })
          
          if (updated) {
            return updatedConversations
          }
          return prev
        })
      } catch (err) {
        console.error('Failed to poll conversations:', err)
      }
    }, 3000)

    return () => clearInterval(pollConversationsInterval)
  }, [socketConnected, userId])

  useEffect(() => {
    if (!activeConversation?.id || !socketConnected) return

    const pollTypingIndicators = setInterval(async () => {
      try {
        const indicators = await chatAPI.typingIndicators.getActive(activeConversation.id)
        const typingUserIds = indicators
          .filter(ind => ind.user_id !== userId)
          .map(ind => ind.user_id)
        
        setTypingUsers(prev => {
          const currentTyping = prev[activeConversation.id] || []
          const typingSet = new Set(typingUserIds)
          const currentSet = new Set(currentTyping)
          
          if (typingSet.size !== currentSet.size || 
              [...typingSet].some(id => !currentSet.has(id))) {
            return {
              ...prev,
              [activeConversation.id]: typingUserIds
            }
          }
          return prev
        })
      } catch (err) {
        console.error('Failed to poll typing indicators:', err)
      }
    }, 1000)

    return () => clearInterval(pollTypingIndicators)
  }, [activeConversation?.id, socketConnected, userId])

  const handleMessageReceived = useCallback((data) => {
    const messageId = data.id || data.message_id
    const { conversation_id, content, created_at, sender_id } = data
    const actualSenderId = sender_id

    if (!messageId || !content || !actualSenderId) {
      console.warn('Invalid message received:', data)
      return
    }

    if (actualSenderId === userId) {
      return
    }

    const now = new Date().toISOString()

    setMessages(prev => {
      const existing = (prev[conversation_id] || []).map(m => m.id)
      if (existing.includes(messageId)) {
        return prev
      }
      return {
        ...prev,
        [conversation_id]: [
          ...(prev[conversation_id] || []),
          { 
            id: messageId, 
            content, 
            sender_id: actualSenderId, 
            created_at,
            status: 'READ',
            read_at: now
          }
        ]
      }
    })

    const messagePreview = content.substring(0, 50)
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversation_id
          ? {
              ...conv,
              last_message_at: created_at,
              last_message_preview: messagePreview,
              total_message_count: (conv.total_message_count || 0) + 1
            }
          : conv
      )
    )

    try {
      chatAPI.messageReads.markAsRead(messageId, conversation_id).catch(err => 
        console.error('Failed to mark received message as read:', err)
      )
    } catch (err) {
      console.error('Error calling markAsRead API:', err)
    }

    chatSocket.markMessageAsRead(conversation_id, messageId)

    if (activeConversation?.id !== conversation_id) {
      setUnreadCounts(prev => ({
        ...prev,
        [conversation_id]: (prev[conversation_id] || 0) + 1
      }))
    }
  }, [userId, activeConversation])

  const handleUserTyping = useCallback((data) => {
    const { conversation_id, conversationId, userId: typingUserId, user_id, is_typing, isTyping } = data
    const convId = conversation_id || conversationId
    const actualUserId = typingUserId || user_id
    const actualIsTyping = is_typing !== undefined ? is_typing : isTyping

    if (!convId || !actualUserId) {
      console.warn('Invalid typing data:', data)
      return
    }

    if (actualUserId === userId) {
      return
    }

    console.log(`👤 Typing event:`, { convId, actualUserId, actualIsTyping })
    
    if (actualIsTyping === false) {
      setTypingUsers(prev => ({
        ...prev,
        [convId]: (prev[convId] || []).filter(id => id !== actualUserId)
      }))
      return
    }

    setTypingUsers(prev => ({
      ...prev,
      [convId]: [...new Set([...(prev[convId] || []), actualUserId])]
    }))
  }, [userId])

  const handleUserStoppedTyping = useCallback((data) => {
    const { conversation_id, conversationId, userId: typingUserId, user_id } = data
    const convId = conversation_id || conversationId
    const actualUserId = typingUserId || user_id

    if (!convId || !actualUserId) {
      console.warn('Invalid stopped typing data:', data)
      return
    }

    console.log(`🛑 Stopped typing:`, { convId, actualUserId })

    setTypingUsers(prev => ({
      ...prev,
      [convId]: (prev[convId] || []).filter(id => id !== actualUserId)
    }))
  }, [])

  const handleMessageRead = useCallback((data) => {
    const { conversation_id, message_id, read_at } = data

    setMessages(prev => ({
      ...prev,
      [conversation_id]: (prev[conversation_id] || []).map(msg =>
        msg.id === message_id 
          ? { ...msg, status: 'READ', read_at: read_at || new Date().toISOString() } 
          : msg
      )
    }))
  }, [])

  const handleMessageDelivered = useCallback((data) => {
    const { conversation_id, message_id, delivered_at } = data

    setMessages(prev => ({
      ...prev,
      [conversation_id]: (prev[conversation_id] || []).map(msg =>
        msg.id === message_id && msg.status !== 'READ'
          ? { ...msg, status: 'DELIVERED', delivered_at: delivered_at || new Date().toISOString() } 
          : msg
      )
    }))
  }, [])

  const handleReactionAdded = useCallback((data) => {
    const { conversation_id, message_id, emoji, userId: reactingUserId } = data

    setMessages(prev => ({
      ...prev,
      [conversation_id]: (prev[conversation_id] || []).map(msg => {
        if (msg.id === message_id) {
          return {
            ...msg,
            reactions: [
              ...(msg.reactions || []),
              { emoji, userId: reactingUserId }
            ]
          }
        }
        return msg
      })
    }))
  }, [])

  const handleReactionRemoved = useCallback((data) => {
    const { conversation_id, message_id, emoji, userId: reactingUserId } = data

    setMessages(prev => ({
      ...prev,
      [conversation_id]: (prev[conversation_id] || []).map(msg => {
        if (msg.id === message_id) {
          return {
            ...msg,
            reactions: (msg.reactions || []).filter(
              r => !(r.emoji === emoji && r.userId === reactingUserId)
            )
          }
        }
        return msg
      })
    }))
  }, [])

  const handleUserOnline = useCallback(({ userId: onlineUserId }) => {
    setOnlineUsers(prev => new Set([...prev, onlineUserId]))
  }, [])

  const handleUserOffline = useCallback(({ userId: offlineUserId }) => {
    setOnlineUsers(prev => {
      const newSet = new Set(prev)
      newSet.delete(offlineUserId)
      return newSet
    })
  }, [])

  const handleUserJoined = useCallback((data) => {
    const { userId: joinedUserId } = data
    if (activeConversation) {
      setParticipants(prev => ({
        ...prev,
        [activeConversation.id]: [
          ...(prev[activeConversation.id] || []),
          joinedUserId
        ]
      }))
    }
  }, [activeConversation])

  const handleUserLeft = useCallback((data) => {
    const { userId: leftUserId } = data
    if (activeConversation) {
      setParticipants(prev => ({
        ...prev,
        [activeConversation.id]: (prev[activeConversation.id] || []).filter(id => id !== leftUserId)
      }))
    }
  }, [activeConversation])

  const handleConversationUpdated = useCallback((data) => {
    const { conversation_id, total_message_count, last_message_id, last_message_at, last_message_preview } = data
    
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversation_id
          ? {
              ...conv,
              total_message_count,
              last_message_id,
              last_message_at,
              last_message_preview: last_message_preview || conv.last_message_preview
            }
          : conv
      )
    )
  }, [])

  const fetchConversations = useCallback(async () => {
    if (!userId) return

    try {
      setIsLoading(true)
      const filters = {
        _or: [
          { initiator_id: { _eq: userId } },
          { receiver_id: { _eq: userId } }
        ]
      }
      console.log(`🔍 Fetching conversations for user ${userId}`)
      const data = await chatAPI.conversations.list(filters)
      console.log(`✅ Conversations fetched: ${data.length}`)
      setConversations(data)
      setIsConnected(true)
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  const fetchMessages = useCallback(async (conversationId, limit = 100, offset = 0) => {
    try {
      setIsLoading(true)
      const data = await chatAPI.messages.list(conversationId, limit, offset)
      const validMessages = data.filter(msg => msg && msg.content && msg.content.trim())
      
      setMessages(prev => {
        const existing = prev[conversationId] || []
        const existingIds = new Set(existing.map(m => m.id))
        const newMsgs = validMessages.filter(m => !existingIds.has(m.id))
        
        if (offset === 0 || existing.length === 0) {
          return {
            ...prev,
            [conversationId]: validMessages
          }
        } else {
          return {
            ...prev,
            [conversationId]: [...existing, ...newMsgs]
          }
        }
      })

    } catch (err) {
      console.error('Failed to fetch messages:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  
  const sendMessage = useCallback(async (conversationId, messageText, replyToId = null) => {
    if (!messageText.trim() || !socketConnected) return null

    try {
      const message = await chatAPI.messages.send(conversationId, messageText, replyToId)

      const enrichedMessage = {
        ...message,
        status: 'DELIVERED',
        delivered_at: new Date().toISOString()
      }

      const currentConversation = conversations.find(c => c.id === conversationId)
      const newCount = (currentConversation?.total_message_count || 0) + 1

      setMessages(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), enrichedMessage]
      }))

      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? {
                ...conv,
                total_message_count: newCount,
                last_message_id: message.id,
                last_message_at: message.created_at
              }
            : conv
        )
      )

      chatSocket.sendMessage(conversationId, message.id, messageText, message.created_at)
      const lastMessagePreview = messageText.substring(0, 50)
      chatSocket.broadcastConversationUpdate(conversationId, newCount, message.id, message.created_at, lastMessagePreview)
      chatSocket.markMessageAsDelivered(conversationId, message.id)
      
      try {
        await chatAPI.messageReads.markAsDelivered(message.id, conversationId)
      } catch (err) {
        console.error('Failed to mark as delivered:', err)
      }

      return enrichedMessage
    } catch (err) {
      console.error('Failed to send message:', err)
      setError(err.message)
      return null
    }
  }, [socketConnected, conversations])

  const editMessage = useCallback(async (conversationId, messageId, newText) => {
    try {
      const updated = await chatAPI.messages.edit(messageId, newText)

      setMessages(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map(msg =>
          msg.id === messageId ? updated : msg
        )
      }))

      return updated
    } catch (err) {
      console.error('Failed to edit message:', err)
      setError(err.message)
      return null
    }
  }, [])

  const deleteMessage = useCallback(async (conversationId, messageId) => {
    try {
      await chatAPI.messages.delete(messageId, conversationId)

      const currentConversation = conversations.find(c => c.id === conversationId)
      const newCount = Math.max((currentConversation?.total_message_count || 1) - 1, 0)

      setMessages(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map(msg =>
          msg.id === messageId ? { ...msg, is_deleted: true } : msg
        )
      }))

      const remainingMessages = messages[conversationId]?.filter(m => m.id !== messageId && !m.is_deleted) || []
      const newLastMessage = remainingMessages[remainingMessages.length - 1]

      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? {
                ...conv,
                total_message_count: newCount,
                last_message_id: newLastMessage?.id || null,
                last_message_at: newLastMessage?.created_at || null
              }
            : conv
        )
      )

      chatSocket.broadcastConversationUpdate(conversationId, newCount, newLastMessage?.id || null, newLastMessage?.created_at || null)
    } catch (err) {
      console.error('Failed to delete message:', err)
      setError(err.message)
    }
  }, [conversations, messages])

  const addReaction = useCallback(async (conversationId, messageId, emoji) => {
    try {
      const reaction = await chatAPI.reactions.add(messageId, emoji)
      chatSocket.addReaction(conversationId, messageId, emoji)
      return reaction
    } catch (err) {
      console.error('Failed to add reaction:', err)
      setError(err.message)
      return null
    }
  }, [])

  const removeReaction = useCallback(async (conversationId, messageId, reactionId, emoji) => {
    try {
      await chatAPI.reactions.remove(reactionId)
      chatSocket.removeReaction(conversationId, messageId, emoji)
    } catch (err) {
      console.error('Failed to remove reaction:', err)
      setError(err.message)
    }
  }, [])

  const markAsRead = useCallback((conversationId, messageId) => {
    const readAt = new Date().toISOString()
    setMessages(prev => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).map(msg =>
        msg.id === messageId ? { ...msg, status: 'READ', read_at: readAt } : msg
      )
    }))
    chatAPI.messageReads.markAsRead(messageId, conversationId).catch(err => console.error('Failed to mark message as read:', err))
    chatSocket.markMessageAsRead(conversationId, messageId, readAt)
  }, [])

  const setTyping = useCallback((conversationId, isTyping) => {
    if (!conversationId) {
      console.warn('setTyping called without conversationId')
      return
    }

    console.log(`✍️ setTyping: conversation=${conversationId}, isTyping=${isTyping}`)
    
    chatSocket.setTyping(conversationId, isTyping)
    
    if (isTyping) {
      chatAPI.typingIndicators.start(conversationId)
        .then(() => console.log(`✅ Typing started for conversation ${conversationId}`))
        .catch(err => console.error(`❌ Failed to start typing indicator:`, err))
    } else {
      chatAPI.typingIndicators.stop(conversationId)
        .then(() => console.log(`✅ Typing stopped for conversation ${conversationId}`))
        .catch(err => console.error(`❌ Failed to stop typing indicator:`, err))
    }
  }, [])

  const joinConversation = useCallback((conversationIdOrData) => {
    const conversationId = typeof conversationIdOrData === 'string' ? conversationIdOrData : conversationIdOrData.id
    const conversationData = typeof conversationIdOrData === 'object' ? conversationIdOrData : { id: conversationId }
    
    chatSocket.joinConversation(conversationId)
    setActiveConversation(prev => 
      prev ? { ...prev, ...conversationData } : conversationData
    )
  }, [])

  const leaveConversation = useCallback((conversationId) => {
    try {
      chatAPI.typingIndicators.stop(conversationId).catch(err =>
        console.error('Failed to stop typing indicator on leave:', err)
      )
    } catch (err) {
      console.error('Error stopping typing indicator on leave:', err)
    }
    
    chatSocket.leaveConversation(conversationId)
    chatSocket.setTyping(conversationId, false)
    
    if (activeConversation?.id === conversationId) {
      setActiveConversation(null)
    }
  }, [activeConversation])

  const createConversation = useCallback(async (participantIds) => {
    try {
      const conversationData = {
        initiator_id: userId,
        receiver_id: participantIds[0],
        conversation_type: 'GENERAL',
        is_active: true
      }
      const conversation = await chatAPI.conversations.create(conversationData)
      setConversations(prev => [conversation, ...prev])
      return conversation
    } catch (err) {
      console.error('Failed to create conversation:', err)
      setError(err.message)
      return null
    }
  }, [userId])

  const archiveConversation = useCallback(async (conversationId, userRole = 'receiver') => {
    try {
      await chatAPI.conversations.archive(conversationId, userRole)
      setConversations(prev => prev.filter(c => c.id !== conversationId))
    } catch (err) {
      console.error('Failed to archive conversation:', err)
      setError(err.message)
    }
  }, [])

  const uploadFile = useCallback(async (file) => {
    try {
      const response = await chatAPI.attachments.upload(file)
      return response.data
    } catch (err) {
      console.error('Failed to upload file:', err)
      setError(err.message)
      return null
    }
  }, [])

  const uploadAndAttachFiles = useCallback(async (messageId, files) => {
    const attachedFiles = []
    for (const file of files) {
      try {
        const uploadedFile = await uploadFile(file)
        if (uploadedFile) {
          const attachment = await chatAPI.attachments.linkToMessage(
            messageId,
            uploadedFile.id,
            file.name,
            file.type,
            file.size
          )
          attachedFiles.push(attachment)
        }
      } catch (err) {
        console.error(`Failed to attach file ${file.name}:`, err)
      }
    }
    return attachedFiles
  }, [uploadFile])

  const downloadFile = useCallback(async (fileId, fileName) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${window.location.origin}/api/assets/${fileId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error('File download failed')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download file:', err)
      setError(err.message)
    }
  }, [])

  const fetchMessageAttachments = useCallback(async (messageId) => {
    try {
      const attachments = await chatAPI.attachments.list(messageId)
      return attachments
    } catch (err) {
      console.error('Failed to fetch attachments:', err)
      return []
    }
  }, [])

  const value = {
    conversations,
    activeConversation,
    messages,
    participants,
    typingUsers,
    unreadCounts,
    onlineUsers,
    isConnected,
    isLoading,
    error,
    socketConnected,
    attachmentsByMessageId,

    fetchConversations,
    fetchMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    markAsRead,
    setTyping,
    joinConversation,
    leaveConversation,
    createConversation,
    archiveConversation,
    uploadFile,
    uploadAndAttachFiles,
    downloadFile,
    fetchMessageAttachments,

    setActiveConversation,
    setError,
    clearError: () => setError(null)
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export default ChatContext

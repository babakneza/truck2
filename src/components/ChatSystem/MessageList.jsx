import { useEffect, useRef, useState, useMemo } from 'react'
import { useChatContext } from '../../context/ChatContext'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import { Loader } from 'lucide-react'
import './MessageList.css'

export default function MessageList() {
  const {
    activeConversation,
    messages,
    typingUsers,
    markAsRead,
    fetchMessages
  } = useChatContext()

  const messagesContainerRef = useRef(null)
  const processedMessagesRef = useRef(new Set())
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)
  const [editingMessage, setEditingMessage] = useState(null)
  const firstLoadRef = useRef(true)

  const conversationMessages = useMemo(
    () => {
      const msgs = messages[activeConversation?.id] || []
      return msgs.filter(msg => msg && msg.content && msg.content.trim())
    },
    [messages, activeConversation?.id]
  )
  const userId = localStorage.getItem('user_id')

  useEffect(() => {
    if (activeConversation?.id) {
      firstLoadRef.current = true
    }
  }, [activeConversation?.id])

  useEffect(() => {
    if (!activeConversation?.id) return
    processedMessagesRef.current.clear()
  }, [activeConversation?.id])

  useEffect(() => {
    if (!activeConversation?.id) return
    
    const unreadMessages = conversationMessages.filter(
      msg => msg.sender_id !== userId && msg.status !== 'READ'
    )
    
    unreadMessages.forEach(msg => {
      if (!processedMessagesRef.current.has(msg.id)) {
        processedMessagesRef.current.add(msg.id)
        markAsRead(activeConversation.id, msg.id)
      }
    })
  }, [conversationMessages, userId, activeConversation?.id, markAsRead])

  const handleMessageListScroll = async (e) => {
    const element = e.target
    if (element.scrollTop <= 50 && !isLoadingMore && conversationMessages.length > 10) {
      setIsLoadingMore(true)
      const totalMessages = messages[activeConversation?.id]?.length || 0
      
      await fetchMessages(
        activeConversation.id,
        50,
        totalMessages
      )
      
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current
      container.scrollTop = container.scrollHeight
    }
  }, [conversationMessages.length])

  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current
      container.scrollTop = container.scrollHeight
    }
  }, [typingUsers])

  if (!activeConversation) return null

  const typing = typingUsers[activeConversation.id] || []

  return (
    <div
      className="message-list"
      ref={messagesContainerRef}
      onScroll={handleMessageListScroll}
    >
      {isLoadingMore && (
        <div className="message-list-loading">
          <Loader size={20} className="spinner" />
          <span>Loading messages...</span>
        </div>
      )}

      <div className="messages-container">
        {conversationMessages.length === 0 ? (
          <div className="message-list-empty">
            <div className="empty-icon">💬</div>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          conversationMessages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.sender_id === userId}
              onReply={(msg) => setReplyingTo(msg)}
              onEdit={(msg) => setEditingMessage(msg)}
            />
          ))
        )}

        {typing.length > 0 && (
          <div className="messages-typing-container">
            {typing.map((typingUserId) => (
              <TypingIndicator key={typingUserId} userId={typingUserId} />
            ))}
          </div>
        )}
      </div>

      {(replyingTo || editingMessage) && (
        <div className="message-compose-info">
          <span className="info-label">
            {replyingTo ? '↩️ Replying to' : '✏️ Editing'}
          </span>
          <span className="info-content">
            {replyingTo?.message_text || editingMessage?.message_text}
          </span>
          <button
            className="info-close"
            onClick={() => {
              setReplyingTo(null)
              setEditingMessage(null)
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

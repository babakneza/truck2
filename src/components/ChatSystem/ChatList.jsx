import { useState, useMemo } from 'react'
import { useChatContext } from '../../context/ChatContext'
import { Search, Plus, Archive } from 'lucide-react'
import StartConversationModal from './StartConversationModal'
import './ChatList.css'

export default function ChatList({ onSelectConversation }) {
  const {
    conversations,
    activeConversation,
    unreadCounts,
    archiveConversation,
    fetchMessages,
    joinConversation,
    createConversation,
    setActiveConversation
  } = useChatContext()

  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations

    return conversations.filter(conv => {
      const searchText = (conv.otherUserName || '').toLowerCase()
      return searchText.includes(searchQuery.toLowerCase())
    })
  }, [conversations, searchQuery])

  const handleSelectConversation = async (conversation) => {
    if (activeConversation?.id === conversation.id) return
    joinConversation(conversation)
    await fetchMessages(conversation.id)
    onSelectConversation?.()
  }

  const handleStartConversation = async (driver) => {
    try {
      const conversation = await createConversation([driver.id])
      if (conversation) {
        setActiveConversation(conversation)
        await fetchMessages(conversation.id)
        onSelectConversation?.()
      }
    } catch (err) {
      console.error('Failed to start conversation:', err)
    }
  }

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h2>Messages</h2>
        <button 
          className="chat-list-new-btn" 
          title="New conversation"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="chat-list-search">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="chat-list-items">
        {filteredConversations.length === 0 ? (
          <div className="chat-list-empty">
            <p>{searchQuery ? 'No conversations found' : 'No conversations yet'}</p>
          </div>
        ) : (
          filteredConversations.map(conversation => (
            <div
              key={conversation.id}
              className={`chat-list-item ${
                activeConversation?.id === conversation.id ? 'active' : ''
              }`}
              onClick={() => handleSelectConversation(conversation)}
            >
              <div className="chat-list-item-avatar">
                {conversation.otherUserProfilePhoto ? (
                  <img 
                    src={conversation.otherUserProfilePhoto} 
                    alt={conversation.otherUserName}
                    className="avatar-image"
                    onError={(e) => {
                      console.warn(`Failed to load avatar from: ${conversation.otherUserProfilePhoto}`);
                      e.target.style.display = 'none'
                      const nextElement = e.target.nextElementSibling
                      if (nextElement) nextElement.style.display = 'flex'
                    }}
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {(conversation.otherUserName || '?').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="chat-list-item-content">
                <div className="chat-list-item-header">
                  <span className="chat-list-item-name">
                    {conversation.otherUserName || `User ${conversation.receiver_id}`}
                  </span>
                  <span className="chat-list-item-time">
                    {conversation.last_message_display_time 
                      ? new Date(conversation.last_message_display_time).toLocaleDateString() 
                      : new Date(conversation.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="chat-list-item-preview">
                  {conversation.last_message_preview}
                </p>
              </div>

              {unreadCounts[conversation.id] > 0 && (
                <div className="chat-list-item-badge">
                  {unreadCounts[conversation.id]}
                </div>
              )}

              <button
                className="chat-list-item-menu"
                onClick={(e) => {
                  e.stopPropagation()
                  archiveConversation(conversation.id)
                }}
                title="Archive"
              >
                <Archive size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      <StartConversationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStartConversation={handleStartConversation}
      />
    </div>
  )
}

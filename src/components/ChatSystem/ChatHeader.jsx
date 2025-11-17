import { useState } from 'react'
import { useChatContext } from '../../context/ChatContext'
import { Phone, Video, Info, MoreVertical, ChevronLeft } from 'lucide-react'
import './ChatHeader.css'

export default function ChatHeader({ onBackClick }) {
  const { activeConversation, onlineUsers } = useChatContext()
  const [showMenu, setShowMenu] = useState(false)

  if (!activeConversation) return null

  const recipientId = activeConversation.otherUserId || activeConversation.receiver_id
  const userName = activeConversation.otherUserName || `User ${recipientId}`
  const userAvatar = activeConversation.otherUserProfilePhoto || activeConversation.avatar
  const isOnline = onlineUsers.has(recipientId)
  
  const getAvatarInitial = () => {
    if (userName) {
      return userName.charAt(0).toUpperCase()
    }
    return String(recipientId).charAt(0)
  }

  return (
    <div className="chat-header">
      <button className="chat-header-back" onClick={onBackClick}>
        <ChevronLeft size={24} />
      </button>

      <div className="chat-header-info">
        <div className="chat-header-user">
          <div className="chat-header-avatar">
            {userAvatar ? (
              <img 
                src={userAvatar} 
                alt={userName} 
                className="avatar-image"
                onError={(e) => {
                  console.warn(`Failed to load avatar from: ${userAvatar}`);
                  e.target.style.display = 'none'
                  const nextElement = e.target.nextElementSibling
                  if (nextElement) nextElement.style.display = 'flex'
                }}
              />
            ) : null}
            <div 
              className="avatar-placeholder"
              style={userAvatar ? { display: 'none' } : {}}
            >
              {getAvatarInitial()}
            </div>
            {isOnline && <div className="online-indicator" />}
          </div>
          <div className="chat-header-details">
            <h3 className="chat-header-name">{userName}</h3>
            <p className="chat-header-status">
              {isOnline ? 'Active now' : 'Offline'}
            </p>
          </div>
        </div>
      </div>

      <div className="chat-header-actions">
        <button className="header-action-btn" title="Call">
          <Phone size={20} />
        </button>
        <button className="header-action-btn" title="Video call">
          <Video size={20} />
        </button>
        <button className="header-action-btn" title="Info">
          <Info size={20} />
        </button>
        <div className="header-menu-container">
          <button
            className="header-action-btn"
            onClick={() => setShowMenu(!showMenu)}
            title="More options"
          >
            <MoreVertical size={20} />
          </button>
          {showMenu && (
            <div className="header-menu">
              <button>Mute conversation</button>
              <button>Archive</button>
              <button>Clear history</button>
              <button className="menu-danger">Block user</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

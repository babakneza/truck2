import { useState, useEffect } from 'react'
import { useChatContext } from '../../context/ChatContext'
import { MoreVertical, Smile, Copy, Delete, Edit } from 'lucide-react'
import Reactions from './Reactions'
import ReadReceipt from './ReadReceipt'
import FileAttachments from './FileAttachments'
import './MessageBubble.css'

export default function MessageBubble({ message, isOwn, onReply, onEdit }) {
  const { addReaction, removeReaction, deleteMessage, activeConversation, fetchMessageAttachments, attachmentsByMessageId } = useChatContext()
  const [showMenu, setShowMenu] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [userName, setUserName] = useState('')

  const userId = localStorage.getItem('user_id')
  const senderId = message.sender_id || message.user_id
  const isMessageOwner = senderId === userId

  useEffect(() => {
    if (senderId) {
      const fetchUserName = async () => {
        try {
          const token = localStorage.getItem('auth_token')
          const response = await fetch(`/api/users/${senderId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (response.ok) {
            const data = await response.json()
            const name = data.data?.first_name || data.data?.email || `User`
            setUserName(name)
          } else {
            setUserName('User')
          }
        } catch (err) {
          console.error('Failed to fetch user name:', err)
          setUserName('User')
        }
      }
      fetchUserName()
    }
  }, [senderId])

  useEffect(() => {
    if (message.id) {
      const preloadedAttachments = attachmentsByMessageId[message.id]
      if (preloadedAttachments) {
        setAttachments(preloadedAttachments)
      } else if (fetchMessageAttachments) {
        fetchMessageAttachments(message.id).then(setAttachments).catch(() => {
          setAttachments([])
        })
      }
    }
  }, [message.id, fetchMessageAttachments, attachmentsByMessageId])

  const handleAddReaction = async (emoji) => {
    await addReaction(activeConversation.id, message.id, emoji)
    setShowReactions(false)
  }

  const handleRemoveReaction = async (reactionId) => {
    await removeReaction(activeConversation.id, message.id, reactionId)
  }

  const handleDelete = async () => {
    await deleteMessage(activeConversation.id, message.id)
    setShowMenu(false)
  }

  return (
    <div className={`message-bubble ${isOwn ? 'own' : 'other'}`} data-status={message.status || 'SENT'} data-read-at={message.read_at}>
      {!isOwn && (
        <div className="message-avatar">
          <div className="avatar-placeholder">
            {userName ? String(userName).charAt(0).toUpperCase() : '?'}
          </div>
        </div>
      )}

      <div className="message-content-wrapper">
        {!isOwn && userName && (
          <div className="message-user-name">{userName}</div>
        )}
        <div className="message-content">
          <p className="message-text">{message.content}</p>

          {attachments.length > 0 && <FileAttachments attachments={attachments} />}

          {message.reactions && message.reactions.length > 0 && (
            <div className="message-reactions-display">
              {message.reactions.map((reaction, idx) => (
                <span
                  key={idx}
                  className="reaction-emoji"
                  onClick={() => {
                    if (isMessageOwner) handleRemoveReaction(reaction.id)
                  }}
                  title={`Reacted by ${userName}`}
                >
                  {reaction.reaction_emoji}
                </span>
              ))}
            </div>
          )}

          <div className="message-footer">
            <time className="message-time">
              {new Date(message.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </time>

            {isOwn && <ReadReceipt isRead={message.status === 'READ'} isDelivered={message.status === 'DELIVERED'} />}
          </div>
        </div>

        <div className="message-actions">
          <button
            className="message-action-btn"
            onClick={() => setShowReactions(!showReactions)}
            title="Add reaction"
          >
            <Smile size={16} />
          </button>

          {showReactions && (
            <Reactions onSelectEmoji={handleAddReaction} />
          )}

          <div className="message-menu-container">
            <button
              className="message-action-btn"
              onClick={() => setShowMenu(!showMenu)}
              title="More options"
            >
              <MoreVertical size={16} />
            </button>

            {showMenu && (
              <div className="message-menu">
                <button onClick={() => onReply(message)}>
                  Reply
                </button>
                <button onClick={() => {
                  navigator.clipboard.writeText(message.content)
                  setShowMenu(false)
                }}>
                  <Copy size={14} /> Copy
                </button>
                {isMessageOwner && (
                  <>
                    <button onClick={() => onEdit(message)}>
                      <Edit size={14} /> Edit
                    </button>
                    <button onClick={handleDelete} className="menu-danger">
                      <Delete size={14} /> Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

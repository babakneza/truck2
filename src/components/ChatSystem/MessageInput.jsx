import { useRef, useState } from 'react'
import { useChatContext } from '../../context/ChatContext'
import { Send, Plus, Smile, Paperclip } from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'
import './MessageInput.css'

export default function MessageInput() {
  const {
    activeConversation,
    sendMessage,
    setTyping,
    uploadAndAttachFiles
  } = useChatContext()

  const [messageText, setMessageText] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [attachments, setAttachments] = useState([])
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  const handleInput = (e) => {
    const text = e.target.value
    setMessageText(text)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    if (text.length > 0) {
      setTyping(activeConversation.id, true)

      typingTimeoutRef.current = setTimeout(() => {
        setTyping(activeConversation.id, false)
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
          typingTimeoutRef.current = null
        }
      }, 3000)
    } else {
      setTyping(activeConversation.id, false)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
    }

    const textarea = inputRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
    }
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() || isSending) return

    setIsSending(true)
    try {
      const message = await sendMessage(activeConversation.id, messageText)

      if (message && attachments.length > 0) {
        await uploadAndAttachFiles(message.id, attachments)
      }

      setMessageText('')
      setShowEmojiPicker(false)
      setAttachments([])

      if (inputRef.current) {
        inputRef.current.style.height = 'auto'
        inputRef.current.focus()
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
      setTyping(activeConversation.id, false)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleEmojiClick = (emojiData) => {
    setMessageText(prev => prev + emojiData.emoji)
    setShowEmojiPicker(false)
    inputRef.current?.focus()
  }

  const handleAttachmentClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    setAttachments(prev => [...prev, ...files])
  }

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  if (!activeConversation) return null

  return (
    <div className="message-input-container">
      {attachments.length > 0 && (
        <div className="message-attachments-preview">
          {attachments.map((file, idx) => (
            <div key={idx} className="attachment-item">
              <span className="attachment-name">{file.name}</span>
              <button
                className="attachment-remove"
                onClick={() => removeAttachment(idx)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="message-input-wrapper">
        <div className="message-input-actions-left">
          <button
            className="input-action-btn"
            onClick={handleAttachmentClick}
            title="Attach file"
          >
            <Paperclip size={20} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        <div className="message-input-field">
          <textarea
            ref={inputRef}
            value={messageText}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Shift+Enter for new line)"
            className="message-textarea"
            rows={1}
          />
        </div>

        <div className="message-input-actions-right">
          <div className="emoji-picker-container">
            <button
              className="input-action-btn"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Emoji"
            >
              <Smile size={20} />
            </button>

            {showEmojiPicker && (
              <div className="emoji-picker-wrapper">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  theme="auto"
                  searchPlaceholder="Search emoji..."
                />
              </div>
            )}
          </div>

          <button
            className={`send-btn ${isSending ? 'sending' : ''}`}
            type="submit"
            onClick={handleSendMessage}
            disabled={!messageText.trim() || isSending}
            title="Send message (Enter)"
          >
            <Send size={20} />
            <span className="send-btn-text">Send</span>
          </button>
        </div>
      </div>
    </div>
  )
}

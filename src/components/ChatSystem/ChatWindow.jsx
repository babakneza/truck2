import { useEffect, useState } from 'react'
import { useChatContext } from '../../context/ChatContext'
import ChatList from './ChatList'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import { X } from 'lucide-react'
import './ChatWindow.css'

export default function ChatWindow() {
  const {
    activeConversation,
    socketConnected,
    error,
    setError,
    fetchConversations
  } = useChatContext()

  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  return (
    <div className="chat-window">
      {error && (
        <div className="chat-error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="chat-error-close">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="chat-container">
        <aside className={`chat-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
          <ChatList onSelectConversation={() => setMobileOpen(false)} />
        </aside>

        <main className="chat-main">
          {activeConversation ? (
            <>
              <ChatHeader onBackClick={() => setMobileOpen(false)} />
              <MessageList />
              <MessageInput />
            </>
          ) : (
            <div className="chat-empty">
              <div className="chat-empty-content">
                <div className="chat-empty-icon">💬</div>
                <h2>Select a conversation to start</h2>
                <p>Choose from your conversations or create a new one</p>
              </div>
            </div>
          )}
        </main>

        <div className="chat-status-indicator">
          <span className={`status-dot ${socketConnected ? 'connected' : 'disconnected'}`} />
          <span className="status-text">
            {socketConnected ? 'Connected' : 'Connecting...'}
          </span>
        </div>
      </div>
    </div>
  )
}

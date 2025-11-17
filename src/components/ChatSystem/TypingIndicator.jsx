import { useState, useEffect } from 'react'
import './TypingIndicator.css'

export default function TypingIndicator({ userId, userName }) {
  const [displayName, setDisplayName] = useState(userName || `User ${userId}`)

  useEffect(() => {
    if (userName) {
      setDisplayName(userName)
    } else {
      const fetchUserName = async () => {
        try {
          const token = localStorage.getItem('auth_token')
          const response = await fetch(`/api/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (response.ok) {
            const data = await response.json()
            const name = data.data?.first_name || data.data?.email || `User ${userId}`
            setDisplayName(name)
          }
        } catch (err) {
          console.error('Failed to fetch user name:', err)
        }
      }
      fetchUserName()
    }
  }, [userId, userName])

  const firstLetter = displayName ? String(displayName).charAt(0).toUpperCase() : '?'

  return (
    <div className="typing-indicator">
      <div className="typing-avatar">
        <div className="avatar-placeholder">{firstLetter}</div>
      </div>
      <div className="typing-content">
        <div className="typing-message">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
        <p className="typing-text">{displayName} is typing...</p>
      </div>
    </div>
  )
}

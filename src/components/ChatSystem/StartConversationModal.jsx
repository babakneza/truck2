import { useState, useEffect } from 'react'
import { X, Search, Loader } from 'lucide-react'
import chatAPI from '../../services/chatAPI'
import './StartConversationModal.css'

export default function StartConversationModal({ isOpen, onClose, onStartConversation }) {
  const [drivers, setDrivers] = useState([])
  const [filteredDrivers, setFilteredDrivers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen) {
      fetchAvailableDrivers()
    }
  }, [isOpen])

  const fetchAvailableDrivers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await chatAPI.users.getAvailableDrivers()
      setDrivers(result)
      setFilteredDrivers(result)
    } catch (err) {
      console.error('Failed to fetch drivers:', err)
      setError('Failed to load available drivers')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!searchQuery) {
      setFilteredDrivers(drivers)
      return
    }

    const filtered = drivers.filter(driver =>
      driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredDrivers(filtered)
  }, [searchQuery, drivers])

  const handleSelectDriver = async (driver) => {
    onStartConversation(driver)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="start-conversation-modal-overlay" onClick={onClose}>
      <div className="start-conversation-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Start a Conversation</h2>
          <button onClick={onClose} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="modal-search">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search drivers by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            disabled={isLoading}
          />
        </div>

        <div className="modal-content">
          {isLoading && (
            <div className="modal-loading">
              <Loader size={24} className="spinner" />
              <p>Loading drivers...</p>
            </div>
          )}

          {error && (
            <div className="modal-error">
              <p>{error}</p>
              <button onClick={fetchAvailableDrivers} className="retry-btn">
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && filteredDrivers.length === 0 && (
            <div className="modal-empty">
              <p>{searchQuery ? 'No drivers found matching your search' : 'No drivers available'}</p>
            </div>
          )}

          {!isLoading && !error && filteredDrivers.length > 0 && (
            <div className="drivers-list">
              {filteredDrivers.map(driver => (
                <div
                  key={driver.id}
                  className="driver-item"
                  onClick={() => handleSelectDriver(driver)}
                >
                  <div className="driver-avatar">
                    {driver.profile_photo ? (
                      <img
                        src={driver.profile_photo}
                        alt={driver.name}
                        onError={(e) => {
                          e.target.style.display = 'none'
                          const placeholder = e.target.nextElementSibling
                          if (placeholder) placeholder.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div className="avatar-placeholder" style={{
                      display: driver.profile_photo ? 'none' : 'flex'
                    }}>
                      {driver.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="driver-info">
                    <p className="driver-name">{driver.name}</p>
                    <p className="driver-email">{driver.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

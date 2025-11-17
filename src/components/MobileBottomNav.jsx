import './MobileBottomNav.css'

export default function MobileBottomNav({ user, onNavigate, currentPage }) {

  if (!user) {
    return null
  }

  const isDriver = user.role === 'driver'

  const driverMenuItems = [
    { id: 'driver-dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'driver-available-shipments', label: 'Shipments', icon: '📦' },
    { id: 'bidding-system', label: 'Bids', icon: '🤝' },
    { id: 'chat', label: 'Messages', icon: '💬' },
    { id: 'profile', label: 'Profile', icon: '👤' }
  ]

  const shipperMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'post-shipment', label: 'Post', icon: '➕' },
    { id: 'shipments-list', label: 'Shipments', icon: '📦' },
    { id: 'chat', label: 'Messages', icon: '💬' },
    { id: 'profile', label: 'Profile', icon: '👤' }
  ]

  const menuItems = isDriver ? driverMenuItems : shipperMenuItems

  const handleNavigation = (pageId) => {
    onNavigate(pageId)
  }

  return (
    <nav className="mobile-bottom-nav">
      <div className="mobile-nav-items">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`mobile-nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => handleNavigation(item.id)}
            title={item.label}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

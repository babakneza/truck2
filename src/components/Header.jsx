import { useState, useEffect } from 'react'
import AuthModal from './AuthModal'
import { getStoredUser, logoutUser } from '../services/directusAuth'
import './Header.css'

export default function Header() {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userMenu, setUserMenu] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const storedUser = getStoredUser()
    if (storedUser) {
      setUser(storedUser)
      setIsLoggedIn(true)
    }
  }, [])

  // Listen for storage changes and auth changes to update UI when user logs in/out
  useEffect(() => {
    const handleAuthChange = () => {
      const storedUser = getStoredUser()
      if (storedUser) {
        setUser(storedUser)
        setIsLoggedIn(true)
      } else {
        setIsLoggedIn(false)
        setUser(null)
      }
    }

    window.addEventListener('storage', handleAuthChange)
    window.addEventListener('authChange', handleAuthChange)
    return () => {
      window.removeEventListener('storage', handleAuthChange)
      window.removeEventListener('authChange', handleAuthChange)
    }
  }, [])

  const handleLogin = (formData) => {
    setUser({
      email: formData.email,
      userType: formData.userType,
      isSignUp: formData.isSignUp,
      id: formData.userId
    })
    setIsLoggedIn(true)
  }

  const handleLogout = async () => {
    await logoutUser()
    setIsLoggedIn(false)
    setUser(null)
    setUserMenu(false)
    // Dispatch custom event to notify other components of auth change
    window.dispatchEvent(new Event('authChange'))
  }

  return (
    <>
      <header className="header">
        <div className="header-container">
          <div className="header-brand">
            <div className="logo">🚚</div>
            <h1 className="brand-name">Truck2</h1>
          </div>

          <div className="header-actions">
            {isLoggedIn ? (
              <div className="user-menu-container">
                <button
                  className="user-menu-btn"
                  onClick={() => setUserMenu(!userMenu)}
                >
                  <span className="user-avatar">{user.email[0].toUpperCase()}</span>
                  <span className="user-email">{user.email}</span>
                  <span className="menu-toggle">{userMenu ? '▲' : '▼'}</span>
                </button>

                {userMenu && (
                  <div className="user-menu-dropdown">
                    <div className="user-menu-header">
                      <p className="user-type">
                        {user.userType === 'shipper' ? '📦 Shipper' : '🚚 Driver'}
                      </p>
                    </div>
                    <a href="#dashboard" className="menu-item">Dashboard</a>
                    <a href="#profile" className="menu-item">Profile</a>
                    <a href="#history" className="menu-item">History</a>
                    <a href="#settings" className="menu-item">Settings</a>
                    <button
                      onClick={handleLogout}
                      className="menu-item menu-item-logout"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="auth-btn"
                onClick={() => setAuthModalOpen(true)}
              >
                Sign In / Sign Up
              </button>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLogin={handleLogin}
      />
    </>
  )
}

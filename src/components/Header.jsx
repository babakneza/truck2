import { useState, useEffect } from 'react'
import AuthModal from './AuthModal'
import { getStoredUser, logoutUser, getAuthToken } from '../services/directusAuth'
import './Header.css'

export default function Header({ onNavigate }) {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userMenu, setUserMenu] = useState(false)
  const [user, setUser] = useState(null)
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null)

  useEffect(() => {
    const storedUser = getStoredUser()
    if (storedUser) {
      setUser(storedUser)
      setIsLoggedIn(true)
      fetchUserProfilePhoto()
    }
  }, [])

  const fetchUserProfilePhoto = async () => {
    try {
      const token = getAuthToken()
      if (!token) return

      const meRes = await fetch('/api/users/me?fields=id', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const meData = await meRes.json()
      const userId = meData.data.id

      const userRes = await fetch(`/api/items/users?filter={"user_id":{"_eq":"${userId}"}}&fields=profile_photo`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const userData = await userRes.json()

      if (userData.data && userData.data.length > 0 && userData.data[0].profile_photo) {
        const photoId = userData.data[0].profile_photo
        const photoRes = await fetch(`/api/assets/${photoId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (photoRes.ok) {
          const blob = await photoRes.blob()
          const url = URL.createObjectURL(blob)
          setProfilePhotoUrl(url)
        }
      }
    } catch (error) {
      console.error('Error fetching profile photo:', error)
    }
  }

  useEffect(() => {
    const handleAuthChange = () => {
      const storedUser = getStoredUser()
      if (storedUser) {
        setUser(storedUser)
        setIsLoggedIn(true)
        fetchUserProfilePhoto()
      } else {
        setIsLoggedIn(false)
        setUser(null)
        setProfilePhotoUrl(null)
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
      id: formData.userId,
      role: formData.userType
    })
    setIsLoggedIn(true)
    
    const dashboardPage = formData.userType === 'driver' ? 'driver-dashboard' : 'dashboard'
    onNavigate(dashboardPage)
  }

  const handleLogout = async () => {
    await logoutUser()
    setIsLoggedIn(false)
    setUser(null)
    setUserMenu(false)
    window.dispatchEvent(new Event('authChange'))
  }

  const navigate = (page) => {
    onNavigate(page)
    setUserMenu(false)
  }

  return (
    <>
      <header className="header">
        <div className="header-container">
          <div className="header-brand" onClick={() => navigate('home')} style={{ cursor: 'pointer' }}>
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
                  {profilePhotoUrl ? (
                    <span className="user-avatar">
                      <img src={profilePhotoUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    </span>
                  ) : (
                    <span className="user-avatar">{user.email[0].toUpperCase()}</span>
                  )}
                  <span className="user-email">{user.email}</span>
                  <span className="menu-toggle">{userMenu ? '▲' : '▼'}</span>
                </button>

                {userMenu && (
                  <div className="user-menu-dropdown">
                    <div className="user-menu-header">
                      <p className="user-type">
                        {user.role === 'shipper' ? '📦 Shipper' : '🚚 Driver'}
                      </p>
                    </div>
                    <button onClick={() => navigate(user.role === 'driver' ? 'driver-dashboard' : 'dashboard')} className="menu-item">Dashboard</button>
                    <button onClick={() => navigate('profile')} className="menu-item">Profile</button>
                    {user.role === 'driver' && (
                      <button onClick={() => navigate('vehicles')} className="menu-item">Vehicles</button>
                    )}
                    <button onClick={() => navigate('history')} className="menu-item">History</button>
                    <button onClick={() => navigate('chat')} className="menu-item">💬 Messages</button>
                    <button onClick={() => navigate('settings')} className="menu-item">Settings</button>
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

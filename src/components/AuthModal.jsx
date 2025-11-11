import { useState } from 'react'
import { registerUser, loginUser } from '../services/directusAuth'
import './AuthModal.css'

export default function AuthModal({ isOpen, onClose, onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'shipper'
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      let result

      if (isSignUp) {
        result = await registerUser(formData.email, formData.password, formData.userType)
      } else {
        result = await loginUser(formData.email, formData.password)
      }

      if (result.success) {
        onLogin({
          email: result.user.email,
          userType: result.user.role,
          isSignUp,
          userId: result.user.id
        })
        setFormData({ email: '', password: '', userType: 'shipper' })
        onClose()
        // Dispatch custom event to notify other components of auth change
        window.dispatchEvent(new Event('authChange'))
      } else {
        setError(result.error || 'Authentication failed')
      }
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose} disabled={isLoading}>✕</button>

        <div className="auth-modal-header">
          <h2>{isSignUp ? 'Create Account' : 'Sign In'}</h2>
          <p>{isSignUp ? 'Join thousands of shippers and drivers' : 'Sign in to your account'}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="form-group">
              <label htmlFor="userType">Account Type</label>
              <select
                id="userType"
                name="userType"
                value={formData.userType}
                onChange={handleChange}
                required
                disabled={isLoading}
              >
                <option value="shipper">I'm a Shipper</option>
                <option value="driver">I'm a Driver</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={isLoading}>
            {isLoading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="auth-modal-footer">
          <p>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            {' '}
            <button
              type="button"
              className="auth-toggle-btn"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setFormData({ email: '', password: '', userType: 'shipper' })
                setError(null)
              }}
              disabled={isLoading}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

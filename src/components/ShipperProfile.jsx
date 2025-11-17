import { useState, useEffect } from 'react'
import { getAuthToken, getStoredUser } from '../services/directusAuth'
import './ShipperProfile.css'

export default function ShipperProfile() {
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    title: '',
    description: '',
    role: '',
    status: '',
    phone: '',
    kyc_status: '',
    created_at: '',
    phone_verified: false,
    nationality: '',
    profile_photo: ''
  })

  const [formData, setFormData] = useState({})
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null)

  useEffect(() => {
    fetchProfileData()
  }, [])

  useEffect(() => {
    if (profileData.profile_photo) {
      fetchProfilePhoto(profileData.profile_photo)
    }
  }, [profileData.profile_photo])

  const fetchProfilePhoto = async (photoId) => {
    try {
      const token = getAuthToken()
      if (!token) return

      const response = await fetch(`/api/assets/${photoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        setProfilePhotoUrl(url)
      }
    } catch (error) {
      console.error('Error fetching profile photo:', error)
    }
  }

  const fetchProfileData = async () => {
    try {
      const token = getAuthToken()
      const user = getStoredUser()
      if (!token || !user) return

      const directusUserRes = await fetch(`/api/users/me?fields=id,first_name,last_name,email,password,title,description,role.name,status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const directusUser = directusUserRes.ok ? (await directusUserRes.json()).data : {}
      
      let customUserData = {}
      if (directusUser.id) {
        try {
          const customUserRes = await fetch(`/api/items/users?filter={"user_id":{"_eq":"${directusUser.id}"}}&fields=phone,kyc_status,created_at,phone_verified,email_verified,nationality,profile_photo`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (customUserRes.ok) {
            const data = await customUserRes.json()
            customUserData = data.data?.[0] || {}
          }
        } catch (error) {
          console.log('Could not fetch custom user data:', error)
        }
      }

      const combinedData = {
        first_name: directusUser.first_name || '',
        last_name: directusUser.last_name || '',
        email: directusUser.email || '',
        password: '',
        title: directusUser.title || '',
        description: directusUser.description || '',
        role: directusUser.role?.name || directusUser.role || '',
        status: directusUser.status || '',
        phone: customUserData.phone || '',
        kyc_status: customUserData.kyc_status || '',
        created_at: customUserData.created_at || directusUser.date_created || directusUser.created_at || '',
        phone_verified: customUserData.phone_verified || false,
        email_verified: customUserData.email_verified || false,
        nationality: customUserData.nationality || '',
        profile_photo: customUserData.profile_photo || ''
      }

      setProfileData(combinedData)
      setFormData(combinedData)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching profile data:', error)
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const token = getAuthToken()
      if (!token) return

      const formData = new FormData()
      formData.append('file', file)

      const uploadRes = await fetch('/api/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json().catch(() => ({}))
        const errorMsg = errorData.errors?.[0]?.message || 'Failed to upload photo'
        throw new Error(errorMsg)
      }

      const uploadData = await uploadRes.json()
      const photoId = uploadData.data.id

      const meRes = await fetch('/api/users/me?fields=id', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const meData = await meRes.json()
      const userId = meData.data.id

      const getUserRes = await fetch(`/api/items/users?filter={"user_id":{"_eq":"${userId}"}}&fields=id`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const userData = await getUserRes.json()

      if (userData.data && userData.data.length > 0) {
        const recordId = userData.data[0].id
        const updateRes = await fetch(`/api/items/users/${recordId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ profile_photo: photoId })
        })

        if (!updateRes.ok) {
          throw new Error('Failed to update profile photo')
        }
      } else {
        const createRes = await fetch('/api/items/users', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: userId,
            profile_photo: photoId
          })
        })

        if (!createRes.ok) {
          throw new Error('Failed to create user record with photo')
        }
      }

      fetchProfileData()
      window.dispatchEvent(new Event('authChange'))
    } catch (error) {
      console.error('Error uploading photo:', error)
      if (error.message.includes('permission')) {
        alert('Permission denied. Please contact administrator to enable file upload for your role.')
      } else {
        alert(`Failed to upload photo: ${error.message}`)
      }
    }
  }

  const handleSaveProfile = async () => {
    try {
      const token = getAuthToken()
      if (!token) return

      const directusFields = ['first_name', 'last_name', 'title', 'description']
      const directusUpdateData = {}
      directusFields.forEach(field => {
        if (formData[field] !== undefined && formData[field] !== profileData[field]) {
          directusUpdateData[field] = formData[field]
        }
      })

      if (Object.keys(directusUpdateData).length > 0) {
        const response = await fetch(`/api/users/me`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(directusUpdateData)
        })

        if (!response.ok) {
          throw new Error('Failed to update directus_users profile')
        }
      }

      const customFields = ['phone', 'nationality']
      const customUpdateData = {}
      customFields.forEach(field => {
        if (formData[field] !== undefined && formData[field] !== profileData[field]) {
          customUpdateData[field] = formData[field]
        }
      })

      if (Object.keys(customUpdateData).length > 0) {
        const meRes = await fetch(`/api/users/me?fields=id`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const meData = await meRes.json()
        const userId = meData.data.id

        const getUserRes = await fetch(`/api/items/users?filter={"user_id":{"_eq":"${userId}"}}&fields=id`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const userData = await getUserRes.json()

        if (userData.data && userData.data.length > 0) {
          const recordId = userData.data[0].id
          const updateRes = await fetch(`/api/items/users/${recordId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(customUpdateData)
          })

          if (!updateRes.ok) {
            throw new Error('Failed to update users collection')
          }
        } else {
          const createRes = await fetch(`/api/items/users`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_id: userId,
              ...customUpdateData
            })
          })

          if (!createRes.ok) {
            throw new Error('Failed to create users collection record')
          }
        }
      }

      setEditing(false)
      fetchProfileData()
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    )
  }

  const memberSince = profileData.created_at 
    ? new Date(profileData.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : 'N/A'

  return (
    <div className="shipper-profile">
      <div className="profile-header">
        <div className="profile-header-content">
          <div className="profile-avatar">
            {profilePhotoUrl ? (
              <img src={profilePhotoUrl} alt="Profile" />
            ) : (
              <span>{profileData.first_name?.[0]?.toUpperCase() || 'U'}</span>
            )}
            <label className="photo-upload-overlay" title="Upload profile photo">
              <span className="camera-icon">📷</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          <div className="profile-header-info">
            <h1>{profileData.first_name} {profileData.last_name}</h1>
            {profileData.title && <p className="profile-title">{profileData.title}</p>}
            <p className="profile-email">{profileData.email}</p>
            <div className="profile-badges">
              <span className={`badge badge-${profileData.kyc_status?.toLowerCase() || 'pending'}`}>
                {profileData.kyc_status === 'VERIFIED' ? 'Verified' : 'Pending Verification'}
              </span>
              <span className={`badge ${profileData.phone_verified ? 'badge-verified' : 'badge-pending'}`}>
                {profileData.phone_verified ? 'Phone Verified' : 'Phone Not Verified'}
              </span>
              <span className="badge badge-member">
                Member since {memberSince}
              </span>
            </div>
          </div>
          <div className="profile-actions">
            {editing ? (
              <>
                <button className="btn btn-primary" onClick={handleSaveProfile}>
                  Save Changes
                </button>
                <button className="btn btn-secondary" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={() => setEditing(true)}>
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <h2>Personal Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name || ''}
                onChange={handleInputChange}
                disabled={!editing}
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name || ''}
                onChange={handleInputChange}
                disabled={!editing}
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={profileData.email}
                disabled
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ''}
                onChange={handleInputChange}
                disabled={!editing}
                placeholder="+968-XXXXXXXX"
              />
            </div>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                name="title"
                value={formData.title || ''}
                onChange={handleInputChange}
                disabled={!editing}
                placeholder="e.g., Logistics Manager"
              />
            </div>
            <div className="form-group">
              <label>Nationality</label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality || ''}
                onChange={handleInputChange}
                disabled={!editing}
              />
            </div>
            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                disabled={!editing}
                rows="4"
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>

          <h2>Account Status</h2>
          <div className="status-grid">
            <div className="status-item">
              <label>Account Status</label>
              <span className={`status-badge status-${profileData.status?.toLowerCase()}`}>
                {profileData.status || 'N/A'}
              </span>
            </div>
            <div className="status-item">
              <label>KYC Status</label>
              <span className={`status-badge status-${profileData.kyc_status?.toLowerCase()}`}>
                {profileData.kyc_status || 'N/A'}
              </span>
            </div>
            <div className="status-item">
              <label>Email Verification</label>
              <span className={`status-badge ${profileData.email_verified ? 'status-verified' : 'status-pending'}`}>
                {profileData.email_verified ? 'Verified' : 'Not Verified'}
              </span>
            </div>
            <div className="status-item">
              <label>Role</label>
              <span className="status-badge status-info">
                {profileData.role || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

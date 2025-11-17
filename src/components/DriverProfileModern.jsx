import { useState, useEffect } from 'react'
import { getAuthToken, getStoredUser } from '../services/directusAuth'
import { 
  User, Mail, Phone, FileText, 
  Edit2, Save, X, Check, AlertCircle,
  Calendar, Shield, MapPin
} from 'lucide-react'

export default function DriverProfileModern() {
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [profileData, setProfileData] = useState({
    directusUser: {
      first_name: '',
      last_name: '',
      email: '',
      description: '',
      id: null
    },
    userProfile: {
      id: null,
      user_id: null,
      phone: '',
      user_type: '',
      kyc_status: '',
      email_verified: false,
      created_at: '',
      profile_photo: null
    },
    driverProfile: {
      id: null,
      user_id: null,
      license_number: '',
      license_expiry_date: '',
      driving_experience_years: 0,
      available_for_bidding: true,
      preferred_routes: null
    }
  })
  const [formData, setFormData] = useState({})

  useEffect(() => {
    loadProfileData()
  }, [])

  useEffect(() => {
    if (profileData.userProfile.profile_photo) {
      fetchProfilePhoto(profileData.userProfile.profile_photo)
    } else {
      setProfilePhotoUrl(null)
    }
  }, [profileData.userProfile.profile_photo])

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

  const loadProfileData = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      const storedUser = getStoredUser()

      if (!token || !storedUser) {
        console.error('No authentication found')
        return
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const [directusUserRes, userProfileRes, driverProfileRes] = await Promise.all([
        fetch(`/api/users/me?fields=id,first_name,last_name,email,description`, { headers }),
        fetch(`/api/items/users?filter={"user_id":{"_eq":"${storedUser.id}"}}&fields=id,user_id,phone,user_type,kyc_status,email_verified,created_at,profile_photo`, { headers }),
        fetch(`/api/items/driver_profiles?filter={"user_id":{"_eq":"${storedUser.id}"}}&fields=id,user_id,license_number,license_expiry_date,driving_experience_years,available_for_bidding,preferred_routes`, { headers })
      ])

      if (!directusUserRes.ok || !userProfileRes.ok || !driverProfileRes.ok) {
        console.error('API responses:', {
          directusUser: directusUserRes.status,
          userProfile: userProfileRes.status,
          driverProfile: driverProfileRes.status
        })
      }

      const directusUserData = await directusUserRes.json()
      const userProfileData = await userProfileRes.json()
      const driverProfileData = await driverProfileRes.json()

      const directusUser = directusUserData.data || {}
      const userProfile = userProfileData.data?.[0] || {}
      const driverProfile = driverProfileData.data?.[0] || {}

      setProfileData({
        directusUser: {
          first_name: directusUser.first_name || '',
          last_name: directusUser.last_name || '',
          email: directusUser.email || '',
          description: directusUser.description || '',
          id: directusUser.id
        },
        userProfile: {
          id: userProfile.id,
          user_id: userProfile.user_id,
          phone: userProfile.phone || '',
          user_type: userProfile.user_type || '',
          kyc_status: userProfile.kyc_status || '',
          email_verified: userProfile.email_verified || false,
          created_at: userProfile.created_at || '',
          profile_photo: userProfile.profile_photo || null
        },
        driverProfile: {
          id: driverProfile.id,
          user_id: driverProfile.user_id,
          license_number: driverProfile.license_number || '',
          license_expiry_date: driverProfile.license_expiry_date || '',
          driving_experience_years: driverProfile.driving_experience_years || 0,
          available_for_bidding: driverProfile.available_for_bidding !== undefined ? driverProfile.available_for_bidding : true,
          preferred_routes: driverProfile.preferred_routes || null
        }
      })

      setFormData({
        first_name: directusUser.first_name || '',
        last_name: directusUser.last_name || '',
        email: directusUser.email || '',
        description: directusUser.description || '',
        phone: userProfile.phone || '',
        license_number: driverProfile.license_number || '',
        license_expiry_date: driverProfile.license_expiry_date || '',
        driving_experience_years: driverProfile.driving_experience_years || 0,
        available_for_bidding: driverProfile.available_for_bidding !== undefined ? driverProfile.available_for_bidding : true,
        preferred_routes: driverProfile.preferred_routes ? JSON.stringify(driverProfile.preferred_routes, null, 2) : ''
      })

    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const token = getAuthToken()
      const storedUser = getStoredUser()

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const requests = [
        fetch(`/api/users/${storedUser.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            description: formData.description
          })
        })
      ]

      if (!profileData.userProfile.id) {
        requests.push(
          fetch(`/api/items/users`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              user_id: storedUser.id,
              phone: formData.phone
            })
          })
        )
      } else {
        requests.push(
          fetch(`/api/items/users/${profileData.userProfile.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              phone: formData.phone
            })
          })
        )
      }

      if (!profileData.driverProfile.id) {
        requests.push(
          fetch(`/api/items/driver_profiles`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              user_id: storedUser.id,
              license_number: formData.license_number,
              license_expiry_date: formData.license_expiry_date,
              driving_experience_years: parseInt(formData.driving_experience_years) || 0,
              available_for_bidding: formData.available_for_bidding,
              preferred_routes: formData.preferred_routes ? JSON.parse(formData.preferred_routes) : null
            })
          })
        )
      } else {
        requests.push(
          fetch(`/api/items/driver_profiles/${profileData.driverProfile.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              license_number: formData.license_number,
              license_expiry_date: formData.license_expiry_date,
              driving_experience_years: parseInt(formData.driving_experience_years) || 0,
              available_for_bidding: formData.available_for_bidding,
              preferred_routes: formData.preferred_routes ? JSON.parse(formData.preferred_routes) : null
            })
          })
        )
      }

      await Promise.all(requests)
      await loadProfileData()
      setEditing(false)
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Error saving profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      first_name: profileData.directusUser.first_name || '',
      last_name: profileData.directusUser.last_name || '',
      email: profileData.directusUser.email || '',
      description: profileData.directusUser.description || '',
      phone: profileData.userProfile.phone || '',
      license_number: profileData.driverProfile.license_number || '',
      license_expiry_date: profileData.driverProfile.license_expiry_date || '',
      driving_experience_years: profileData.driverProfile.driving_experience_years || 0,
      available_for_bidding: profileData.driverProfile.available_for_bidding,
      preferred_routes: profileData.driverProfile.preferred_routes ? JSON.stringify(profileData.driverProfile.preferred_routes, null, 2) : ''
    })
    setEditing(false)
  }

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const token = getAuthToken()
    if (!token) return

    setIsUploading(true)
    setUploadProgress(0)

    const formDataUpload = new FormData()
    formDataUpload.append('file', file)

    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100
        setUploadProgress(Math.round(percentComplete))
      }
    })

    xhr.addEventListener('load', async () => {
      try {
        if (xhr.status !== 200) {
          let errorMsg = 'Failed to upload photo'
          try {
            const errorData = JSON.parse(xhr.responseText)
            errorMsg = errorData.errors?.[0]?.message || errorMsg
          } catch {
            errorMsg = xhr.statusText || errorMsg
          }
          throw new Error(errorMsg)
        }

        const uploadData = JSON.parse(xhr.responseText)
        const photoId = uploadData.data.id

        setUploadProgress(100)

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

        await loadProfileData()
        window.dispatchEvent(new Event('authChange'))
        setIsUploading(false)
        setUploadProgress(0)
      } catch (error) {
        console.error('Error during photo upload:', error)
        if (error.message.includes('permission')) {
          alert('Permission denied. Please contact administrator to enable file upload for your role.')
        } else {
          alert(`Failed to upload photo: ${error.message}`)
        }
        setIsUploading(false)
        setUploadProgress(0)
      }
    })

    xhr.addEventListener('error', () => {
      console.error('Upload failed')
      alert('Failed to upload photo. Please try again.')
      setIsUploading(false)
      setUploadProgress(0)
    })

    xhr.open('POST', '/api/files')
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.send(formDataUpload)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-blue-100 text-blue-600 group">
                {profilePhotoUrl ? (
                  <img src={profilePhotoUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={32} />
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                    <div className="text-white text-xs font-semibold mb-1">{uploadProgress}%</div>
                    <div className="w-14 h-1 bg-black/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-400 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                {!isUploading && (
                  <label className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" title="Upload profile photo">
                    <span className="text-white text-2xl">📷</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      style={{ display: 'none' }}
                      disabled={isUploading}
                    />
                  </label>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  {profileData.directusUser.first_name} {profileData.directusUser.last_name}
                </h1>
                <p className="text-gray-500 mt-1">{profileData.directusUser.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                    profileData.userProfile.kyc_status === 'verified' 
                      ? 'bg-green-100 text-green-800' 
                      : profileData.userProfile.kyc_status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    KYC: {profileData.userProfile.kyc_status || 'Pending'}
                  </span>
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                    profileData.userProfile.email_verified
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    Email: {profileData.userProfile.email_verified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => editing ? handleCancel() : setEditing(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                editing
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {editing ? (
                <>
                  <X size={16} />
                  Cancel
                </>
              ) : (
                <>
                  <Edit2 size={16} />
                  Edit
                </>
              )}
            </button>
          </div>

          {editing && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>

        {/* Info Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Member Since</p>
              <p className="text-sm font-semibold text-gray-900">
                {profileData.userProfile.created_at 
                  ? new Date(profileData.userProfile.created_at).toLocaleDateString()
                  : '-'
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">User Type</p>
              <p className="text-sm font-semibold text-gray-900">{profileData.userProfile.user_type || 'Driver'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Available for Bidding</p>
              <p className={`text-sm font-semibold ${profileData.driverProfile.available_for_bidding ? 'text-green-600' : 'text-red-600'}`}>
                {profileData.driverProfile.available_for_bidding ? 'Yes' : 'No'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Experience</p>
              <p className="text-sm font-semibold text-gray-900">{profileData.driverProfile.driving_experience_years} years</p>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 py-2">{profileData.directusUser.first_name || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 py-2">{profileData.directusUser.last_name || '-'}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              {editing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 py-2">{profileData.directusUser.email || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              {editing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 py-2">{profileData.userProfile.phone || '-'}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio / Description</label>
              {editing ? (
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                />
              ) : (
                <p className="text-gray-900 py-2">{profileData.directusUser.description || '-'}</p>
              )}
            </div>
          </div>
        </div>

        {/* License Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">License Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 py-2">{profileData.driverProfile.license_number || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License Expiry Date</label>
              {editing ? (
                <input
                  type="date"
                  value={formData.license_expiry_date}
                  onChange={(e) => setFormData({ ...formData, license_expiry_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 py-2">{profileData.driverProfile.license_expiry_date || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Driving Experience (years)</label>
              {editing ? (
                <input
                  type="number"
                  value={formData.driving_experience_years}
                  onChange={(e) => setFormData({ ...formData, driving_experience_years: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 py-2">{profileData.driverProfile.driving_experience_years || 0} years</p>
              )}
            </div>
          </div>
        </div>

        {/* Availability & Routes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Availability & Routes</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Available for Bidding</label>
              {editing ? (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.available_for_bidding}
                    onChange={(e) => setFormData({ ...formData, available_for_bidding: e.target.checked })}
                    className="w-5 h-5 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">Available</span>
                </div>
              ) : (
                <p className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  profileData.driverProfile.available_for_bidding
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {profileData.driverProfile.available_for_bidding ? 'Available' : 'Unavailable'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Routes (JSON)</label>
              {editing ? (
                <textarea
                  value={formData.preferred_routes}
                  onChange={(e) => setFormData({ ...formData, preferred_routes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  rows="4"
                  placeholder='{"routes": ["Route A", "Route B"]}'
                />
              ) : (
                <p className="text-gray-900 py-2 text-sm font-mono whitespace-pre-wrap break-all">
                  {profileData.driverProfile.preferred_routes 
                    ? JSON.stringify(profileData.driverProfile.preferred_routes, null, 2)
                    : '-'
                  }
                </p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { getAuthToken, getStoredUser } from '../services/directusAuth'
import { 
  User, Mail, Phone, MapPin, Building2, FileText, 
  Edit2, Save, X, Upload, Check, AlertCircle,
  Flag, Hash, Calendar, Shield
} from 'lucide-react'

export default function ShipperProfileModern() {
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profileData, setProfileData] = useState({
    user: {
      first_name: '',
      last_name: '',
      email: '',
      avatar: null
    },
    profile: {
      phone: '',
      address: '',
      city: '',
      country: '',
      nationality: '',
      id_number: '',
      company_name: '',
      company_registration: '',
      tax_id: '',
      verification_status: 'pending'
    },
    stats: {
      total_shipments: 0,
      active_shipments: 0,
      completed_shipments: 0,
      total_spent: 0
    }
  })
  const [formData, setFormData] = useState({})

  useEffect(() => {
    loadProfileData()
  }, [])

  const loadProfileData = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      const user = getStoredUser()

      if (!token || !user) {
        console.error('No authentication found')
        return
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const [userRes, shipperProfileRes, shipmentsRes] = await Promise.all([
        fetch(`/api/users/${user.id}`, { headers }),
        fetch(`/api/items/shipper_profiles?filter[user_id][_eq]=${user.id}`, { headers }),
        fetch(`/api/items/shipments?filter[user_id][_eq]=${user.id}`, { headers })
      ])

      const userData = await userRes.json()
      const shipperData = await shipperProfileRes.json()
      const shipmentsData = await shipmentsRes.json()

      const shipperProfile = shipperData.data?.[0] || {}
      const shipments = shipmentsData.data || []

      const stats = {
        total_shipments: shipments.length,
        active_shipments: shipments.filter(s => s.status === 'active' || s.status === 'in_transit').length,
        completed_shipments: shipments.filter(s => s.status === 'delivered').length,
        total_spent: shipments.reduce((sum, s) => sum + (parseFloat(s.budget) || 0), 0)
      }

      setProfileData({
        user: userData.data,
        profile: shipperProfile,
        stats
      })

      setFormData({
        first_name: userData.data.first_name || '',
        last_name: userData.data.last_name || '',
        email: userData.data.email || '',
        phone: shipperProfile.phone || '',
        address: shipperProfile.address || '',
        city: shipperProfile.city || '',
        country: shipperProfile.country || '',
        nationality: shipperProfile.nationality || '',
        id_number: shipperProfile.id_number || '',
        company_name: shipperProfile.company_name || '',
        company_registration: shipperProfile.company_registration || '',
        tax_id: shipperProfile.tax_id || ''
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
      const user = getStoredUser()

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      await Promise.all([
        fetch(`/api/users/${user.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email
          })
        }),
        fetch(`/api/items/shipper_profiles/${profileData.profile.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            country: formData.country,
            nationality: formData.nationality,
            id_number: formData.id_number,
            company_name: formData.company_name,
            company_registration: formData.company_registration,
            tax_id: formData.tax_id
          })
        })
      ])

      await loadProfileData()
      setEditing(false)
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      first_name: profileData.user.first_name || '',
      last_name: profileData.user.last_name || '',
      email: profileData.user.email || '',
      phone: profileData.profile.phone || '',
      address: profileData.profile.address || '',
      city: profileData.profile.city || '',
      country: profileData.profile.country || '',
      nationality: profileData.profile.nationality || '',
      id_number: profileData.profile.id_number || '',
      company_name: profileData.profile.company_name || '',
      company_registration: profileData.profile.company_registration || '',
      tax_id: profileData.profile.tax_id || ''
    })
    setEditing(false)
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
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                <User size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  {profileData.user.first_name} {profileData.user.last_name}
                </h1>
                <p className="text-gray-500 mt-1">{profileData.user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  {profileData.profile.verification_status === 'verified' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded">
                      <Check size={12} />
                      Verified
                    </span>
                  )}
                  {profileData.profile.verification_status === 'pending' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 text-xs font-medium rounded">
                      <AlertCircle size={12} />
                      Pending Verification
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit2 size={16} />
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Save size={16} />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Total Shipments</p>
            <p className="text-2xl font-semibold text-gray-900">{profileData.stats.total_shipments}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Active</p>
            <p className="text-2xl font-semibold text-blue-600">{profileData.stats.active_shipments}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Completed</p>
            <p className="text-2xl font-semibold text-green-600">{profileData.stats.completed_shipments}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Total Spent</p>
            <p className="text-2xl font-semibold text-gray-900">${profileData.stats.total_spent.toLocaleString()}</p>
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
                <p className="text-gray-900 py-2">{profileData.user.first_name || '-'}</p>
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
                <p className="text-gray-900 py-2">{profileData.user.last_name || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              {editing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 py-2">{profileData.user.email || '-'}</p>
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
                <p className="text-gray-900 py-2">{profileData.profile.phone || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 py-2">{profileData.profile.nationality || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.id_number}
                  onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 py-2">{profileData.profile.id_number || '-'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 py-2">{profileData.profile.address || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 py-2">{profileData.profile.city || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 py-2">{profileData.profile.country || '-'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Business Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 py-2">{profileData.profile.company_name || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.company_registration}
                  onChange={(e) => setFormData({ ...formData, company_registration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 py-2">{profileData.profile.company_registration || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.tax_id}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 py-2">{profileData.profile.tax_id || '-'}</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

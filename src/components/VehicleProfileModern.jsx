import { useState, useEffect, useCallback } from 'react'
import { getAuthToken, getStoredUser } from '../services/directusAuth'
import { 
  Truck, Edit2, Save, X, AlertCircle, 
  CheckCircle, Calendar, Shield, Zap, Plus, Trash2, Upload
} from 'lucide-react'

export default function VehicleProfileModern() {
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [vehicles, setVehicles] = useState([])
  const [selectedVehicleId, setSelectedVehicleId] = useState(null)
  const [vehicleData, setVehicleData] = useState(null)
  const [formData, setFormData] = useState({})
  const [isCreating, setIsCreating] = useState(false)
  const [vehiclePhotoFile, setVehiclePhotoFile] = useState(null)
  const [vehiclePhotoPreview, setVehiclePhotoPreview] = useState(null)

  const loadVehicles = useCallback(async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      const storedUser = getStoredUser()

      if (!token || !storedUser) {
        console.error('No authentication found')
        setLoading(false)
        return
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const response = await fetch(
        `/api/items/vehicle_profiles?filter[user_id][_eq]=${storedUser.id}`,
        { headers }
      )

      if (!response.ok) {
        console.error('Failed to fetch vehicles:', response.status)
        setLoading(false)
        return
      }

      const data = await response.json()
      setVehicles(data.data || [])
      
      if (data.data && data.data.length > 0) {
        setSelectedVehicleId(data.data[0].id)
        await loadVehicleData(data.data[0].id)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error loading vehicles:', error)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadVehicles()
  }, [loadVehicles])

  const loadVehicleData = async (vehicleId) => {
    try {
      const token = getAuthToken()
      if (!token) return

      const response = await fetch(
        `/api/items/vehicle_profiles/${vehicleId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )

      if (!response.ok) {
        console.error('Failed to fetch vehicle details:', response.status)
        return
      }

      const data = await response.json()
      const vehicle = data.data

      setVehicleData(vehicle)
      setFormData({
        vehicle_type: vehicle.vehicle_type || '',
        license_plate: vehicle.license_plate || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        model_year: vehicle.model_year || '',
        color: vehicle.color || '',
        capacity_kg: vehicle.capacity_kg || '',
        capacity_cbm: vehicle.capacity_cbm || '',
        registration_number: vehicle.registration_number || '',
        registration_expiry: vehicle.registration_expiry || '',
        insurance_provider: vehicle.insurance_provider || '',
        insurance_policy_number: vehicle.insurance_policy_number || '',
        insurance_expiry: vehicle.insurance_expiry || '',
        vehicle_condition: vehicle.vehicle_condition || '',
        is_active: vehicle.is_active !== undefined ? vehicle.is_active : true,
        last_inspection_date: vehicle.last_inspection_date || '',
        inspection_expiry_date: vehicle.inspection_expiry_date || '',
        documents_verified: vehicle.documents_verified || false,
        document_expiry_alerts_enabled: vehicle.document_expiry_alerts_enabled !== undefined ? vehicle.document_expiry_alerts_enabled : true
      })

      if (vehicle.vehicle_photo) {
        try {
          const photoRes = await fetch(`/api/assets/${vehicle.vehicle_photo}`, { headers: { 'Authorization': `Bearer ${token}` } })
          if (photoRes.ok) {
            const blob = await photoRes.blob()
            setVehiclePhotoPreview(URL.createObjectURL(blob))
          }
        } catch (error) {
          console.error('Error fetching vehicle photo:', error)
        }
      } else {
        setVehiclePhotoPreview(null)
      }
      setVehiclePhotoFile(null)
    } catch (error) {
      console.error('Error loading vehicle data:', error)
    }
  }

  const handleVehicleSelect = (vehicleId) => {
    if (!editing && !isCreating) {
      setSelectedVehicleId(vehicleId)
      loadVehicleData(vehicleId)
    }
  }

  const handleCreateNew = () => {
    setIsCreating(true)
    setSelectedVehicleId(null)
    setVehicleData(null)
    setFormData({
      vehicle_type: '',
      license_plate: '',
      make: '',
      model: '',
      model_year: '',
      color: '',
      capacity_kg: '',
      capacity_cbm: '',
      registration_number: '',
      registration_expiry: '',
      insurance_provider: '',
      insurance_policy_number: '',
      insurance_expiry: '',
      vehicle_condition: '',
      is_active: true,
      last_inspection_date: '',
      inspection_expiry_date: '',
      documents_verified: false,
      document_expiry_alerts_enabled: true
    })
    setVehiclePhotoFile(null)
    setVehiclePhotoPreview(null)
    setEditing(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const token = getAuthToken()
      const storedUser = getStoredUser()

      let vehiclePhotoId = vehicleData?.vehicle_photo || null

      if (vehiclePhotoFile) {
        try {
          const formDataPhoto = new FormData()
          formDataPhoto.append('file', vehiclePhotoFile)

          const uploadRes = await fetch('/api/files', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formDataPhoto
          })

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json()
            vehiclePhotoId = uploadData.data?.id
          }
        } catch (error) {
          console.error('Error uploading vehicle photo:', error)
        }
      }

      const payload = {
        vehicle_type: formData.vehicle_type,
        license_plate: formData.license_plate,
        make: formData.make,
        model: formData.model,
        model_year: formData.model_year ? parseInt(formData.model_year) : null,
        color: formData.color,
        capacity_kg: formData.capacity_kg ? parseInt(formData.capacity_kg) : null,
        capacity_cbm: formData.capacity_cbm ? parseFloat(formData.capacity_cbm) : null,
        registration_number: formData.registration_number,
        registration_expiry: formData.registration_expiry || null,
        insurance_provider: formData.insurance_provider,
        insurance_policy_number: formData.insurance_policy_number,
        insurance_expiry: formData.insurance_expiry || null,
        vehicle_condition: formData.vehicle_condition,
        is_active: formData.is_active,
        last_inspection_date: formData.last_inspection_date || null,
        inspection_expiry_date: formData.inspection_expiry_date || null,
        documents_verified: formData.documents_verified,
        document_expiry_alerts_enabled: formData.document_expiry_alerts_enabled,
        vehicle_photo: vehiclePhotoId
      }

      if (isCreating) {
        payload.user_id = storedUser?.id || null
      }

      const method = isCreating ? 'POST' : 'PATCH'
      const url = isCreating 
        ? `/api/items/vehicle_profiles`
        : `/api/items/vehicle_profiles/${selectedVehicleId}`

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Failed to save vehicle')
      }

      await loadVehicles()
      setEditing(false)
      setIsCreating(false)
    } catch (error) {
      console.error('Error saving vehicle:', error)
      alert('Error saving vehicle. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (isCreating) {
      setIsCreating(false)
      setEditing(false)
    } else if (vehicleData) {
      setFormData({
        vehicle_type: vehicleData.vehicle_type || '',
        license_plate: vehicleData.license_plate || '',
        make: vehicleData.make || '',
        model: vehicleData.model || '',
        model_year: vehicleData.model_year || '',
        color: vehicleData.color || '',
        capacity_kg: vehicleData.capacity_kg || '',
        capacity_cbm: vehicleData.capacity_cbm || '',
        registration_number: vehicleData.registration_number || '',
        registration_expiry: vehicleData.registration_expiry || '',
        insurance_provider: vehicleData.insurance_provider || '',
        insurance_policy_number: vehicleData.insurance_policy_number || '',
        insurance_expiry: vehicleData.insurance_expiry || '',
        vehicle_condition: vehicleData.vehicle_condition || '',
        is_active: vehicleData.is_active !== undefined ? vehicleData.is_active : true,
        last_inspection_date: vehicleData.last_inspection_date || '',
        inspection_expiry_date: vehicleData.inspection_expiry_date || '',
        documents_verified: vehicleData.documents_verified || false,
        document_expiry_alerts_enabled: vehicleData.document_expiry_alerts_enabled !== undefined ? vehicleData.document_expiry_alerts_enabled : true
      })
      setVehiclePhotoFile(null)
      setEditing(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(true)
      const token = getAuthToken()

      const response = await fetch(
        `/api/items/vehicle_profiles/${selectedVehicleId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to delete vehicle')
      }

      await loadVehicles()
    } catch (error) {
      console.error('Error deleting vehicle:', error)
      alert('Error deleting vehicle. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const isExpired = (date) => {
    if (!date) return false
    return new Date(date) < new Date()
  }

  const daysUntilExpiry = (date) => {
    if (!date) return null
    const today = new Date()
    const expiry = new Date(date)
    const days = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
    return days
  }

  const handleVehiclePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setVehiclePhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setVehiclePhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vehicles...</p>
        </div>
      </div>
    )
  }

  if (isCreating) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Create New Vehicle</h1>
                <p className="text-gray-500 mt-1">Add a new vehicle to your profile</p>
              </div>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <X size={16} />
                Cancel
              </button>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 mb-6"
            >
              <Save size={16} />
              {saving ? 'Creating...' : 'Create Vehicle'}
            </button>
          </div>

          {/* Vehicle Photo */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Photo</h2>
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6">
              {vehiclePhotoPreview ? (
                <div className="relative w-full">
                  <img src={vehiclePhotoPreview} alt="Vehicle preview" className="w-full h-48 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => {
                      setVehiclePhotoFile(null)
                      setVehiclePhotoPreview(null)
                    }}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    Remove Photo
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 mb-2">Click to upload vehicle photo</p>
                  <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                    Choose File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleVehiclePhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                <select
                  value={formData.vehicle_type}
                  onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select type</option>
                  <option value="Truck">Truck</option>
                  <option value="Van">Van</option>
                  <option value="Pickup">Pickup</option>
                  <option value="Trailer">Trailer</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License Plate</label>
                <input
                  type="text"
                  value={formData.license_plate}
                  onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., ABC-1234"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                <input
                  type="text"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Volvo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., FH16"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model Year</label>
                <input
                  type="number"
                  value={formData.model_year}
                  onChange={(e) => setFormData({ ...formData, model_year: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 2020"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., White"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Condition</label>
                <select
                  value={formData.vehicle_condition}
                  onChange={(e) => setFormData({ ...formData, vehicle_condition: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select condition</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
            </div>
          </div>

          {/* Capacity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Zap size={20} />
              Capacity
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight Capacity (kg)</label>
                <input
                  type="number"
                  value={formData.capacity_kg}
                  onChange={(e) => setFormData({ ...formData, capacity_kg: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 20000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Volume Capacity (CBM)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.capacity_cbm}
                  onChange={(e) => setFormData({ ...formData, capacity_cbm: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 65.5"
                />
              </div>
            </div>
          </div>

          {/* Registration */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={20} />
              Registration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                <input
                  type="text"
                  value={formData.registration_number}
                  onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Expiry Date</label>
                <input
                  type="date"
                  value={formData.registration_expiry}
                  onChange={(e) => setFormData({ ...formData, registration_expiry: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Insurance */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield size={20} />
              Insurance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Provider</label>
                <input
                  type="text"
                  value={formData.insurance_provider}
                  onChange={(e) => setFormData({ ...formData, insurance_provider: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Policy Number</label>
                <input
                  type="text"
                  value={formData.insurance_policy_number}
                  onChange={(e) => setFormData({ ...formData, insurance_policy_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Expiry Date</label>
                <input
                  type="date"
                  value={formData.insurance_expiry}
                  onChange={(e) => setFormData({ ...formData, insurance_expiry: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Inspection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle size={20} />
              Inspection
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Inspection Date</label>
                <input
                  type="date"
                  value={formData.last_inspection_date}
                  onChange={(e) => setFormData({ ...formData, last_inspection_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Expiry Date</label>
                <input
                  type="date"
                  value={formData.inspection_expiry_date}
                  onChange={(e) => setFormData({ ...formData, inspection_expiry_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Status & Alerts */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status & Alerts</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Active Status</label>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Documents Verified</label>
                <input
                  type="checkbox"
                  checked={formData.documents_verified}
                  onChange={(e) => setFormData({ ...formData, documents_verified: e.target.checked })}
                  className="w-5 h-5 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Expiry Alerts</label>
                <input
                  type="checkbox"
                  checked={formData.document_expiry_alerts_enabled}
                  onChange={(e) => setFormData({ ...formData, document_expiry_alerts_enabled: e.target.checked })}
                  className="w-5 h-5 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (vehicles.length === 0 || !vehicleData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <Truck size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Vehicles</h2>
            <p className="text-gray-600 mb-6">You haven't added any vehicles yet.</p>
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <Plus size={20} />
              Add Your First Vehicle
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Vehicle Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {vehicles.map((vehicle) => (
            <button
              key={vehicle.id}
              onClick={() => handleVehicleSelect(vehicle.id)}
              disabled={editing}
              className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-all ${
                selectedVehicleId === vehicle.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
              } disabled:opacity-50`}
            >
              <span className="flex items-center gap-2">
                <Truck size={16} />
                {vehicle.license_plate || `Vehicle ${vehicle.id}`}
              </span>
            </button>
          ))}
          <button
            onClick={handleCreateNew}
            disabled={editing}
            className="px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-all bg-white text-gray-700 border border-gray-200 hover:border-gray-300 disabled:opacity-50"
          >
            <span className="flex items-center gap-2">
              <Plus size={16} />
              Add Vehicle
            </span>
          </button>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden flex items-center justify-center bg-blue-100 text-blue-600">
                {vehiclePhotoPreview ? (
                  <img src={vehiclePhotoPreview} alt="Vehicle" className="w-full h-full object-cover" />
                ) : (
                  <Truck size={40} />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  {vehicleData.make && vehicleData.model 
                    ? `${vehicleData.make} ${vehicleData.model}` 
                    : vehicleData.vehicle_type || 'Vehicle'}
                </h1>
                <p className="text-gray-500 mt-1">{vehicleData.license_plate || 'No license plate'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                    vehicleData.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {vehicleData.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                    vehicleData.documents_verified
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    Documents: {vehicleData.documents_verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
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
              <button
                onClick={handleDelete}
                disabled={editing || deleting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 size={16} />
                {deleting ? 'Deleting...' : 'Remove'}
              </button>
            </div>
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

        {/* Vehicle Photo Section - Edit Mode */}
        {editing && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Photo</h2>
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6">
              {vehiclePhotoPreview ? (
                <div className="relative w-full">
                  <img src={vehiclePhotoPreview} alt="Vehicle preview" className="w-full h-48 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => {
                      setVehiclePhotoFile(null)
                      setVehiclePhotoPreview(null)
                    }}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    Remove Photo
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 mb-2">Click to upload vehicle photo</p>
                  <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                    Choose File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleVehiclePhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Alerts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {vehicleData.registration_expiry && isExpired(vehicleData.registration_expiry) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Registration Expired</h3>
                <p className="text-sm text-red-700">Your vehicle registration expired on {new Date(vehicleData.registration_expiry).toLocaleDateString()}</p>
              </div>
            </div>
          )}

          {vehicleData.insurance_expiry && isExpired(vehicleData.insurance_expiry) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Insurance Expired</h3>
                <p className="text-sm text-red-700">Your vehicle insurance expired on {new Date(vehicleData.insurance_expiry).toLocaleDateString()}</p>
              </div>
            </div>
          )}

          {vehicleData.inspection_expiry_date && isExpired(vehicleData.inspection_expiry_date) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Inspection Overdue</h3>
                <p className="text-sm text-red-700">Vehicle inspection expired on {new Date(vehicleData.inspection_expiry_date).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>

        {/* Vehicle Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
              {editing ? (
                <select
                  value={formData.vehicle_type}
                  onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select type</option>
                  <option value="Truck">Truck</option>
                  <option value="Van">Van</option>
                  <option value="Pickup">Pickup</option>
                  <option value="Trailer">Trailer</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <p className="text-gray-900 py-2">{vehicleData.vehicle_type || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License Plate</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.license_plate}
                  onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., ABC-1234"
                />
              ) : (
                <p className="text-gray-900 py-2">{vehicleData.license_plate || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Volvo"
                />
              ) : (
                <p className="text-gray-900 py-2">{vehicleData.make || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., FH16"
                />
              ) : (
                <p className="text-gray-900 py-2">{vehicleData.model || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model Year</label>
              {editing ? (
                <input
                  type="number"
                  value={formData.model_year}
                  onChange={(e) => setFormData({ ...formData, model_year: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 2020"
                />
              ) : (
                <p className="text-gray-900 py-2">{vehicleData.model_year || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., White"
                />
              ) : (
                <p className="text-gray-900 py-2">{vehicleData.color || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Condition</label>
              {editing ? (
                <select
                  value={formData.vehicle_condition}
                  onChange={(e) => setFormData({ ...formData, vehicle_condition: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select condition</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              ) : (
                <p className="text-gray-900 py-2">{vehicleData.vehicle_condition || '-'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Capacity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap size={20} />
            Capacity
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight Capacity (kg)</label>
              {editing ? (
                <input
                  type="number"
                  value={formData.capacity_kg}
                  onChange={(e) => setFormData({ ...formData, capacity_kg: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 20000"
                />
              ) : (
                <p className="text-gray-900 py-2">{vehicleData.capacity_kg ? `${vehicleData.capacity_kg} kg` : '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Volume Capacity (CBM)</label>
              {editing ? (
                <input
                  type="number"
                  step="0.1"
                  value={formData.capacity_cbm}
                  onChange={(e) => setFormData({ ...formData, capacity_cbm: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 65.5"
                />
              ) : (
                <p className="text-gray-900 py-2">{vehicleData.capacity_cbm ? `${vehicleData.capacity_cbm} CBM` : '-'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Registration */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar size={20} />
            Registration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.registration_number}
                  onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 py-2">{vehicleData.registration_number || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registration Expiry Date</label>
              {editing ? (
                <input
                  type="date"
                  value={formData.registration_expiry}
                  onChange={(e) => setFormData({ ...formData, registration_expiry: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div>
                  <p className="text-gray-900 py-2">{vehicleData.registration_expiry ? new Date(vehicleData.registration_expiry).toLocaleDateString() : '-'}</p>
                  {vehicleData.registration_expiry && daysUntilExpiry(vehicleData.registration_expiry) && (
                    <p className={`text-xs ${daysUntilExpiry(vehicleData.registration_expiry) <= 30 ? 'text-red-600' : 'text-gray-500'}`}>
                      {daysUntilExpiry(vehicleData.registration_expiry)} days remaining
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Insurance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield size={20} />
            Insurance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Provider</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.insurance_provider}
                  onChange={(e) => setFormData({ ...formData, insurance_provider: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 py-2">{vehicleData.insurance_provider || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Policy Number</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.insurance_policy_number}
                  onChange={(e) => setFormData({ ...formData, insurance_policy_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 py-2">{vehicleData.insurance_policy_number || '-'}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Expiry Date</label>
              {editing ? (
                <input
                  type="date"
                  value={formData.insurance_expiry}
                  onChange={(e) => setFormData({ ...formData, insurance_expiry: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div>
                  <p className="text-gray-900 py-2">{vehicleData.insurance_expiry ? new Date(vehicleData.insurance_expiry).toLocaleDateString() : '-'}</p>
                  {vehicleData.insurance_expiry && daysUntilExpiry(vehicleData.insurance_expiry) && (
                    <p className={`text-xs ${daysUntilExpiry(vehicleData.insurance_expiry) <= 30 ? 'text-red-600' : 'text-gray-500'}`}>
                      {daysUntilExpiry(vehicleData.insurance_expiry)} days remaining
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inspection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle size={20} />
            Inspection
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Inspection Date</label>
              {editing ? (
                <input
                  type="date"
                  value={formData.last_inspection_date}
                  onChange={(e) => setFormData({ ...formData, last_inspection_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 py-2">{vehicleData.last_inspection_date ? new Date(vehicleData.last_inspection_date).toLocaleDateString() : '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Expiry Date</label>
              {editing ? (
                <input
                  type="date"
                  value={formData.inspection_expiry_date}
                  onChange={(e) => setFormData({ ...formData, inspection_expiry_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div>
                  <p className="text-gray-900 py-2">{vehicleData.inspection_expiry_date ? new Date(vehicleData.inspection_expiry_date).toLocaleDateString() : '-'}</p>
                  {vehicleData.inspection_expiry_date && daysUntilExpiry(vehicleData.inspection_expiry_date) && (
                    <p className={`text-xs ${daysUntilExpiry(vehicleData.inspection_expiry_date) <= 30 ? 'text-red-600' : 'text-gray-500'}`}>
                      {daysUntilExpiry(vehicleData.inspection_expiry_date)} days remaining
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status & Alerts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status & Alerts</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Active Status</label>
              {editing ? (
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  vehicleData.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {vehicleData.is_active ? 'Active' : 'Inactive'}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Documents Verified</label>
              {editing ? (
                <input
                  type="checkbox"
                  checked={formData.documents_verified}
                  onChange={(e) => setFormData({ ...formData, documents_verified: e.target.checked })}
                  className="w-5 h-5 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  vehicleData.documents_verified
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {vehicleData.documents_verified ? 'Verified' : 'Pending'}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Expiry Alerts</label>
              {editing ? (
                <input
                  type="checkbox"
                  checked={formData.document_expiry_alerts_enabled}
                  onChange={(e) => setFormData({ ...formData, document_expiry_alerts_enabled: e.target.checked })}
                  className="w-5 h-5 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  vehicleData.document_expiry_alerts_enabled
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {vehicleData.document_expiry_alerts_enabled ? 'Enabled' : 'Disabled'}
                </span>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

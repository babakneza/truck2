import { useState, useEffect, useCallback } from 'react'
import { getAuthToken, getStoredUser } from '../services/directusAuth'
import ShipmentMap from './ShipmentMap'
import {
  ArrowLeft, MapPin, Calendar, Weight, Zap, DollarSign, Clock,
  Truck, Shield, CreditCard, FileText, AlertCircle, X, Edit2,
  Trash2, Send, Check, Star, User, MessageCircle, Phone
} from 'lucide-react'

function DriverProfileCard({ bid }) {
  const driverName = bid.user_id?.first_name && bid.user_id?.last_name 
    ? `${bid.user_id.first_name} ${bid.user_id.last_name}`
    : bid.user_id?.name || 'Driver'

  return (
    <div className="rounded-2xl overflow-hidden shadow-md bg-gradient-to-br from-blue-400 to-blue-600 w-48 flex-shrink-0">
      <div 
        className="h-20 bg-gradient-to-br from-blue-500 to-indigo-600 bg-cover bg-center"
        style={{}}
      ></div>
      <div className="flex justify-center -mt-8">
        <div className="w-28 h-28 rounded-full border-solid border-white border-4 bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
          {bid.driverProfile?.profilePhoto ? (
            <img src={bid.driverProfile.profilePhoto} alt={driverName} className="w-full h-full object-cover" />
          ) : (
            <span>{driverName.charAt(0)}</span>
          )}
        </div>
      </div>
      <div className="text-center px-3 pb-4 pt-3">
        <h3 className="text-white text-sm font-bold font-sans truncate">{driverName}</h3>
        <p className="mt-1 font-sans font-light text-blue-100 text-xs">✓ Verified Driver</p>
      </div>
      <div className="flex justify-center pb-3 text-white px-3">
        <div className="text-center mr-2 border-r pr-2 flex-1">
          <h2 className="text-lg font-bold">4.8</h2>
          <span className="text-xs text-blue-100">Rating</span>
        </div>
        <div className="text-center flex-1">
          <h2 className="text-lg font-bold">42</h2>
          <span className="text-xs text-blue-100">Jobs</span>
        </div>
      </div>
      {bid.driverProfile?.phone && (
        <div className="px-3 pb-3">
          <button className="w-full flex items-center justify-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-2 rounded-lg font-medium transition text-sm">
            <Phone className="w-4 h-4" />
            {bid.driverProfile.phone}
          </button>
        </div>
      )}
    </div>
  )
}

export default function ShipmentDetailsForBidding({ shipmentId, onBack }) {
  const [activeTab, setActiveTab] = useState('all-bids')
  const [shipment, setShipment] = useState(null)
  const [allBids, setAllBids] = useState([])
  const [myBid, setMyBid] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showBidForm, setShowBidForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)

  const [formData, setFormData] = useState({
    quotedPrice: '',
    etaDatetime: '',
    durationHours: '',
    vehicleType: '',
    specialHandling: '',
    insuranceCoverage: '',
    paymentTerms: 'upon_delivery',
    notes: ''
  })

  const [validationErrors, setValidationErrors] = useState({})

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      const user = getStoredUser()

      if (!token || !user) {
        console.error('No authentication found')
        setLoading(false)
        return
      }

      if (!shipmentId) {
        console.error('No shipment ID provided')
        setLoading(false)
        return
      }

      const shipmentFilter = encodeURIComponent(JSON.stringify({
        id: { _eq: shipmentId }
      }))

      const shipmentRes = await fetch(`/api/items/shipments?filter=${shipmentFilter}&fields=*`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (shipmentRes.ok) {
        const shipmentData = await shipmentRes.json()
        const shipment = shipmentData.data?.[0] || null
        if (shipment) {
          setShipment(shipment)
        } else {
          console.warn('Shipment data is empty for ID:', shipmentId)
        }
      } else {
        console.error('Failed to load shipment:', shipmentRes.status)
      }

      const bidsFilter = encodeURIComponent(JSON.stringify({
        shipment_id: { _eq: shipmentId }
      }))

      const bidsRes = await fetch(`/api/items/bids?filter=${bidsFilter}&fields=*,user_id.*`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (bidsRes.ok) {
        const bidsData = await bidsRes.json()
        const bids = bidsData.data || []
        
        const bidsWithProfiles = await Promise.all(
          bids.map(async (bid) => {
            try {
              if (bid.user_id?.id) {
                const userFilter = encodeURIComponent(JSON.stringify({
                  user_id: { _eq: bid.user_id.id }
                }))
                const profileRes = await fetch(`/api/items/users?filter=${userFilter}&fields=phone,profile_photo`, { 
                  headers: { 'Authorization': `Bearer ${token}` } 
                })
                if (profileRes.ok) {
                  const profileData = await profileRes.json()
                  const userProfile = profileData.data?.[0] || {}
                  
                  let profilePhotoUrl = null
                  if (userProfile.profile_photo) {
                    try {
                      const photoRes = await fetch(`/api/assets/${userProfile.profile_photo}`, { 
                        headers: { 'Authorization': `Bearer ${token}` } 
                      })
                      if (photoRes.ok) {
                        const blob = await photoRes.blob()
                        profilePhotoUrl = URL.createObjectURL(blob)
                      }
                    } catch (error) {
                      console.error('Error fetching profile photo:', error)
                    }
                  }
                  
                  return {
                    ...bid,
                    driverProfile: {
                      phone: userProfile.phone || '',
                      profilePhoto: profilePhotoUrl
                    }
                  }
                }
              }
              return bid
            } catch (error) {
              console.error('Error fetching driver profile:', error)
              return bid
            }
          })
        )
        
        const myBidData = bidsWithProfiles.find(bid => bid.user_id?.id === user.id)
        setMyBid(myBidData || null)
        
        const otherBids = bidsWithProfiles.filter(bid => bid.user_id?.id !== user.id)
        setAllBids(otherBids)
      } else {
        console.error('Failed to load bids:', bidsRes.status)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }, [shipmentId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const validateBidForm = () => {
    const errors = {}

    if (!formData.quotedPrice || parseFloat(formData.quotedPrice) <= 0) {
      errors.quotedPrice = 'Please enter a valid price'
    }

    if (!formData.etaDatetime) {
      errors.etaDatetime = 'ETA is required'
    }

    if (!formData.durationHours || parseFloat(formData.durationHours) <= 0) {
      errors.durationHours = 'Duration must be greater than 0'
    }

    if (!formData.vehicleType) {
      errors.vehicleType = 'Please select a vehicle type'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handlePlaceBid = async () => {
    if (!validateBidForm()) return

    try {
      const token = getAuthToken()
      const user = getStoredUser()

      if (!token || !user) {
        alert('Authentication failed')
        return
      }

      const bidData = {
        user_id: user.id,
        shipment_id: shipmentId,
        quoted_price: parseFloat(formData.quotedPrice),
        eta_datetime: formData.etaDatetime,
        duration_hours: parseFloat(formData.durationHours),
        vehicle_type: formData.vehicleType,
        special_handling: formData.specialHandling || null,
        insurance_coverage: formData.insuranceCoverage || null,
        payment_terms: formData.paymentTerms,
        notes: formData.notes || null,
        status: 'pending'
      }

      const response = await fetch('/api/items/bids', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bidData)
      })

      if (response.ok) {
        alert('Bid placed successfully!')
        resetForm()
        setShowBidForm(false)
        loadData()
      } else {
        alert('Failed to place bid')
      }
    } catch (error) {
      console.error('Error placing bid:', error)
      alert('Error placing bid')
    }
  }

  const handleEditBid = async () => {
    if (!validateBidForm()) return

    try {
      const token = getAuthToken()

      const bidData = {
        quoted_price: parseFloat(formData.quotedPrice),
        eta_datetime: formData.etaDatetime,
        duration_hours: parseFloat(formData.durationHours),
        vehicle_type: formData.vehicleType,
        special_handling: formData.specialHandling || null,
        insurance_coverage: formData.insuranceCoverage || null,
        payment_terms: formData.paymentTerms,
        notes: formData.notes || null
      }

      const response = await fetch(`/api/items/bids/${myBid.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bidData)
      })

      if (response.ok) {
        alert('Bid updated successfully!')
        resetForm()
        setShowEditForm(false)
        loadData()
      }
    } catch (error) {
      console.error('Error updating bid:', error)
      alert('Error updating bid')
    }
  }

  const handleDeleteBid = async () => {
    if (!window.confirm('Are you sure you want to delete this bid?')) return

    try {
      const token = getAuthToken()

      const response = await fetch(`/api/items/bids/${myBid.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        alert('Bid deleted successfully')
        loadData()
      }
    } catch (error) {
      console.error('Error deleting bid:', error)
    }
  }

  const openEditForm = () => {
    if (myBid) {
      setFormData({
        quotedPrice: myBid.quoted_price.toString(),
        etaDatetime: myBid.eta_datetime,
        durationHours: myBid.duration_hours.toString(),
        vehicleType: myBid.vehicle_type,
        specialHandling: myBid.special_handling || '',
        insuranceCoverage: myBid.insurance_coverage || '',
        paymentTerms: myBid.payment_terms,
        notes: myBid.notes || ''
      })
      setShowEditForm(true)
    }
  }

  const resetForm = () => {
    setFormData({
      quotedPrice: '',
      etaDatetime: '',
      durationHours: '',
      vehicleType: '',
      specialHandling: '',
      insuranceCoverage: '',
      paymentTerms: 'upon_delivery',
      notes: ''
    })
    setValidationErrors({})
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading shipment details...</p>
        </div>
      </div>
    )
  }

  if (!shipment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-8">
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Shipment not found</p>
          </div>
        </div>
      </div>
    )
  }

  const pickup = shipment.pickup_address || 'Unknown'
  const dropoff = shipment.delivery_address || 'Unknown'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-8 font-medium">
          <ArrowLeft className="w-5 h-5" />
          Back to Shipments
        </button>

        {shipment?.pickup_location && shipment?.delivery_location && (
          <div className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ height: '400px' }}>
            <ShipmentMap
              pickupLocation={shipment.pickup_location?.coordinates ? { lat: shipment.pickup_location.coordinates[1], lng: shipment.pickup_location.coordinates[0] } : null}
              deliveryLocation={shipment.delivery_location?.coordinates ? { lat: shipment.delivery_location.coordinates[1], lng: shipment.delivery_location.coordinates[0] } : null}
              pickupAddress={shipment.pickup_address}
              deliveryAddress={shipment.delivery_address}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-8">
              <div className="mb-6">
                <p className="text-sm text-indigo-600 font-semibold mb-2">Shipment #{shipment.id}</p>
                <h1 className="text-2xl font-bold text-gray-900">{shipment.cargo_type || 'Shipment'}</h1>
              </div>

              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 font-semibold mb-1 uppercase">From</p>
                    <p className="font-bold text-gray-900">{pickup}</p>
                  </div>
                  <MapPin className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-1" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold mb-1 uppercase">To</p>
                  <p className="font-bold text-gray-900">{dropoff}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Weight className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Weight</p>
                    <p className="font-semibold text-gray-900">{Math.round(shipment.cargo_weight_kg || 1000)} kg</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Volume</p>
                    <p className="font-semibold text-gray-900">{Math.round(shipment.cargo_volume_cbm || 10)} m³</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Pickup Date</p>
                    <p className="font-semibold text-gray-900">{shipment.pickup_date || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Delivery Date</p>
                    <p className="font-semibold text-gray-900">{shipment.delivery_date || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Budget Range</p>
                    <p className="font-bold text-indigo-600 text-lg">
                      {shipment.budget_min} - {shipment.budget_max} {shipment.currency}
                    </p>
                  </div>
                </div>
              </div>

              {shipment.cargo_description && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-600 font-semibold mb-2 uppercase">Description</p>
                  <p className="text-sm text-gray-700">{shipment.cargo_description}</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-t-2xl shadow-sm border border-gray-100 border-b-0">
              <div className="flex gap-0">
                <button
                  onClick={() => setActiveTab('all-bids')}
                  className={`flex-1 px-6 py-4 font-semibold border-b-2 transition ${
                    activeTab === 'all-bids'
                      ? 'text-indigo-600 border-indigo-600'
                      : 'text-gray-600 border-transparent hover:text-gray-900'
                  }`}
                >
                  All Bids ({allBids.length})
                </button>
                <button
                  onClick={() => setActiveTab('my-bid')}
                  className={`flex-1 px-6 py-4 font-semibold border-b-2 transition ${
                    activeTab === 'my-bid'
                      ? 'text-indigo-600 border-indigo-600'
                      : 'text-gray-600 border-transparent hover:text-gray-900'
                  }`}
                >
                  Your Bid {myBid && <span className="text-green-600">✓</span>}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-b-2xl shadow-sm border border-gray-100 p-6">
              {activeTab === 'all-bids' && (
                <div className="space-y-4">
                  {allBids.length > 0 ? (
                    allBids.map(bid => (
                      <div key={bid.id} className="border border-gray-200 rounded-lg p-5 hover:border-indigo-300 hover:shadow-md transition flex gap-4">
                        <DriverProfileCard bid={bid} />
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <p className="font-semibold text-gray-900">Bid Details</p>
                              <p className="text-xs text-gray-500">Bid #{bid.id}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              bid.status === 'accepted' ? 'bg-green-100 text-green-700' :
                              bid.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              bid.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {bid.status?.toUpperCase()}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                              <p className="text-xs text-gray-600 mb-1">Quoted Price</p>
                              <p className="font-bold text-indigo-600 text-lg">{bid.quoted_price}</p>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                              <p className="text-xs text-gray-600 mb-1">ETA</p>
                              <p className="font-bold text-gray-900 text-sm">
                                {new Date(bid.eta_datetime).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                              <p className="text-xs text-gray-600 mb-1">Duration</p>
                              <p className="font-bold text-gray-900">{bid.duration_hours}h</p>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                              <p className="text-xs text-gray-600 mb-1">Vehicle Type</p>
                              <p className="font-bold text-gray-900 text-sm">{bid.vehicle_type}</p>
                            </div>
                          </div>

                          {bid.notes && (
                            <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-200">
                              <p className="text-xs text-gray-600 font-semibold mb-1 flex items-center gap-2">
                                <MessageCircle className="w-4 h-4" />
                                Notes
                              </p>
                              <p className="text-sm text-gray-700">{bid.notes}</p>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              <span className="text-xs text-gray-600">4.8</span>
                            </div>
                            <p className="text-xs text-gray-500">
                              Posted {new Date(bid.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No other bids yet. Be the first!</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'my-bid' && (
                <div>
                  {myBid && !showEditForm ? (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 border-2 border-indigo-200">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="text-sm text-indigo-600 font-semibold">Your Bid #{myBid.id}</p>
                            <h3 className="text-xl font-bold text-gray-900">Bid Status</h3>
                          </div>
                          <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                            myBid.status === 'accepted' ? 'bg-green-100 text-green-700' :
                            myBid.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            myBid.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {myBid.status?.toUpperCase()}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <p className="text-xs text-gray-600 mb-1">Quoted Price</p>
                            <p className="font-bold text-indigo-600 text-lg">{myBid.quoted_price}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <p className="text-xs text-gray-600 mb-1">ETA</p>
                            <p className="font-bold text-gray-900">
                              {new Date(myBid.eta_datetime).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <p className="text-xs text-gray-600 mb-1">Duration</p>
                            <p className="font-bold text-gray-900">{myBid.duration_hours}h</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <p className="text-xs text-gray-600 mb-1">Vehicle Type</p>
                            <p className="font-bold text-gray-900">{myBid.vehicle_type}</p>
                          </div>
                        </div>
                      </div>

                      {myBid.special_handling && (
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <p className="text-xs text-gray-600 font-semibold mb-1 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-blue-600" />
                            Special Handling
                          </p>
                          <p className="text-sm text-gray-700">{myBid.special_handling}</p>
                        </div>
                      )}

                      {myBid.notes && (
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <p className="text-xs text-gray-600 font-semibold mb-1 flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            Notes
                          </p>
                          <p className="text-sm text-gray-700">{myBid.notes}</p>
                        </div>
                      )}

                      <div className="flex gap-3 pt-4 border-t border-gray-200">
                        {myBid.status === 'pending' && (
                          <>
                            <button
                              onClick={openEditForm}
                              className="flex-1 flex items-center justify-center gap-2 bg-blue-100 text-blue-700 px-4 py-3 rounded-lg font-semibold hover:bg-blue-200 transition"
                            >
                              <Edit2 className="w-5 h-5" />
                              Edit Bid
                            </button>
                            <button
                              onClick={handleDeleteBid}
                              className="flex-1 flex items-center justify-center gap-2 bg-red-100 text-red-700 px-4 py-3 rounded-lg font-semibold hover:bg-red-200 transition"
                            >
                              <Trash2 className="w-5 h-5" />
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : showBidForm || showEditForm ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {showEditForm ? 'Edit Your Bid' : 'Place Your Bid'}
                        </h3>
                        <p className="text-gray-600 text-sm">Fill in the form below to {showEditForm ? 'update your' : 'place a new'} bid</p>
                      </div>

                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                          <DollarSign className="w-4 h-4 inline mr-2 text-indigo-600" />
                          Your Quoted Price ({shipment?.currency || 'OMR'})
                        </label>
                        <input
                          type="number"
                          value={formData.quotedPrice}
                          onChange={(e) => setFormData({ ...formData, quotedPrice: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-bold"
                          placeholder="Enter your quote"
                        />
                        {validationErrors.quotedPrice && (
                          <p className="text-red-600 text-sm flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {validationErrors.quotedPrice}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                          <Calendar className="w-4 h-4 inline mr-2 text-indigo-600" />
                          Estimated Delivery Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.etaDatetime}
                          onChange={(e) => setFormData({ ...formData, etaDatetime: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        {validationErrors.etaDatetime && (
                          <p className="text-red-600 text-sm flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {validationErrors.etaDatetime}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                          <Clock className="w-4 h-4 inline mr-2 text-indigo-600" />
                          Estimated Duration (Hours)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={formData.durationHours}
                          onChange={(e) => setFormData({ ...formData, durationHours: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="e.g., 6.5"
                        />
                        {validationErrors.durationHours && (
                          <p className="text-red-600 text-sm flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {validationErrors.durationHours}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                          <Truck className="w-4 h-4 inline mr-2 text-indigo-600" />
                          Vehicle Type
                        </label>
                        <select
                          value={formData.vehicleType}
                          onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Select vehicle type</option>
                          <option value="pickup">Pickup</option>
                          <option value="3-ton">3-ton Truck</option>
                          <option value="5-ton">5-ton Truck</option>
                          <option value="10-ton">10-ton Truck</option>
                          <option value="15-ton">15-ton Truck</option>
                          <option value="20-ton">20-ton Truck</option>
                          <option value="trailer">Trailer</option>
                          <option value="refrig">Refrigerated</option>
                          <option value="tanker">Tanker</option>
                        </select>
                        {validationErrors.vehicleType && (
                          <p className="text-red-600 text-sm flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {validationErrors.vehicleType}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                          <Shield className="w-4 h-4 inline mr-2 text-indigo-600" />
                          Special Handling Requirements
                        </label>
                        <textarea
                          value={formData.specialHandling}
                          onChange={(e) => setFormData({ ...formData, specialHandling: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="e.g., Fragile goods, Climate controlled, etc."
                          rows="2"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                          <CreditCard className="w-4 h-4 inline mr-2 text-indigo-600" />
                          Payment Terms
                        </label>
                        <select
                          value={formData.paymentTerms}
                          onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="upon_delivery">Upon Delivery</option>
                          <option value="prepaid">Prepaid</option>
                          <option value="advance_50">50% Advance</option>
                          <option value="net_15">Net 15 Days</option>
                          <option value="net_30">Net 30 Days</option>
                        </select>
                        {validationErrors.paymentTerms && (
                          <p className="text-red-600 text-sm flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {validationErrors.paymentTerms}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                          <FileText className="w-4 h-4 inline mr-2 text-indigo-600" />
                          Additional Notes
                        </label>
                        <textarea
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Any additional information..."
                          rows="3"
                        />
                      </div>

                      <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => { 
                            setShowBidForm(false)
                            setShowEditForm(false)
                            resetForm()
                          }}
                          className="flex-1 bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={showEditForm ? handleEditBid : handlePlaceBid}
                          className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                        >
                          {showEditForm ? (
                            <>
                              <Check className="w-5 h-5" />
                              Save Changes
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5" />
                              Place Bid
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Zap className="w-12 h-12 text-indigo-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4 font-medium">You haven't placed a bid yet</p>
                      <button
                        onClick={() => { setShowBidForm(true); resetForm(); }}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition inline-flex items-center gap-2"
                      >
                        <Zap className="w-5 h-5" />
                        Place Your Bid
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>


      </div>
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { getAuthToken, getStoredUser } from '../services/directusAuth'
import {
  ArrowLeft, Plus, X, Edit2, Trash2, FileUp, AlertCircle, Check,
  Clock, DollarSign, Truck, Shield, CreditCard, FileText, MapPin,
  Calendar, Zap, Eye, Send, History, MessageSquare
} from 'lucide-react'

export default function BiddingSystemModern() {
  const [view, setView] = useState('shipments')
  const [loading, setLoading] = useState(true)
  const [shipments, setShipments] = useState([])
  const [filteredShipments, setFilteredShipments] = useState([])
  const [myBids, setMyBids] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('recent')

  const [showBidForm, setShowBidForm] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [selectedBid, setSelectedBid] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [bidHistory, setBidHistory] = useState([])

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

  const [attachments, setAttachments] = useState([])
  const [validationErrors, setValidationErrors] = useState({})

  const extractLocationName = useCallback((address) => {
    if (!address) return 'Unknown'
    const parts = address.split(',').map(p => p.trim())
    return parts.length > 1 ? parts[parts.length - 2] : parts[0]
  }, [])

  const extractFullAddress = useCallback((address) => {
    if (!address) return 'Unknown'
    const parts = address.split(',').map(p => p.trim())
    if (parts.length < 3) return address
    const country = parts[parts.length - 1]
    const state = parts[parts.length - 2]
    const city = parts[parts.length - 3]
    return `${city}, ${state}, ${country}`
  }, [])

  const transformShipment = useCallback((apiShipment, bidCount = 0) => {
    return {
      id: apiShipment.id,
      title: apiShipment.cargo_type || 'Cargo',
      pickup: extractLocationName(apiShipment.pickup_address),
      pickupFull: extractFullAddress(apiShipment.pickup_address),
      dropoff: extractLocationName(apiShipment.delivery_address),
      dropoffFull: extractFullAddress(apiShipment.delivery_address),
      distance: Math.round(Math.random() * 500 + 50),
      weight: `${Math.round(apiShipment.cargo_weight_kg || 1000)} kg`,
      volume: `${Math.round(apiShipment.cargo_volume_cbm || 10)} m³`,
      budgetMin: Math.round(apiShipment.budget_min),
      budgetMax: Math.round(apiShipment.budget_max),
      pickupDate: apiShipment.pickup_date || new Date().toISOString().split('T')[0],
      deliveryDate: apiShipment.delivery_date || new Date().toISOString().split('T')[0],
      description: apiShipment.cargo_description || '',
      currency: apiShipment.currency || 'OMR',
      specialRequirements: apiShipment.special_requirements || '',
      bidCount: bidCount
    }
  }, [extractLocationName, extractFullAddress])

  const loadShipments = useCallback(async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      const user = getStoredUser()

      if (!token || !user) {
        console.error('No authentication found')
        return
      }

      const filter = encodeURIComponent(JSON.stringify({
        status: { _eq: 'POSTED' },
        user_id: { _neq: user.id }
      }))

      const response = await fetch(`/api/items/shipments?filter=${filter}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        const shipmentList = data.data || []
        
        const transformed = await Promise.all(
          shipmentList.map(async (ship) => {
            try {
              const bidsFilter = encodeURIComponent(JSON.stringify({
                shipment_id: { _eq: ship.id }
              }))
              const bidsRes = await fetch(`/api/items/bids?filter=${bidsFilter}&fields=id`, {
                headers: { 'Authorization': `Bearer ${token}` }
              })
              
              if (bidsRes.ok) {
                const bidsData = await bidsRes.json()
                const bidCount = (bidsData.data || []).length
                return transformShipment(ship, bidCount)
              }
            } catch (error) {
              console.error('Error fetching bid count for shipment:', ship.id, error)
            }
            return transformShipment(ship, 0)
          })
        )
        
        setShipments(transformed)
        setFilteredShipments(transformed)
      }
    } catch (error) {
      console.error('Error loading shipments:', error)
    } finally {
      setLoading(false)
    }
  }, [transformShipment])

  const loadMyBids = useCallback(async () => {
    try {
      const token = getAuthToken()
      const user = getStoredUser()

      if (!token || !user) return

      const filter = encodeURIComponent(JSON.stringify({
        user_id: { _eq: user.id }
      }))

      const response = await fetch(`/api/items/bids?filter=${filter}&fields=*,shipment_id.*`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setMyBids(data.data || [])
      }
    } catch (error) {
      console.error('Error loading my bids:', error)
    }
  }, [])

  useEffect(() => {
    loadShipments()
    loadMyBids()
  }, [loadShipments, loadMyBids])

  const filterAndSortShipments = useCallback(() => {
    let filtered = shipments.filter(ship => {
      const matchesSearch =
        ship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ship.pickup.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ship.dropoff.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })

    if (sortBy === 'price-asc') filtered.sort((a, b) => a.budgetMin - b.budgetMin)
    else if (sortBy === 'price-desc') filtered.sort((a, b) => b.budgetMax - a.budgetMax)
    else if (sortBy === 'distance') filtered.sort((a, b) => a.distance - b.distance)

    setFilteredShipments(filtered)
  }, [shipments, searchTerm, sortBy])

  useEffect(() => {
    filterAndSortShipments()
  }, [filterAndSortShipments])

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

    if (!formData.paymentTerms) {
      errors.paymentTerms = 'Please select payment terms'
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
        shipment_id: selectedShipment.id,
        quoted_price: parseFloat(formData.quotedPrice),
        eta_datetime: formData.etaDatetime,
        duration_hours: parseFloat(formData.durationHours),
        message: formData.specialHandling || formData.notes || null,
        status: 'pending'
      }

      if (formData.vehicleType === 'pickup') {
        bidData.vehicle_id = 8
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
        const newBid = await response.json()

        if (attachments.length > 0) {
          await uploadBidAttachments(newBid.data.id, attachments)
        }

        alert('Bid placed successfully!')
        resetBidForm()
        setShowBidForm(false)
        loadMyBids()
      } else {
        alert('Failed to place bid')
      }
    } catch (error) {
      console.error('Error placing bid:', error)
      alert('Error placing bid')
    }
  }

  const uploadBidAttachments = async (bidId, files) => {
    try {
      const token = getAuthToken()

      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)

        const uploadRes = await fetch('/api/files', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        })

        if (uploadRes.ok) {
          const uploadedFile = await uploadRes.json()
          const fileId = uploadedFile.data.id

          await fetch('/api/items/bid_attachments', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              bid_id: bidId,
              attachment: fileId,
              file_type: file.type
            })
          })
        }
      }
    } catch (error) {
      console.error('Error uploading attachments:', error)
    }
  }

  const handleEditBid = async () => {
    if (!validateBidForm()) return

    try {
      const token = getAuthToken()
      if (!token) return

      const bidData = {
        quoted_price: parseFloat(formData.quotedPrice),
        eta_datetime: formData.etaDatetime,
        duration_hours: parseFloat(formData.durationHours),
        message: formData.specialHandling || formData.notes || null
      }

      if (formData.vehicleType === 'pickup') {
        bidData.vehicle_id = 8
      }

      const response = await fetch(`/api/items/bids/${selectedBid.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bidData)
      })

      if (response.ok) {
        alert('Bid updated successfully!')
        resetBidForm()
        setShowEditForm(false)
        loadMyBids()
      }
    } catch (error) {
      console.error('Error updating bid:', error)
      alert('Error updating bid')
    }
  }

  const handleDeleteBid = async (bidId) => {
    if (!window.confirm('Are you sure you want to delete this bid?')) return

    try {
      const token = getAuthToken()
      if (!token) return

      const response = await fetch(`/api/items/bids/${bidId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        alert('Bid deleted successfully')
        loadMyBids()
      }
    } catch (error) {
      console.error('Error deleting bid:', error)
    }
  }

  const loadBidHistory = async (bidId) => {
    try {
      const token = getAuthToken()
      if (!token) return

      const filter = encodeURIComponent(JSON.stringify({
        bid_id: { _eq: bidId }
      }))

      const response = await fetch(`/api/items/bid_edit_history?filter=${filter}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setBidHistory(data.data || [])
      }
    } catch (error) {
      console.error('Error loading bid history:', error)
    }
  }

  const openBidForm = (shipment) => {
    setSelectedShipment(shipment)
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
    setAttachments([])
    setValidationErrors({})
    setShowBidForm(true)
  }

  const openEditForm = (bid) => {
    setSelectedBid(bid)
    setFormData({
      quotedPrice: bid.quoted_price.toString(),
      etaDatetime: bid.eta_datetime,
      durationHours: bid.duration_hours.toString(),
      vehicleType: bid.vehicle_type,
      specialHandling: bid.special_handling || '',
      insuranceCoverage: bid.insurance_coverage || '',
      paymentTerms: bid.payment_terms,
      notes: bid.notes || ''
    })
    setShowEditForm(true)
  }

  const openHistoryView = async (bid) => {
    setSelectedBid(bid)
    await loadBidHistory(bid.id)
    setShowHistory(true)
  }

  const resetBidForm = () => {
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
    setAttachments([])
    setValidationErrors({})
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    setAttachments([...attachments, ...files])
  }

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const navigateBack = () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'driver-dashboard' } }))
  }

  if (loading && view === 'shipments') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading shipments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={navigateBack} className="p-2 hover:bg-white rounded-lg transition">
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Bidding System</h1>
              <p className="text-gray-600">Place and manage your bids on shipments</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setView('shipments')}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                view === 'shipments'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Available Shipments
            </button>
            <button
              onClick={() => { setView('myBids'); loadMyBids(); }}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                view === 'myBids'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              My Bids ({myBids.length})
            </button>
          </div>
        </div>

        {/* Available Shipments View */}
        {view === 'shipments' && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <input
                    type="text"
                    placeholder="Search by location or cargo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="price-asc">Price (Low to High)</option>
                    <option value="price-desc">Price (High to Low)</option>
                    <option value="distance">Distance</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => { setSearchTerm(''); setSortBy('recent'); }}
                    className="w-full bg-gray-100 text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Shipments Grid */}
            {filteredShipments.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {filteredShipments.map(shipment => (
                  <div key={shipment.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-sm text-indigo-600 font-semibold mb-1">Shipment #{shipment.id}</p>
                          <h3 className="text-xl font-bold text-gray-900">{shipment.title}</h3>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                          {shipment.bidCount} bids
                        </span>
                      </div>

                      {/* Route */}
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">FROM</p>
                            <p className="font-semibold text-gray-900">{shipment.pickupFull}</p>
                          </div>
                          <MapPin className="w-5 h-5 text-blue-600" />
                          <div className="text-right">
                            <p className="text-xs text-gray-600 mb-1">TO</p>
                            <p className="font-semibold text-gray-900">{shipment.dropoffFull}</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-2 text-center">{shipment.distance} km</p>
                      </div>

                      {/* Cargo Details */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-600 mb-1">WEIGHT</p>
                          <p className="font-semibold text-gray-900">{shipment.weight}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-600 mb-1">VOLUME</p>
                          <p className="font-semibold text-gray-900">{shipment.volume}</p>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                          <p className="text-xs text-gray-600 mb-1">Pickup</p>
                          <p className="font-semibold text-gray-900 text-sm">{shipment.pickupDate}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                          <p className="text-xs text-gray-600 mb-1">Delivery</p>
                          <p className="font-semibold text-gray-900 text-sm">{shipment.deliveryDate}</p>
                        </div>
                      </div>

                      {/* Budget Range */}
                      <div className="border-t border-gray-200 pt-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Budget Range</p>
                          <p className="text-2xl font-bold text-indigo-600">
                            {shipment.budgetMin} - {shipment.budgetMax} {shipment.currency}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              console.log('🔄 [BIDDING] View Details clicked for shipment:', shipment.id)
                              window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'shipment-details-bidding', shipmentId: shipment.id } }))
                            }}
                            className="bg-gray-100 text-gray-900 px-4 py-3 rounded-lg font-semibold hover:bg-gray-200 transition flex items-center gap-2"
                          >
                            <Eye className="w-5 h-5" />
                            View Details
                          </button>
                          <button
                            onClick={() => openBidForm(shipment)}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center gap-2"
                          >
                            <Zap className="w-5 h-5" />
                            Place Bid
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No shipments found</p>
                <p className="text-sm text-gray-400">Try adjusting your filters</p>
              </div>
            )}
          </>
        )}

        {/* My Bids View */}
        {view === 'myBids' && (
          <div className="space-y-4">
            {myBids.length > 0 ? (
              myBids.map(bid => (
                <div key={bid.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-indigo-600 font-semibold mb-1">Bid #{bid.id}</p>
                      <h3 className="text-xl font-bold text-gray-900">
                        {bid.shipment_id?.cargo_type || 'Shipment'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Status: <span className={`font-semibold ${
                          bid.status === 'accepted' ? 'text-green-600' :
                          bid.status === 'rejected' ? 'text-red-600' :
                          bid.status === 'pending' ? 'text-amber-600' :
                          'text-gray-600'
                        }`}>{bid.status?.toUpperCase()}</span>
                      </p>
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

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <p className="text-xs text-gray-600 mb-1">Quoted Price</p>
                      <p className="font-bold text-gray-900 text-lg">{bid.quoted_price}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                      <p className="text-xs text-gray-600 mb-1">Duration</p>
                      <p className="font-bold text-gray-900">{bid.duration_hours}h</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <p className="text-xs text-gray-600 mb-1">Vehicle Type</p>
                      <p className="font-bold text-gray-900 text-sm">{bid.vehicle_type}</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                      <p className="text-xs text-gray-600 mb-1">Payment Terms</p>
                      <p className="font-bold text-gray-900 text-sm">{bid.payment_terms}</p>
                    </div>
                  </div>

                  {bid.notes && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-xs text-gray-600 mb-1 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Notes
                      </p>
                      <p className="text-gray-700">{bid.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => openHistoryView(bid)}
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
                    >
                      <History className="w-4 h-4" />
                      History
                    </button>
                    {bid.status === 'pending' && (
                      <>
                        <button
                          onClick={() => openEditForm(bid)}
                          className="flex-1 flex items-center justify-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-200 transition"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteBid(bid.id)}
                          className="flex-1 flex items-center justify-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium hover:bg-red-200 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No bids yet</p>
                <p className="text-sm text-gray-400">Start by placing a bid on an available shipment</p>
              </div>
            )}
          </div>
        )}

        {/* Bid Form Modal */}
        {showBidForm && selectedShipment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full my-8">
              <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 flex items-center justify-between border-b">
                <div>
                  <h2 className="text-2xl font-bold text-white">Place Your Bid</h2>
                  <p className="text-indigo-100 text-sm mt-1">{selectedShipment.title}</p>
                </div>
                <button
                  onClick={() => { setShowBidForm(false); resetBidForm(); }}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                
                {/* Shipment Summary */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-gray-600 mb-3">Shipment Details</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">From:</p>
                      <p className="font-semibold text-gray-900">{selectedShipment.pickupFull}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">To:</p>
                      <p className="font-semibold text-gray-900">{selectedShipment.dropoffFull}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Weight:</p>
                      <p className="font-semibold text-gray-900">{selectedShipment.weight}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Budget:</p>
                      <p className="font-semibold text-gray-900">
                        {selectedShipment.budgetMin}-{selectedShipment.budgetMax} {selectedShipment.currency}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    <DollarSign className="w-4 h-4 inline mr-2 text-indigo-600" />
                    Your Quoted Price ({selectedShipment.currency})
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

                {/* ETA */}
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

                {/* Duration */}
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

                {/* Vehicle Type */}
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

                {/* Special Handling */}
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

                {/* Insurance */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    <Shield className="w-4 h-4 inline mr-2 text-indigo-600" />
                    Insurance Coverage
                  </label>
                  <select
                    value={formData.insuranceCoverage}
                    onChange={(e) => setFormData({ ...formData, insuranceCoverage: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">None</option>
                    <option value="basic">Basic Coverage</option>
                    <option value="standard">Standard Coverage</option>
                    <option value="premium">Premium Coverage</option>
                  </select>
                </div>

                {/* Payment Terms */}
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

                {/* Notes */}
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

                {/* File Upload */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    <FileUp className="w-4 h-4 inline mr-2 text-indigo-600" />
                    Attachments (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-indigo-400 transition">
                    <input
                      type="file"
                      id="file-upload"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <FileUp className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
                    </label>
                  </div>
                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      {attachments.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <span className="text-sm text-gray-700 font-medium">{file.name}</span>
                          <button
                            onClick={() => removeAttachment(idx)}
                            className="p-1 hover:bg-red-100 rounded transition text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
                <button
                  onClick={() => { setShowBidForm(false); resetBidForm(); }}
                  className="flex-1 bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePlaceBid}
                  className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Place Bid
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Bid Modal */}
        {showEditForm && selectedBid && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full my-8">
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between border-b">
                <h2 className="text-2xl font-bold text-white">Edit Bid</h2>
                <button
                  onClick={() => { setShowEditForm(false); resetBidForm(); }}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                
                {/* Pricing */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    <DollarSign className="w-4 h-4 inline mr-2 text-indigo-600" />
                    Quoted Price
                  </label>
                  <input
                    type="number"
                    value={formData.quotedPrice}
                    onChange={(e) => setFormData({ ...formData, quotedPrice: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-bold"
                  />
                  {validationErrors.quotedPrice && (
                    <p className="text-red-600 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {validationErrors.quotedPrice}
                    </p>
                  )}
                </div>

                {/* ETA */}
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

                {/* Duration */}
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
                  />
                  {validationErrors.durationHours && (
                    <p className="text-red-600 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {validationErrors.durationHours}
                    </p>
                  )}
                </div>

                {/* Vehicle Type */}
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
                </div>

                {/* Special Handling */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    <Shield className="w-4 h-4 inline mr-2 text-indigo-600" />
                    Special Handling Requirements
                  </label>
                  <textarea
                    value={formData.specialHandling}
                    onChange={(e) => setFormData({ ...formData, specialHandling: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows="2"
                  />
                </div>

                {/* Insurance */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    <Shield className="w-4 h-4 inline mr-2 text-indigo-600" />
                    Insurance Coverage
                  </label>
                  <select
                    value={formData.insuranceCoverage}
                    onChange={(e) => setFormData({ ...formData, insuranceCoverage: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">None</option>
                    <option value="basic">Basic Coverage</option>
                    <option value="standard">Standard Coverage</option>
                    <option value="premium">Premium Coverage</option>
                  </select>
                </div>

                {/* Payment Terms */}
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
                </div>

                {/* Notes */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    <FileText className="w-4 h-4 inline mr-2 text-indigo-600" />
                    Additional Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows="3"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
                <button
                  onClick={() => { setShowEditForm(false); resetBidForm(); }}
                  className="flex-1 bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditBid}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History Modal */}
        {showHistory && selectedBid && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full my-8">
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between border-b">
                <h2 className="text-2xl font-bold text-white">Bid Edit History</h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                {bidHistory.length > 0 ? (
                  <div className="space-y-4">
                    {bidHistory.map((entry, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-semibold text-gray-900">Edit #{idx + 1}</p>
                          <span className="text-sm text-gray-600">
                            {new Date(entry.created_at).toLocaleString()}
                          </span>
                        </div>
                        
                        {entry.edit_reason && (
                          <p className="text-sm text-gray-700 mb-3 p-2 bg-blue-50 rounded">
                            <span className="font-medium">Reason:</span> {entry.edit_reason}
                          </p>
                        )}

                        {entry.old_values && Object.keys(entry.old_values).length > 0 && (
                          <div className="bg-red-50 rounded p-3 mb-3">
                            <p className="text-sm font-medium text-red-900 mb-2">Changes Made:</p>
                            <ul className="text-sm text-red-800 space-y-1">
                              {Object.entries(entry.old_values).map(([key, val]) => (
                                <li key={key}>
                                  <span className="font-medium">{key}:</span> {val} → {entry.new_values?.[key] || 'N/A'}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No edit history available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

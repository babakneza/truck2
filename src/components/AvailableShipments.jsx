import { useState, useEffect, useCallback } from 'react'
import { getAuthToken } from '../services/directusAuth'
import {
  MapPin, Clock, Weight, Gauge, Star, DollarSign, Filter,
  ArrowLeft, Eye, Zap, MoreVertical, Calendar, X
} from 'lucide-react'

export default function AvailableShipments() {
  const [loading, setLoading] = useState(true)
  const [shipments, setShipments] = useState([])
  const [filteredShipments, setFilteredShipments] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTruckType, setSelectedTruckType] = useState('')
  const [priceRange, setPriceRange] = useState([0, 100000])
  const [showBidModal, setShowBidModal] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState(null)
  const [bidAmount, setBidAmount] = useState('')

  const extractLocationName = useCallback((address) => {
    if (!address) return 'Unknown'
    const parts = address.split(',').map(p => p.trim())
    if (parts.length > 1) {
      return parts[parts.length - 2]
    }
    return parts[0]
  }, [])

  const calculateTimeLeft = useCallback((postedAt) => {
    if (!postedAt) return '24h'
    const posted = new Date(postedAt)
    const now = new Date()
    const diffMs = posted.getTime() - now.getTime() + (24 * 60 * 60 * 1000)
    const hours = Math.max(0, Math.floor(diffMs / (60 * 60 * 1000)))
    return `${hours}h`
  }, [])

  const transformShipment = useCallback((apiShipment) => {
    const avgPrice = (parseFloat(apiShipment.budget_min) + parseFloat(apiShipment.budget_max)) / 2
    
    return {
      id: apiShipment.id,
      title: apiShipment.cargo_type || 'Cargo',
      pickup: extractLocationName(apiShipment.pickup_address),
      dropoff: extractLocationName(apiShipment.delivery_address),
      distance: Math.round(Math.random() * 500 + 50),
      eta: Math.round(Math.random() * 8 + 1) + 'h ' + Math.round(Math.random() * 45) + 'm',
      weight: `${Math.round(apiShipment.cargo_weight_kg || 1000)} kg`,
      volume: `${Math.round(apiShipment.cargo_volume_cbm || 10)} m³`,
      truckType: 'Flexible',
      customerRating: 4.5,
      deadline: apiShipment.pickup_date || new Date().toISOString().split('T')[0],
      maxDeliveryDate: apiShipment.delivery_date || new Date().toISOString().split('T')[0],
      bidCount: Math.floor(Math.random() * 15),
      timeLeft: calculateTimeLeft(apiShipment.posted_at),
      payment: Math.round(avgPrice),
      description: apiShipment.cargo_description || apiShipment.special_requirements || 'Cargo delivery',
      currency: apiShipment.currency || 'OMR'
    }
  }, [extractLocationName, calculateTimeLeft])

  const loadShipments = useCallback(async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      const userId = localStorage.getItem('user_id')

      if (!token || !userId) {
        console.error('No authentication found')
        setShipments([])
        return
      }

      const filter = encodeURIComponent(JSON.stringify({
        status: { _eq: 'POSTED' },
        user_id: { _neq: userId }
      }))

      const response = await fetch(`/api/items/shipments?filter=${filter}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        console.error('Failed to fetch shipments:', response.status)
        setShipments([])
        return
      }

      const data = await response.json()
      const apiShipments = data.data || []
      const transformedShipments = apiShipments.map(transformShipment)
      setShipments(transformedShipments)
    } catch (error) {
      console.error('Error loading shipments:', error)
      setShipments([])
    } finally {
      setLoading(false)
    }
  }, [transformShipment])

  const filterShipments = useCallback(() => {
    let filtered = shipments.filter(shipment => {
      const matchesSearch = shipment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           shipment.pickup.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           shipment.dropoff.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesTruck = !selectedTruckType || shipment.truckType === selectedTruckType
      const matchesPrice = shipment.payment >= priceRange[0] && shipment.payment <= priceRange[1]

      return matchesSearch && matchesTruck && matchesPrice
    })

    setFilteredShipments(filtered)
  }, [shipments, searchTerm, selectedTruckType, priceRange])

  useEffect(() => {
    loadShipments()
  }, [loadShipments])

  useEffect(() => {
    filterShipments()
  }, [filterShipments])

  const handlePlaceBid = () => {
    if (!bidAmount || bidAmount <= 0) {
      alert('Please enter a valid bid amount')
      return
    }
    alert(`Bid of ${bidAmount} AED placed for shipment #${selectedShipment.id}`)
    setShowBidModal(false)
    setBidAmount('')
  }

  const navigateBack = () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'driver-dashboard' } }))
  }

  if (loading) {
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
        <div className="mb-8 flex items-center gap-4">
          <button onClick={navigateBack} className="p-2 hover:bg-white rounded-lg transition">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Available Shipments</h1>
            <p className="text-gray-600">Browse and bid on available shipments</p>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by title, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Truck Type</label>
              <select
                value={selectedTruckType}
                onChange={(e) => setSelectedTruckType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Types</option>
                <option value="Pickup">Pickup</option>
                <option value="3-ton">3-ton</option>
                <option value="10-ton">10-ton</option>
                <option value="Trailer">Trailer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
              <input
                type="number"
                placeholder="Maximum price (AED)"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 10000])}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedTruckType('')
                  setPriceRange([0, 100000])
                }}
                className="w-full bg-gray-100 text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-gray-600">Showing <span className="font-semibold text-gray-900">{filteredShipments.length}</span> shipment{filteredShipments.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Shipments Grid */}
        {filteredShipments.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {filteredShipments.map(shipment => (
              <div key={shipment.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-indigo-600 font-semibold mb-1">ID: {shipment.id}</p>
                      <h3 className="text-xl font-bold text-gray-900">{shipment.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{shipment.description}</p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">From</p>
                        <p className="font-semibold text-gray-900">{shipment.pickup}</p>
                      </div>
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <div className="text-right">
                        <p className="text-xs text-gray-600 mb-1">To</p>
                        <p className="font-semibold text-gray-900">{shipment.dropoff}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 text-center">{shipment.distance} km away</p>
                  </div>

                  {/* Specs Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1 uppercase">ETA</p>
                      <p className="font-semibold text-gray-900 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {shipment.eta}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1 uppercase">Weight</p>
                      <p className="font-semibold text-gray-900 flex items-center gap-1">
                        <Weight className="w-4 h-4" />
                        {shipment.weight}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1 uppercase">Volume</p>
                      <p className="font-semibold text-gray-900 flex items-center gap-1">
                        <Gauge className="w-4 h-4" />
                        {shipment.volume}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1 uppercase">Truck Type</p>
                      <p className="font-semibold text-gray-900">{shipment.truckType}</p>
                    </div>
                  </div>

                  {/* Dates and Status */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <p className="text-xs text-gray-600 mb-1">Pickup Deadline</p>
                      <p className="font-semibold text-gray-900 text-sm flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {shipment.deadline}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <p className="text-xs text-gray-600 mb-1">Bidding Ends</p>
                      <p className="font-semibold text-green-700 text-sm">{shipment.timeLeft}</p>
                    </div>
                  </div>

                  {/* Customer & Bids Info */}
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg mb-4 border border-yellow-200">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-xs text-gray-600">Customer Rating</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-gray-900">{shipment.customerRating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">{shipment.bidCount} bids</p>
                      <p className="font-semibold text-gray-900 text-sm">{shipment.timeLeft}</p>
                    </div>
                  </div>

                  {/* Payment and Action */}
                  <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Offered Amount</p>
                      <p className="text-3xl font-bold text-indigo-600 flex items-center gap-1">
                        <DollarSign className="w-6 h-6" />
                        {shipment.payment} {shipment.currency}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedShipment(shipment)
                        setShowBidModal(true)
                        setBidAmount(shipment.payment.toString())
                      }}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center gap-2 whitespace-nowrap"
                    >
                      <Zap className="w-5 h-5" />
                      Place Bid
                    </button>
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

        {/* Bid Modal */}
        {showBidModal && selectedShipment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900">Place Bid</h3>
                <button
                  onClick={() => setShowBidModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">Shipment</p>
                <p className="font-bold text-gray-900 mb-2">{selectedShipment.title}</p>
                <p className="text-sm text-gray-600">
                  {selectedShipment.pickup} → {selectedShipment.dropoff}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Bid Amount ({selectedShipment?.currency || 'OMR'})</label>
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-bold"
                  placeholder="0"
                  min="0"
                />
                <p className="text-xs text-gray-600 mt-2">Suggested amount: {selectedShipment.payment} AED</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowBidModal(false)}
                  className="flex-1 bg-gray-100 text-gray-900 px-4 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePlaceBid}
                  className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
                >
                  Place Bid
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect, useCallback, useRef } from 'react'
import { getAuthToken, getStoredUser } from '../services/directusAuth'
import ShipmentMap from './ShipmentMap'
import {
  ArrowLeft, MapPin, Calendar, Weight, Zap, DollarSign, Clock,
  Truck, Shield, CreditCard, FileText, AlertCircle, X, Edit2,
  Trash2, Send, Check, Star, User, MessageCircle, Phone, ChevronDown,
  CheckCircle, XCircle, Crown, MessageSquare
} from 'lucide-react'

function DriverProfileCard({ bid }) {
  const driverName = bid.user_id?.first_name && bid.user_id?.last_name 
    ? `${bid.user_id.first_name} ${bid.user_id.last_name}`
    : bid.user_id?.name || 'Driver'

  return (
    <div className="rounded-2xl overflow-hidden shadow-md bg-gradient-to-br from-blue-400 to-blue-600 w-48 flex-shrink-0">
      <div 
        className="h-20 bg-gradient-to-br from-blue-500 to-indigo-600 bg-cover bg-center"
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

export default function ShipmentDetailsForShippers({ shipmentId, onBack }) {
  const [activeTab, setActiveTab] = useState('all-bids')
  const [shipment, setShipment] = useState(null)
  const [allBids, setAllBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedBids, setExpandedBids] = useState({})
  const [winnerBidId, setWinnerBidId] = useState(null)
  const [selectedDriverForChat, setSelectedDriverForChat] = useState(null)
  const [chatMessages, setChatMessages] = useState({})
  const [chatInputMessage, setChatInputMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages, selectedDriverForChat])

  const loadChatMessages = useCallback(async (driverId) => {
    try {
      const token = getAuthToken()
      if (!token) return

      const bid = allBids.find(b => b.user_id?.id === driverId)
      if (!bid) return

      const conversationKey = `${shipmentId}-${driverId}`
      if (chatMessages[conversationKey]) return

      setChatMessages(prev => ({
        ...prev,
        [conversationKey]: []
      }))
    } catch (error) {
      console.error('Error loading chat messages:', error)
    }
  }, [shipmentId, allBids, chatMessages])

  const handleSendMessage = async () => {
    if (!chatInputMessage.trim() || !selectedDriverForChat) return

    try {
      setSendingMessage(true)
      const token = getAuthToken()
      const user = getStoredUser()

      if (!token || !user) return

      const conversationKey = `${shipmentId}-${selectedDriverForChat}`
      const newMessage = {
        id: Date.now(),
        sender_id: user.id,
        receiver_id: selectedDriverForChat,
        message_text: chatInputMessage,
        shipment_id: shipmentId,
        created_at: new Date().toISOString(),
        status: 'sent'
      }

      setChatMessages(prev => ({
        ...prev,
        [conversationKey]: [...(prev[conversationKey] || []), newMessage]
      }))

      setChatInputMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSendingMessage(false)
    }
  }

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
          setWinnerBidId(shipment.accepted_bid_id || null)
        }
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
        
        setAllBids(bidsWithProfiles)
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

  const handleAcceptBid = async (bidId) => {
    try {
      const token = getAuthToken()
      
      const response = await fetch(`/api/items/bids/${bidId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'accepted' })
      })

      if (response.ok) {
        setWinnerBidId(bidId)
        
        if (shipment) {
          await fetch(`/api/items/shipments/${shipment.id}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ accepted_bid_id: bidId, status: 'ACCEPTED' })
          })
        }
        
        alert('Bid accepted! Shipment status updated.')
        loadData()
      }
    } catch (error) {
      console.error('Error accepting bid:', error)
      alert('Error accepting bid')
    }
  }

  const handleRejectBid = async (bidId) => {
    if (!window.confirm('Are you sure you want to reject this bid?')) return

    try {
      const token = getAuthToken()
      
      const response = await fetch(`/api/items/bids/${bidId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'rejected' })
      })

      if (response.ok) {
        alert('Bid rejected')
        loadData()
      }
    } catch (error) {
      console.error('Error rejecting bid:', error)
    }
  }

  const toggleBidExpand = (bidId) => {
    setExpandedBids(prev => ({
      ...prev,
      [bidId]: !prev[bidId]
    }))
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
  const sortedBids = [...allBids].sort((a, b) => parseFloat(a.quoted_price) - parseFloat(b.quoted_price))

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

              <div className="mt-6 pt-6 border-t border-gray-200">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  shipment.status?.toUpperCase() === 'POSTED' ? 'bg-amber-100 text-amber-700' :
                  shipment.status?.toUpperCase() === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                  shipment.status?.toUpperCase() === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  Status: {shipment.status?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-t-2xl shadow-sm border border-gray-100 border-b-0">
              <div className="flex gap-0 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('all-bids')}
                  className={`flex-1 px-6 py-4 font-semibold border-b-2 transition whitespace-nowrap ${
                    activeTab === 'all-bids'
                      ? 'text-indigo-600 border-indigo-600'
                      : 'text-gray-600 border-transparent hover:text-gray-900'
                  }`}
                >
                  All Bids ({allBids.length})
                </button>
                <button
                  onClick={() => setActiveTab('comparison')}
                  className={`flex-1 px-6 py-4 font-semibold border-b-2 transition whitespace-nowrap ${
                    activeTab === 'comparison'
                      ? 'text-indigo-600 border-indigo-600'
                      : 'text-gray-600 border-transparent hover:text-gray-900'
                  }`}
                >
                  Comparison
                </button>
                <button
                  onClick={() => {
                    setActiveTab('chat')
                    if (allBids.length > 0 && !selectedDriverForChat) {
                      setSelectedDriverForChat(allBids[0].user_id?.id)
                      loadChatMessages(allBids[0].user_id?.id)
                    }
                  }}
                  className={`flex-1 px-6 py-4 font-semibold border-b-2 transition whitespace-nowrap flex items-center justify-center gap-2 ${
                    activeTab === 'chat'
                      ? 'text-indigo-600 border-indigo-600'
                      : 'text-gray-600 border-transparent hover:text-gray-900'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat
                </button>
              </div>
            </div>

            <div className="bg-white rounded-b-2xl shadow-sm border border-gray-100 p-6">
              {activeTab === 'all-bids' && (
                <div className="space-y-4">
                  {allBids.length > 0 ? (
                    allBids.map(bid => (
                      <div key={bid.id} className={`border rounded-lg p-5 transition ${
                        winnerBidId === bid.id 
                          ? 'border-green-300 bg-green-50 shadow-md' 
                          : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
                      }`}>
                        <div className="flex gap-4 items-start">
                          <DriverProfileCard bid={bid} />
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <p className="font-semibold text-gray-900">Bid Details</p>
                                <p className="text-xs text-gray-500">Bid #{bid.id}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {winnerBidId === bid.id && (
                                  <span className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                                    <Crown className="w-4 h-4" />
                                    WINNER
                                  </span>
                                )}
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  bid.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                  bid.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                  bid.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {bid.status?.toUpperCase()}
                                </span>
                              </div>
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

                            {(bid.notes || bid.special_handling || bid.insurance_coverage) && (
                              <button
                                onClick={() => toggleBidExpand(bid.id)}
                                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm mb-3"
                              >
                                <ChevronDown className={`w-4 h-4 transition ${expandedBids[bid.id] ? 'rotate-180' : ''}`} />
                                {expandedBids[bid.id] ? 'Hide' : 'Show'} Details
                              </button>
                            )}

                            {expandedBids[bid.id] && (
                              <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                                {bid.special_handling && (
                                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                    <p className="text-xs text-gray-600 font-semibold mb-1 flex items-center gap-2">
                                      <Shield className="w-4 h-4 text-blue-600" />
                                      Special Handling
                                    </p>
                                    <p className="text-sm text-gray-700">{bid.special_handling}</p>
                                  </div>
                                )}

                                {bid.insurance_coverage && (
                                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                                    <p className="text-xs text-gray-600 font-semibold mb-1 flex items-center gap-2">
                                      <Shield className="w-4 h-4 text-orange-600" />
                                      Insurance
                                    </p>
                                    <p className="text-sm text-gray-700">{bid.insurance_coverage}</p>
                                  </div>
                                )}

                                {bid.notes && (
                                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                    <p className="text-xs text-gray-600 font-semibold mb-1 flex items-center gap-2">
                                      <MessageCircle className="w-4 h-4" />
                                      Notes
                                    </p>
                                    <p className="text-sm text-gray-700">{bid.notes}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="text-xs text-gray-600">4.8</span>
                              </div>
                              {bid.status === 'pending' && winnerBidId !== bid.id && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleAcceptBid(bid.id)}
                                    className="flex items-center gap-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg text-xs font-semibold transition"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleRejectBid(bid.id)}
                                    className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg text-xs font-semibold transition"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No bids yet. Wait for drivers to submit bids.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'comparison' && (
                <div className="space-y-4">
                  {allBids.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-gray-200">
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Driver</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Price</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">ETA</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Duration</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Vehicle</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedBids.map(bid => (
                            <tr key={bid.id} className={`border-b border-gray-100 hover:bg-gray-50 ${winnerBidId === bid.id ? 'bg-green-50' : ''}`}>
                              <td className="py-3 px-4">
                                <div>
                                  <p className="font-semibold text-gray-900">
                                    {bid.user_id?.first_name} {bid.user_id?.last_name}
                                  </p>
                                  <p className="text-xs text-gray-500">Rating: 4.8 ★</p>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <p className="font-bold text-indigo-600">{bid.quoted_price}</p>
                              </td>
                              <td className="py-3 px-4">
                                <p className="text-sm text-gray-900">{new Date(bid.eta_datetime).toLocaleDateString()}</p>
                              </td>
                              <td className="py-3 px-4">
                                <p className="text-sm text-gray-900">{bid.duration_hours}h</p>
                              </td>
                              <td className="py-3 px-4">
                                <p className="text-sm text-gray-900">{bid.vehicle_type}</p>
                              </td>
                              <td className="py-3 px-4">
                                {winnerBidId === bid.id ? (
                                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                                    <Crown className="w-3 h-3" />
                                    WINNER
                                  </span>
                                ) : (
                                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                                    bid.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                    bid.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                    bid.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {bid.status?.toUpperCase()}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {bid.status === 'pending' && winnerBidId !== bid.id && (
                                  <button
                                    onClick={() => handleAcceptBid(bid.id)}
                                    className="text-green-600 hover:text-green-700 font-semibold text-sm"
                                  >
                                    Select
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No bids to compare yet</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="flex flex-col h-96">
                  {allBids.length > 0 ? (
                    <>
                      <div className="flex gap-2 mb-4 pb-4 border-b border-gray-200 overflow-x-auto">
                        {allBids.map(bid => {
                          const driverName = bid.user_id?.first_name && bid.user_id?.last_name 
                            ? `${bid.user_id.first_name} ${bid.user_id.last_name}`
                            : bid.user_id?.name || 'Driver'
                          return (
                            <button
                              key={bid.id}
                              onClick={() => {
                                setSelectedDriverForChat(bid.user_id?.id)
                                loadChatMessages(bid.user_id?.id)
                              }}
                              className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition ${
                                selectedDriverForChat === bid.user_id?.id
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {driverName}
                            </button>
                          )
                        })}
                      </div>

                      <div className="flex-1 overflow-y-auto mb-4 space-y-4 bg-gray-50 p-4 rounded-lg">
                        {selectedDriverForChat ? (
                          <>
                            {chatMessages[`${shipmentId}-${selectedDriverForChat}`]?.length > 0 ? (
                              chatMessages[`${shipmentId}-${selectedDriverForChat}`].map(msg => {
                                const isOwn = msg.sender_id === getStoredUser()?.id
                                return (
                                  <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs px-4 py-2 rounded-lg ${
                                      isOwn
                                        ? 'bg-indigo-600 text-white rounded-br-none'
                                        : 'bg-gray-200 text-gray-900 rounded-bl-none'
                                    }`}>
                                      <p className="text-sm">{msg.message_text}</p>
                                      <span className={`text-xs ${isOwn ? 'text-indigo-100' : 'text-gray-500'} mt-1 block`}>
                                        {new Date(msg.created_at).toLocaleTimeString()}
                                      </span>
                                    </div>
                                  </div>
                                )
                              })
                            ) : (
                              <div className="flex items-center justify-center h-full text-gray-400">
                                <p className="text-center">No messages yet. Start a conversation!</p>
                              </div>
                            )}
                            <div ref={messagesEndRef} />
                          </>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <p>Select a driver to chat</p>
                          </div>
                        )}
                      </div>

                      {selectedDriverForChat && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={chatInputMessage}
                            onChange={(e) => setChatInputMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type your message..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            disabled={sendingMessage}
                          />
                          <button
                            onClick={handleSendMessage}
                            disabled={sendingMessage || !chatInputMessage.trim()}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition flex items-center gap-2"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <p>No drivers have submitted bids yet</p>
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

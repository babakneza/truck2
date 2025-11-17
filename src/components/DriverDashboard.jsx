import { useState, useEffect } from 'react'
import { getAuthToken, getStoredUser } from '../services/directusAuth'
import {
  Truck, MapPin, Clock, DollarSign, AlertCircle, CheckCircle,
  Star, Users, FileText, MessageSquare, Bell, TrendingUp,
  Phone, MessageCircle, Zap, Award, Send, Eye, X, MoreVertical,
  ChevronRight, Calendar, Weight, Gauge, Info, Edit,
  CreditCard, Wallet, Download, AlertTriangle
} from 'lucide-react'

export default function DriverDashboard() {
  const [_loading, _setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')
  const [_selectedShipment, _setSelectedShipment] = useState(null)
  const [_unreadChats, _setUnreadChats] = useState(0)

  const [dashboardData, setDashboardData] = useState({
    profile: {
      name: 'Loading...',
      rating: 4.8,
      completedJobs: 42,
      verificationStatus: 'verified',
      profilePhoto: null,
      vehiclePhoto: null,
      phone: ''
    },
    vehicle: {
      type: 'Trailer',
      licensePlate: 'ABC-123',
      capacity: '20,000 kg',
      image: null
    },
    activeShipment: {
      id: 1,
      title: 'Construction Materials to Sohar',
      pickup: 'Muscat',
      dropoff: 'Sohar',
      pickupTime: '2025-01-15 08:00',
      deadline: '2025-01-15 14:00',
      status: 'in_transit',
      payment: 450,
      customerName: 'Ahmed Al Balushi',
      customerRating: 4.9
    },
    bids: {
      pending: [
        { id: 1, shipmentId: 101, amount: 550, submitted: '2025-01-14 10:30', status: 'pending' },
        { id: 2, shipmentId: 102, amount: 720, submitted: '2025-01-14 11:15', status: 'pending' }
      ],
      accepted: [
        { id: 3, shipmentId: 103, amount: 480, submitted: '2025-01-13 09:00', status: 'accepted' }
      ],
      rejected: [
        { id: 4, shipmentId: 99, amount: 350, submitted: '2025-01-12 14:20', status: 'rejected' }
      ],
      expired: [],
      cancelled: []
    },
    earnings: {
      monthlyTotal: 12500,
      weeklyTotal: 2800,
      availableBalance: 8350,
      pendingPayments: 2150,
      completedPayments: 10350,
      transactions: [
        { id: 1, shipmentId: 101, amount: 450, method: 'wallet', status: 'completed', date: '2025-01-10' },
        { id: 2, shipmentId: 102, amount: 500, method: 'card', status: 'completed', date: '2025-01-09' },
        { id: 3, shipmentId: 103, amount: 420, method: 'cash', status: 'pending', date: '2025-01-14' }
      ]
    },
    notifications: [
      { id: 1, type: 'new_shipment', title: 'New shipment available', message: 'Industrial Equipment - Muscat to Nizwa', time: '5 min ago' },
      { id: 2, type: 'bid_accepted', title: 'Bid accepted!', message: 'Your bid for Construction Materials has been accepted', time: '2h ago' },
      { id: 3, type: 'payment', title: 'Payment received', message: 'You received 450 AED for shipment #101', time: '4h ago' }
    ],
    documents: [
      { id: 1, type: 'License', status: 'verified', expiryDate: '2026-05-15' },
      { id: 2, type: 'Insurance', status: 'verified', expiryDate: '2025-06-30' },
      { id: 3, type: 'Vehicle Registration', status: 'expiring_soon', expiryDate: '2025-03-15' },
      { id: 4, type: 'National ID', status: 'verified', expiryDate: '2027-12-20' }
    ],
    ratings: {
      average: 4.8,
      reviews: [
        { customerName: 'Ahmed Al Balushi', rating: 5, comment: 'Excellent service and professional driver', date: '2025-01-10' },
        { customerName: 'Fatima Al Kindi', rating: 4.5, comment: 'Good delivery, minor delay', date: '2025-01-08' }
      ],
      completionRate: 98,
      cancellations: 2,
      violations: 0
    }
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      _setLoading(true)
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

      const [directusUserRes, userProfileRes, vehicleRes] = await Promise.all([
        fetch(`/api/users/me?fields=id,first_name,last_name,email`, { headers }),
        fetch(`/api/items/users?filter[user_id][_eq]=${storedUser.id}&fields=phone,profile_photo`, { headers }),
        fetch(`/api/items/vehicle_profiles?filter[user_id][_eq]=${storedUser.id}&fields=id,vehicle_type,license_plate,capacity_kg,vehicle_photo`, { headers })
      ])

      const directusUserData = await directusUserRes.json()
      const userProfileData = await userProfileRes.json()
      const vehicleData = await vehicleRes.json()

      const directusUser = directusUserData.data || {}
      const userProfile = userProfileData.data?.[0] || {}
      const vehicle = vehicleData.data?.[0] || {}

      let profilePhotoUrl = null
      if (userProfile.profile_photo) {
        try {
          const photoRes = await fetch(`/api/assets/${userProfile.profile_photo}`, { headers })
          if (photoRes.ok) {
            const blob = await photoRes.blob()
            profilePhotoUrl = URL.createObjectURL(blob)
          }
        } catch (error) {
          console.error('Error fetching profile photo:', error)
        }
      }

      let vehiclePhotoUrl = null
      if (vehicle.vehicle_photo) {
        try {
          const vehiclePhotoRes = await fetch(`/api/assets/${vehicle.vehicle_photo}`, { headers })
          if (vehiclePhotoRes.ok) {
            const blob = await vehiclePhotoRes.blob()
            vehiclePhotoUrl = URL.createObjectURL(blob)
          }
        } catch (error) {
          console.error('Error fetching vehicle photo:', error)
        }
      }

      setDashboardData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          name: `${directusUser.first_name} ${directusUser.last_name}`.trim(),
          phone: userProfile.phone || '',
          profilePhoto: profilePhotoUrl,
          vehiclePhoto: vehiclePhotoUrl
        },
        vehicle: {
          ...prev.vehicle,
          type: vehicle.vehicle_type || 'Not specified',
          licensePlate: vehicle.license_plate || 'N/A',
          capacity: vehicle.capacity_kg ? `${vehicle.capacity_kg} kg` : 'Not specified'
        }
      }))
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      _setLoading(false)
    }
  }

  const getDocumentStatusIcon = (status) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'expiring_soon': return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'expired': return <AlertCircle className="w-5 h-5 text-red-600" />
      default: return <FileText className="w-5 h-5 text-gray-600" />
    }
  }

  const getShipmentStatusColor = (status) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800'
      case 'en_route_to_pickup': return 'bg-blue-100 text-blue-800'
      case 'loaded': return 'bg-purple-100 text-purple-800'
      case 'in_transit': return 'bg-orange-100 text-orange-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getBidStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600'
      case 'accepted': return 'text-green-600'
      case 'rejected': return 'text-red-600'
      case 'expired': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-3 sm:py-4 md:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">

        {/* 1. Header Section with Profile & Quick Stats */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6 lg:p-8 mb-3 sm:mb-4 md:mb-6 lg:mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">

            {/* Profile Card */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 text-center sm:text-left">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl md:text-3xl font-bold flex-shrink-0">
                {dashboardData.profile.profilePhoto ? (
                  <img src={dashboardData.profile.profilePhoto} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                  dashboardData.profile.name?.charAt(0) || 'D'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 break-words">{dashboardData.profile.name}</h1>
                <p className="text-xs sm:text-sm text-gray-600 mb-2 truncate">Driver ID: DRV-2025-001</p>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  {dashboardData.profile.verificationStatus === 'verified' && (
                    <>
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-green-600" />
                      <span className="text-xs sm:text-sm text-green-600 font-semibold">Verified</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="bg-blue-50 rounded-lg p-2 sm:p-3 border border-blue-100 text-center">
                <p className="text-xs text-gray-600 mb-1">Rating</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">{dashboardData.profile.rating}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-2 sm:p-3 border border-green-100 text-center">
                <p className="text-xs text-gray-600 mb-1">Jobs Done</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{dashboardData.profile.completedJobs}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-2 sm:p-3 border border-purple-100 text-center">
                <p className="text-xs text-gray-600 mb-1">Active Bids</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600">{dashboardData.bids.pending.length}</p>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
              <div className="flex items-start gap-2 sm:gap-3">
                <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600">Vehicle</p>
                  <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">{dashboardData.vehicle.type}</p>
                  <p className="text-xs text-gray-600 truncate">{dashboardData.vehicle.licensePlate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Shipment */}
          {dashboardData.activeShipment && (
            <div className="bg-gradient-to-r from-orange-50 to-orange-50 rounded-lg p-3 sm:p-4 border border-orange-200">
              <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2">{dashboardData.activeShipment.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${getShipmentStatusColor(dashboardData.activeShipment.status)}`}>
                      {dashboardData.activeShipment.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-orange-600 flex-shrink-0" />
                      <span className="text-gray-600">{dashboardData.activeShipment.pickup} → {dashboardData.activeShipment.dropoff}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-orange-600 flex-shrink-0" />
                      <span className="text-gray-600">{dashboardData.activeShipment.deadline}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg sm:text-xl font-bold text-orange-600">{dashboardData.activeShipment.payment} AED</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Bids Management Section */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6 lg:p-8 mb-3 sm:mb-4 md:mb-6 lg:mb-8">
          <h3 className="text-base sm:text-lg md:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 flex-shrink-0" />
            My Bids
          </h3>

          <div className="flex flex-wrap gap-2 mb-4 overflow-x-auto pb-2">
            {['pending', 'accepted', 'rejected', 'expired', 'cancelled'].map(status => (
              <button
                key={status}
                onClick={() => setActiveTab(status)}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg font-semibold whitespace-nowrap transition ${
                  activeTab === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)} ({dashboardData.bids[status]?.length || 0})
              </button>
            ))}
          </div>

          <div className="space-y-2 sm:space-y-3">
            {dashboardData.bids[activeTab]?.map(bid => (
              <div key={bid.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-semibold text-gray-900">Shipment #{bid.shipmentId}</p>
                  <p className="text-xs sm:text-sm text-gray-600">{bid.submitted}</p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-base sm:text-lg font-bold ${getBidStatusColor(bid.status)}`}>{bid.amount} AED</p>
                  <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${getBidStatusColor(bid.status)}`}>
                    {bid.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 sm:mt-6 bg-indigo-600 text-white px-4 py-2 sm:py-3 rounded-lg font-semibold hover:bg-indigo-700 transition text-sm sm:text-base">
            Place New Bid
          </button>
        </div>

        {/* 3. Earnings Dashboard */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6 lg:p-8 mb-3 sm:mb-4 md:mb-6 lg:mb-8">
          <h3 className="text-base sm:text-lg md:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
            Earnings Dashboard
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-green-200">
              <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Monthly Total</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 mb-2 sm:mb-4">{dashboardData.earnings.monthlyTotal} AED</p>
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-blue-200">
              <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Weekly Total</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 mb-2 sm:mb-4">{dashboardData.earnings.weeklyTotal} AED</p>
              <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-purple-200">
              <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Available Balance</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600 mb-2 sm:mb-4">{dashboardData.earnings.availableBalance} AED</p>
              <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-orange-200">
              <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Pending Payments</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-600 mb-2 sm:mb-4">{dashboardData.earnings.pendingPayments} AED</p>
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 md:p-6">
              <p className="text-xs sm:text-sm text-gray-600 mb-2">Completed Payments</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{dashboardData.earnings.completedPayments} AED</p>
            </div>
            <div className="lg:col-span-2 flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button className="flex-1 bg-indigo-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span>Withdraw</span>
              </button>
              <button className="flex-1 bg-gray-100 text-gray-900 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base">
                <Download className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span>Export</span>
              </button>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4 text-sm sm:text-base">Recent Transactions</h4>
            <div className="space-y-2 sm:space-y-3">
              {dashboardData.earnings.transactions.map(tx => (
                <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-semibold text-gray-900">Shipment #{tx.shipmentId}</p>
                    <p className="text-xs sm:text-sm text-gray-600">{tx.date} • {tx.method}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-base sm:text-lg font-bold ${tx.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                      +{tx.amount} AED
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">{tx.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Notifications Center */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6 lg:p-8 mb-3 sm:mb-4 md:mb-6 lg:mb-8">
          <h3 className="text-base sm:text-lg md:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
            <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0" />
            Notifications
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {dashboardData.notifications.map(notif => (
              <div key={notif.id} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex-shrink-0 mt-0.5">
                  {notif.type === 'new_shipment' && <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />}
                  {notif.type === 'bid_accepted' && <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />}
                  {notif.type === 'payment' && <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm sm:text-base font-semibold text-gray-900">{notif.title}</h4>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1 line-clamp-2">{notif.message}</p>
                  <p className="text-xs text-gray-500">{notif.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Documents & Verification + Ratings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:gap-8 mb-3 sm:mb-4 md:mb-6 lg:mb-8">

          {/* Documents Panel */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6 lg:p-8">
            <h3 className="text-base sm:text-lg md:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
              Documents
            </h3>
            <div className="space-y-2 sm:space-y-3">
              {dashboardData.documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:shadow-sm transition">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    {getDocumentStatusIcon(doc.status)}
                    <div className="min-w-0">
                      <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">{doc.type}</p>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">Expires: {doc.expiryDate}</p>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                    <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              ))}
            </div>
            <button className="w-full mt-3 sm:mt-4 md:mt-6 bg-blue-50 text-blue-600 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold hover:bg-blue-100 transition text-xs sm:text-sm md:text-base">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2 flex-shrink-0" />
              Upload Documents
            </button>
          </div>

          {/* Ratings Panel */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6 lg:p-8">
            <h3 className="text-base sm:text-lg md:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
              <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 flex-shrink-0" />
              Ratings & Feedback
            </h3>

            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 border border-yellow-200">
              <p className="text-xs sm:text-sm text-gray-600 mb-2">Overall Rating</p>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-yellow-600">{dashboardData.ratings.average}</div>
                <div>
                  <div className="flex gap-0.5 sm:gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 ${i < Math.floor(dashboardData.ratings.average) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">{dashboardData.ratings.completionRate}% Completion</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
              <div className="bg-green-50 rounded-lg p-2 sm:p-3 md:p-4 border border-green-200">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Completed Jobs</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{dashboardData.profile.completedJobs}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-2 sm:p-3 md:p-4 border border-red-200">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Cancellations</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-600">{dashboardData.ratings.cancellations}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Recent Reviews</h4>
              <div className="space-y-2 sm:space-y-3 max-h-48 overflow-y-auto">
                {dashboardData.ratings.reviews.map((review, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-2 sm:p-3 md:p-4">
                    <div className="flex items-start justify-between mb-1 sm:mb-2 gap-2">
                      <h5 className="text-xs sm:text-sm font-medium text-gray-900 truncate">{review.customerName}</h5>
                      <div className="flex gap-0.5 flex-shrink-0">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 line-clamp-2">{review.comment}</p>
                    <p className="text-xs text-gray-500">{review.date}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 6. Chat Messages Panel */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6 lg:p-8">
          <h3 className="text-base sm:text-lg md:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 flex-shrink-0" />
            Messages
          </h3>
          <div className="text-center py-8 sm:py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <MessageSquare className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-gray-500 mb-1 sm:mb-2">Chat feature coming soon</p>
            <p className="text-xs sm:text-sm text-gray-400">This feature will allow you to communicate with customers in real-time</p>
          </div>
        </div>
      </div>
    </div>
  )
}

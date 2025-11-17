import { useState, useEffect } from 'react'
import { getAuthToken } from '../services/directusAuth'
import './ShipperDashboard.css'

console.log('✅ ShipperDashboard.jsx module loaded!')

export default function ShipperDashboard() {
  console.log('✅ ShipperDashboard component function called!')
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    activeShipments: 0,
    newBids: 0,
    unreadMessages: 0,
    pendingPayments: 0,
    recentActivity: [],
    shipmentStats: {
      draft: 0,
      activeBidding: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0
    },
    financialSummary: {
      currentBalance: 0,
      thisMonth: 0,
      lastMonth: 0,
      pending: 0
    },
    performance: {
      totalShipments: 0,
      totalSpent: 0,
      avgResponseTime: '0h',
      driverSatisfaction: 0,
      onTimeDelivery: 0
    }
  })

  useEffect(() => {
    console.log('🚀 [DASHBOARD] Component mounted, starting fetch')
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      console.log('🔐 [DASHBOARD] Fetch started')
      const token = getAuthToken()
      console.log('🔐 [DASHBOARD] Token exists?', !!token, 'Token:', token ? token.substring(0, 20) + '...' : 'NONE')
      if (!token) {
        console.log('❌ [DASHBOARD] No token, skipping fetch')
        return
      }

      const userId = localStorage.getItem('user_id')
      console.log('👤 [DASHBOARD] User ID:', userId)
      if (!userId) {
        console.log('❌ [DASHBOARD] No user ID, skipping fetch')
        return
      }

      const filterUrl = `/api/items/shipments?filter={"user_id":{"_eq":"${userId}"}}`
      console.log('🔗 [DASHBOARD] Filter URL:', filterUrl)
      console.log('📦 [DASHBOARD] Fetching shipments with userId:', userId)
      
      const shipmentsRes = await fetch(filterUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      console.log('📊 [DASHBOARD] Shipments response status:', shipmentsRes.status, shipmentsRes.statusText)

      let shipmentsData = []
      if (shipmentsRes.ok) {
        const json = await shipmentsRes.json()
        shipmentsData = json.data || []
      } else {
        const errorText = await shipmentsRes.text().catch(() => 'Unable to read error response')
        console.error('❌ [DASHBOARD] API Error:', shipmentsRes.status, shipmentsRes.statusText, errorText)
      }
      const shipments = shipmentsData
      console.log('📦 [DASHBOARD] Shipments count:', shipments.length, 'Raw data:', shipments)

      let bids = []
      let payments = []

      if (shipments.length > 0) {
        const shipmentIds = shipments.map(s => s.id)
        console.log('📦 [DASHBOARD] Fetching bids and payments for shipment IDs:', shipmentIds)

        const [bidsRes, paymentsRes] = await Promise.all([
          fetch(`/api/items/bids?filter={"shipment_id":{"_in":[${shipmentIds.join(',')}]}}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`/api/items/payments?filter={"shipment_id":{"_in":[${shipmentIds.join(',')}]}}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ])

        console.log('📊 [DASHBOARD] Response statuses:', {
          bids: bidsRes.status,
          payments: paymentsRes.status
        })

        bids = bidsRes.ok ? (await bidsRes.json()).data || [] : []
        payments = paymentsRes.ok ? (await paymentsRes.json()).data || [] : []
        
        console.log('📊 [DASHBOARD] Bids fetched:', bids.length, 'Payments fetched:', payments.length)
      } else {
        console.log('📦 [DASHBOARD] No shipments, skipping bids/payments fetch')
      }

      console.log('📦 Dashboard: Data counts:', {
        shipments: shipments.length,
        bids: bids.length,
        payments: payments.length
      })
      console.log('📦 Dashboard: Shipments data:', shipments)

      const today = new Date().toISOString().split('T')[0]
      const newBidsToday = bids.filter(bid => 
        bid.submitted_at?.startsWith(today) && bid.bid_status === 'submitted'
      ).length

      console.log('📊 Dashboard: Raw shipments:', shipments.map(s => ({ id: s.id, status: s.status, user_id: s.user_id })))

      const shipmentStats = {
        draft: shipments.filter(s => s.status?.toLowerCase() === 'draft').length,
        activeBidding: shipments.filter(s => ['active', 'posted'].includes(s.status?.toLowerCase())).length,
        inProgress: shipments.filter(s => s.status?.toLowerCase() === 'accepted').length,
        completed: shipments.filter(s => s.status?.toLowerCase() === 'completed').length,
        cancelled: shipments.filter(s => s.status?.toLowerCase() === 'cancelled').length
      }

      console.log('📊 Dashboard: Shipment stats:', shipmentStats)
      console.log('📊 Dashboard: Active shipments total:', shipmentStats.activeBidding + shipmentStats.inProgress)
      console.log('📊 Dashboard: User ID used:', userId)

      const pendingPayments = payments.filter(p => 
        ['pending', 'authorized'].includes(p.status?.toLowerCase())
      ).length

      const thisMonth = new Date()
      thisMonth.setDate(1)
      const lastMonth = new Date(thisMonth)
      lastMonth.setMonth(lastMonth.getMonth() - 1)

      const thisMonthPayments = payments.filter(p => 
        p.status?.toLowerCase() === 'completed' && new Date(p.created_at) >= thisMonth
      )
      const lastMonthPayments = payments.filter(p => 
        p.status?.toLowerCase() === 'completed' && 
        new Date(p.created_at) >= lastMonth && 
        new Date(p.created_at) < thisMonth
      )

      const thisMonthTotal = thisMonthPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
      const lastMonthTotal = lastMonthPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
      const pendingTotal = payments
        .filter(p => p.status?.toLowerCase() === 'pending')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)

      const completedShipments = shipments.filter(s => s.status?.toLowerCase() === 'completed')
      const totalSpent = payments
        .filter(p => p.status?.toLowerCase() === 'completed')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)

      const recentActivity = [
        ...bids.slice(0, 3).map(bid => ({
          type: 'bid',
          message: `New bid on Shipment #${bid.shipment_id}`,
          time: bid.submitted_at,
          icon: '💼'
        })),
        ...shipments.slice(0, 2).map(ship => ({
          type: 'shipment',
          message: `Shipment status updated: ${ship.status}`,
          time: ship.updated_at,
          icon: '📦'
        }))
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 6)

      setDashboardData({
        activeShipments: shipmentStats.activeBidding + shipmentStats.inProgress,
        newBids: newBidsToday,
        unreadMessages: 0,
        pendingPayments,
        recentActivity,
        shipmentStats,
        financialSummary: {
          currentBalance: 0,
          thisMonth: thisMonthTotal,
          lastMonth: lastMonthTotal,
          pending: pendingTotal
        },
        performance: {
          totalShipments: completedShipments.length,
          totalSpent,
          avgResponseTime: '2h',
          driverSatisfaction: 4.8,
          onTimeDelivery: 95
        }
      })
      setLoading(false)
    } catch (error) {
      console.error('❌ [DASHBOARD] Error fetching dashboard data:', error)
      console.error('❌ [DASHBOARD] Error stack:', error.stack)
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return `OMR ${parseFloat(amount).toFixed(2)}`
  }

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now'
    const diff = Date.now() - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="shipper-dashboard">
      <div className="dashboard-header">
        <h1>📊 Dashboard</h1>
        <p className="dashboard-subtitle">Real-time overview of your shipping activity</p>
      </div>

      <div className="quick-stats">
        <div 
          className="stat-card stat-primary clickable"
          onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'shipments-list' } }))}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-icon">🚚</div>
          <div className="stat-content">
            <h3>{dashboardData.activeShipments}</h3>
            <p>Active Shipments</p>
          </div>
        </div>
        <div className="stat-card stat-success">
          <div className="stat-icon">💼</div>
          <div className="stat-content">
            <h3>{dashboardData.newBids}</h3>
            <p>New Bids Today</p>
          </div>
        </div>
        <div className="stat-card stat-info">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <h3>{dashboardData.unreadMessages}</h3>
            <p>Unread Messages</p>
          </div>
        </div>
        <div className="stat-card stat-warning">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{dashboardData.pendingPayments}</h3>
            <p>Pending Payments</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section quick-actions">
          <h2>⚡ Quick Actions</h2>
          <div className="action-buttons">
            <button 
              className="action-btn action-primary"
              onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'post-shipment' } }))}
            >
              <span className="btn-icon">➕</span>
              Create New Shipment
            </button>
            <button className="action-btn action-secondary">
              <span className="btn-icon">👁️</span>
              View Active Bids
            </button>
            <button className="action-btn action-secondary">
              <span className="btn-icon">💬</span>
              Check Messages
            </button>
            <button className="action-btn action-secondary">
              <span className="btn-icon">💳</span>
              Make Payment
            </button>
            <button className="action-btn action-secondary">
              <span className="btn-icon">📄</span>
              Download Reports
            </button>
            <button className="action-btn action-secondary">
              <span className="btn-icon">🆘</span>
              Contact Support
            </button>
          </div>
        </div>

        <div className="dashboard-section shipment-overview">
          <h2>🚚 Shipment Overview</h2>
          <div className="shipment-stats">
            <div className="shipment-stat">
              <span className="stat-label">Draft</span>
              <span className="stat-value">{dashboardData.shipmentStats.draft}</span>
            </div>
            <div className="shipment-stat">
              <span className="stat-label">Active Bidding</span>
              <span className="stat-value stat-active">{dashboardData.shipmentStats.activeBidding}</span>
            </div>
            <div className="shipment-stat">
              <span className="stat-label">In Progress</span>
              <span className="stat-value stat-progress">{dashboardData.shipmentStats.inProgress}</span>
            </div>
            <div className="shipment-stat">
              <span className="stat-label">Completed</span>
              <span className="stat-value stat-completed">{dashboardData.shipmentStats.completed}</span>
            </div>
            <div className="shipment-stat">
              <span className="stat-label">Cancelled</span>
              <span className="stat-value stat-cancelled">{dashboardData.shipmentStats.cancelled}</span>
            </div>
          </div>
          <button 
            className="view-all-btn"
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'post-shipment' } }))}
          >
            Create New Shipment →
          </button>
        </div>

        <div className="dashboard-section financial-widget">
          <h2>💰 Financial Overview</h2>
          <div className="financial-stats">
            <div className="financial-item">
              <span className="financial-label">Current Balance</span>
              <span className="financial-value">{formatCurrency(dashboardData.financialSummary.currentBalance)}</span>
            </div>
            <div className="financial-item">
              <span className="financial-label">This Month</span>
              <span className="financial-value financial-positive">{formatCurrency(dashboardData.financialSummary.thisMonth)}</span>
            </div>
            <div className="financial-item">
              <span className="financial-label">Last Month</span>
              <span className="financial-value">{formatCurrency(dashboardData.financialSummary.lastMonth)}</span>
            </div>
            <div className="financial-item">
              <span className="financial-label">Pending</span>
              <span className="financial-value financial-pending">{formatCurrency(dashboardData.financialSummary.pending)}</span>
            </div>
          </div>
          <button className="view-all-btn">View Full Report →</button>
        </div>

        <div className="dashboard-section activity-feed">
          <h2>🕒 Recent Activity</h2>
          <div className="activity-list">
            {dashboardData.recentActivity.length > 0 ? (
              dashboardData.recentActivity.map((activity, index) => (
                <div key={index} className="activity-item">
                  <span className="activity-icon">{activity.icon}</span>
                  <div className="activity-content">
                    <p className="activity-message">{activity.message}</p>
                    <span className="activity-time">{formatTimeAgo(activity.time)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-activity">No recent activity</p>
            )}
          </div>
        </div>

        <div className="dashboard-section performance-snapshot">
          <h2>📈 Performance Snapshot</h2>
          <div className="performance-stats">
            <div className="performance-item">
              <div className="performance-label">This Month's Shipments</div>
              <div className="performance-value">{dashboardData.performance.totalShipments}</div>
            </div>
            <div className="performance-item">
              <div className="performance-label">Total Spent</div>
              <div className="performance-value">{formatCurrency(dashboardData.performance.totalSpent)}</div>
            </div>
            <div className="performance-item">
              <div className="performance-label">Avg Bid Response Time</div>
              <div className="performance-value">{dashboardData.performance.avgResponseTime}</div>
            </div>
            <div className="performance-item">
              <div className="performance-label">Driver Satisfaction</div>
              <div className="performance-value">
                ⭐ {dashboardData.performance.driverSatisfaction}/5
              </div>
            </div>
            <div className="performance-item">
              <div className="performance-label">On-time Delivery</div>
              <div className="performance-value">{dashboardData.performance.onTimeDelivery}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

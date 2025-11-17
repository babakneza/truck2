import { useState, useEffect, useCallback } from 'react'
import { getAuthToken } from '../services/directusAuth'
import './ShipmentsList.css'

export default function ShipmentsList() {
  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('active')

  const fetchShipments = useCallback(async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      const userId = localStorage.getItem('user_id')

      if (!token || !userId) {
        console.log('No auth data')
        return
      }

      const res = await fetch(`/api/items/shipments?filter={"user_id":{"_eq":"${userId}"}}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await res.json()
      let filteredShipments = data.data || []

      if (filter === 'active') {
        filteredShipments = filteredShipments.filter(s => ['POSTED', 'posted', 'ACCEPTED', 'accepted'].includes(s.status))
      } else if (filter === 'completed') {
        filteredShipments = filteredShipments.filter(s => s.status?.toUpperCase() === 'COMPLETED')
      } else if (filter === 'cancelled') {
        filteredShipments = filteredShipments.filter(s => s.status?.toUpperCase() === 'CANCELLED')
      }

      setShipments(filteredShipments)
    } catch (error) {
      console.error('Error fetching shipments:', error)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchShipments()
  }, [fetchShipments])

  const handleBackToDashboard = () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'dashboard' } }))
  }

  const handleViewDetails = (shipmentId) => {
    localStorage.setItem('selectedShipmentId', shipmentId)
    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'shipment-details', shipmentId } }))
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const formatCurrency = (amount) => {
    return `OMR ${parseFloat(amount || 0).toFixed(2)}`
  }

  const getStatusColor = (status) => {
    const upper = status?.toUpperCase()
    if (upper === 'POSTED') return 'status-posted'
    if (upper === 'ACCEPTED') return 'status-accepted'
    if (upper === 'COMPLETED') return 'status-completed'
    if (upper === 'CANCELLED') return 'status-cancelled'
    return 'status-default'
  }

  if (loading) {
    return (
      <div className="shipments-list-loading">
        <div className="spinner"></div>
        <p>Loading shipments...</p>
      </div>
    )
  }

  return (
    <div className="shipments-list-container">
      <div className="shipments-header">
        <button onClick={handleBackToDashboard} className="back-btn">
          ← Back to Dashboard
        </button>
        <h1>📦 My Shipments</h1>
        <p className="subtitle">Manage and track your shipments</p>
      </div>

      <div className="shipments-filters">
        <button
          className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          🚀 Active
        </button>
        <button
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          ✅ Completed
        </button>
        <button
          className={`filter-btn ${filter === 'cancelled' ? 'active' : ''}`}
          onClick={() => setFilter('cancelled')}
        >
          ❌ Cancelled
        </button>
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          📋 All
        </button>
      </div>

      {shipments.length === 0 ? (
        <div className="no-shipments">
          <p>No shipments found</p>
        </div>
      ) : (
        <div className="shipments-grid">
          {shipments.map((shipment) => (
            <div key={shipment.id} className="shipment-card">
              <div className="card-header">
                <h3>Shipment #{shipment.id}</h3>
                <span className={`status-badge ${getStatusColor(shipment.status)}`}>
                  {shipment.status}
                </span>
              </div>

              <div className="card-body">
                <div className="shipment-info">
                  <div className="info-group">
                    <label>📍 Pickup</label>
                    <p>{shipment.pickup_address || 'N/A'}</p>
                  </div>

                  <div className="info-group">
                    <label>📍 Delivery</label>
                    <p>{shipment.delivery_address || 'N/A'}</p>
                  </div>

                  <div className="info-row">
                    <div className="info-group">
                      <label>📦 Cargo Type</label>
                      <p>{shipment.cargo_type || 'N/A'}</p>
                    </div>
                    <div className="info-group">
                      <label>⚖️ Weight</label>
                      <p>{shipment.cargo_weight_kg || 0} kg</p>
                    </div>
                  </div>

                  <div className="info-row">
                    <div className="info-group">
                      <label>📅 Pickup Date</label>
                      <p>{formatDate(shipment.pickup_date)}</p>
                    </div>
                    <div className="info-group">
                      <label>📅 Delivery Date</label>
                      <p>{formatDate(shipment.delivery_date)}</p>
                    </div>
                  </div>

                  <div className="info-row">
                    <div className="info-group">
                      <label>💰 Budget Min</label>
                      <p>{formatCurrency(shipment.budget_min)}</p>
                    </div>
                    <div className="info-group">
                      <label>💰 Budget Max</label>
                      <p>{formatCurrency(shipment.budget_max)}</p>
                    </div>
                  </div>

                  {shipment.special_requirements && (
                    <div className="info-group">
                      <label>📝 Special Requirements</label>
                      <p>{shipment.special_requirements}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="card-footer">
                <button className="view-details-btn" onClick={() => handleViewDetails(shipment.id)}>View Details</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

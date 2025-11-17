import { useState, useEffect } from 'react'
import { getShipmentById } from '../services/shipmentService'
import { getAuthToken } from '../services/directusAuth'
import ShipmentMap from './ShipmentMap'
import './ShipmentDetails.css'

export default function ShipmentDetails({ shipmentId }) {
  const [shipment, setShipment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actualShipmentId, setActualShipmentId] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [galleryImages, setGalleryImages] = useState({})

  useEffect(() => {
    const id = shipmentId || localStorage.getItem('selectedShipmentId')
    console.log('ShipmentDetails mounted - shipmentId prop:', shipmentId, 'localStorage:', localStorage.getItem('selectedShipmentId'), 'actual:', id)
    setActualShipmentId(id)
  }, [shipmentId])

  useEffect(() => {
    if (actualShipmentId) {
      const fetchShipmentDetails = async () => {
        try {
          setLoading(true)
          console.log('Fetching shipment details for id:', actualShipmentId)
          
          const result = await getShipmentById(actualShipmentId)
          console.log('Shipment fetch result:', result)
          
          if (result.success) {
            setShipment(result.data)
            if (result.data.gallery && Array.isArray(result.data.gallery)) {
              loadGalleryImages(result.data.gallery)
            }
          } else {
            console.error('Failed to fetch shipment:', result.error)
            setShipment(null)
          }
        } catch (error) {
          console.error('Error fetching shipment details:', error)
          setShipment(null)
        } finally {
          setLoading(false)
        }
      }

      fetchShipmentDetails()
    }
  }, [actualShipmentId])

  const loadGalleryImages = async (galleryItems) => {
    const token = getAuthToken()
    if (!token) return

    const images = {}
    for (const item of galleryItems) {
      let fileId
      
      if (typeof item === 'object' && item.directus_files_id) {
        if (typeof item.directus_files_id === 'object') {
          fileId = item.directus_files_id.id
        } else {
          fileId = item.directus_files_id
        }
      } else if (typeof item === 'object' && item.files_id) {
        fileId = typeof item.files_id === 'object' ? item.files_id.id : item.files_id
      } else if (typeof item === 'object' && item.id) {
        fileId = item.id
      } else {
        fileId = item
      }

      if (!fileId) continue

      try {
        const response = await fetch(`/api/assets/${fileId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (response.ok) {
          const blob = await response.blob()
          images[fileId] = URL.createObjectURL(blob)
        } else {
          console.warn(`Failed to load image ${fileId}: ${response.status}`)
        }
      } catch (error) {
        console.error(`Failed to load image ${fileId}:`, error)
      }
    }
    setGalleryImages(images)
  }

  const handleBackToList = () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'shipments-list' } }))
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

  const getGalleryImageUrl = (fileId) => {
    return galleryImages[fileId] || null
  }

  const getGalleryItems = () => {
    if (!shipment?.gallery) return []
    if (Array.isArray(shipment.gallery)) {
      return shipment.gallery.filter(item => item && (item.directus_files_id || item))
    }
    return []
  }

  if (loading) {
    return (
      <div className="shipment-details-loading">
        <div className="spinner"></div>
        <p>Loading shipment details...</p>
      </div>
    )
  }

  if (!shipment) {
    return (
      <div className="shipment-details-container">
        <button onClick={handleBackToList} className="back-btn">← Back to Shipments</button>
        <div className="error-message">Shipment not found</div>
      </div>
    )
  }

  return (
    <div className="shipment-details-container">
      <div className="details-header">
        <button onClick={handleBackToList} className="back-btn">← Back to Shipments</button>
        <h1>Shipment Details</h1>
      </div>

      <div className="details-content">
        <div className="details-card">
          <div className="card-header">
            <h2>Shipment #{shipment.id}</h2>
            <span className={`status-badge ${getStatusColor(shipment.status)}`}>
              {shipment.status}
            </span>
          </div>

          <div className="details-body">
            <section className="details-section">
              <h3>Locations</h3>
              <div className="section-content">
                <div className="detail-row">
                  <label>📍 Pickup Address</label>
                  <p>{shipment.pickup_address || 'N/A'}</p>
                </div>
                <div className="detail-row">
                  <label>📍 Delivery Address</label>
                  <p>{shipment.delivery_address || 'N/A'}</p>
                </div>
              </div>
            </section>

            <ShipmentMap
              pickupLocation={shipment.pickup_location?.coordinates ? { lat: shipment.pickup_location.coordinates[1], lng: shipment.pickup_location.coordinates[0] } : null}
              deliveryLocation={shipment.delivery_location?.coordinates ? { lat: shipment.delivery_location.coordinates[1], lng: shipment.delivery_location.coordinates[0] } : null}
              pickupAddress={shipment.pickup_address}
              deliveryAddress={shipment.delivery_address}
            />

            <section className="details-section">
              <h3>Cargo Information</h3>
              <div className="section-content">
                <div className="detail-row">
                  <label>📦 Cargo Type</label>
                  <p>{shipment.cargo_type || 'N/A'}</p>
                </div>
                {shipment.cargo_description && (
                  <div className="detail-row">
                    <label>📝 Description</label>
                    <p>{shipment.cargo_description}</p>
                  </div>
                )}
                <div className="detail-row">
                  <label>⚖️ Weight</label>
                  <p>{shipment.cargo_weight_kg || 0} kg</p>
                </div>
                {shipment.cargo_volume_cbm && (
                  <div className="detail-row">
                    <label>📦 Volume</label>
                    <p>{shipment.cargo_volume_cbm} m³</p>
                  </div>
                )}
                {shipment.cargo_dimensions && (
                  <div className="detail-row">
                    <label>📐 Dimensions</label>
                    <p>
                      {shipment.cargo_dimensions.length} × {shipment.cargo_dimensions.width} × {shipment.cargo_dimensions.height} cm
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="details-section">
              <h3>Timeline</h3>
              <div className="section-content">
                <div className="detail-row">
                  <label>📅 Pickup Date</label>
                  <p>{formatDate(shipment.pickup_date)}</p>
                </div>
                <div className="detail-row">
                  <label>📅 Delivery Date</label>
                  <p>{formatDate(shipment.delivery_date)}</p>
                </div>
              </div>
            </section>

            <section className="details-section">
              <h3>Budget</h3>
              <div className="section-content">
                <div className="detail-row">
                  <label>💰 Budget Minimum</label>
                  <p>{formatCurrency(shipment.budget_min)}</p>
                </div>
                <div className="detail-row">
                  <label>💰 Budget Maximum</label>
                  <p>{formatCurrency(shipment.budget_max)}</p>
                </div>
              </div>
            </section>

            {shipment.special_requirements && (
              <section className="details-section">
                <h3>⚠️ Special Requirements</h3>
                <div className="section-content">
                  <div className="detail-row">
                    <p>{shipment.special_requirements}</p>
                  </div>
                </div>
              </section>
            )}

            {getGalleryItems().length > 0 && (
              <section className="details-section">
                <h3>📸 Cargo Gallery</h3>
                <div className="gallery-grid">
                  {getGalleryItems().map((item, index) => {
                    let fileId = null
                    let filename = null
                    if (typeof item === 'object' && item.directus_files_id) {
                      if (typeof item.directus_files_id === 'object') {
                        fileId = item.directus_files_id.id
                        filename = item.directus_files_id.filename_disk || item.directus_files_id.filename_download
                      } else {
                        fileId = item.directus_files_id
                      }
                    } else if (typeof item === 'object' && item.files_id) {
                      fileId = typeof item.files_id === 'object' ? item.files_id.id : item.files_id
                    } else {
                      fileId = item?.id || item
                    }
                    const imageUrl = getGalleryImageUrl(fileId)
                    return (
                      <div
                        key={index}
                        className="gallery-item"
                        onClick={() => imageUrl && setSelectedImage(imageUrl)}
                      >
                        {imageUrl ? (
                          <>
                            <img
                              src={imageUrl}
                              alt={`Cargo ${index + 1}`}
                              className="gallery-image"
                              onError={(e) => {
                                e.target.style.display = 'none'
                              }}
                            />
                            {filename && (
                              <div className="gallery-filename" title={filename}>
                                {filename.substring(0, 20)}
                                {filename.length > 20 ? '...' : ''}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="gallery-loading">Loading...</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
          </div>

          <div className="details-footer">
            <button onClick={handleBackToList} className="back-btn">← Back</button>
            <button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'edit-shipment', shipmentId: shipment.id } }))} className="edit-btn">✏️ Edit Shipment</button>
          </div>
        </div>
      </div>

      {selectedImage && (
        <div className="image-modal-overlay" onClick={() => setSelectedImage(null)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="image-modal-close"
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </button>
            <img src={selectedImage} alt="Full size cargo" className="image-modal-image" />
          </div>
        </div>
      )}
    </div>
  )
}

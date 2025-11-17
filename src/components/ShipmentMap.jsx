import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './ShipmentDetails.css'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const pickupIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const deliveryIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'delivery-marker'
})

const validateCoordinates = (location) => {
  if (!location) return false
  if (location.lat === undefined || location.lng === undefined) return false
  if (isNaN(location.lat) || isNaN(location.lng)) return false
  if (!isFinite(location.lat) || !isFinite(location.lng)) return false
  return true
}

export default function ShipmentMap({ pickupLocation, deliveryLocation, pickupAddress, deliveryAddress }) {
  const [center, setCenter] = useState([23.6100, 58.5400])
  const [zoom, setZoom] = useState(8)
  const [route, setRoute] = useState([])
  const [routeLoading, setRouteLoading] = useState(false)
  const [distance, setDistance] = useState(null)
  const [duration, setDuration] = useState(null)

  useEffect(() => {
    if (!validateCoordinates(pickupLocation) || !validateCoordinates(deliveryLocation)) return

    const fetchRoute = async () => {
      try {
        setRouteLoading(true)
        const pickup = [pickupLocation.lng, pickupLocation.lat]
        const delivery = [deliveryLocation.lng, deliveryLocation.lat]
        
        const coords = `${pickup[0]},${pickup[1]};${delivery[0]},${delivery[1]}`
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
        )
        
        const data = await response.json()
        
        if (data.routes && data.routes.length > 0) {
          const routeData = data.routes[0]
          const coordinates = routeData.geometry.coordinates.map(coord => [coord[1], coord[0]])
          setRoute(coordinates)
          setDistance(routeData.distance)
          setDuration(routeData.duration)
        }
      } catch (error) {
        console.error('Error fetching route:', error)
        const pickup = [pickupLocation.lat, pickupLocation.lng]
        const delivery = [deliveryLocation.lat, deliveryLocation.lng]
        setRoute([pickup, delivery])
      } finally {
        setRouteLoading(false)
      }
    }

    fetchRoute()
  }, [pickupLocation, deliveryLocation])

  useEffect(() => {
    if (!validateCoordinates(pickupLocation) || !validateCoordinates(deliveryLocation)) return

    const pickup = [pickupLocation.lat, pickupLocation.lng]
    const delivery = [deliveryLocation.lat, deliveryLocation.lng]
    
    const midLat = (pickup[0] + delivery[0]) / 2
    const midLng = (pickup[1] + delivery[1]) / 2
    setCenter([midLat, midLng])
    
    const latDiff = Math.abs(pickup[0] - delivery[0])
    const lngDiff = Math.abs(pickup[1] - delivery[1])
    const maxDiff = Math.max(latDiff, lngDiff)
    
    if (maxDiff < 0.05) {
      setZoom(14)
    } else if (maxDiff < 0.1) {
      setZoom(13)
    } else if (maxDiff < 0.5) {
      setZoom(11)
    } else if (maxDiff < 1) {
      setZoom(10)
    } else {
      setZoom(9)
    }
  }, [pickupLocation, deliveryLocation])

  if (!validateCoordinates(pickupLocation) || !validateCoordinates(deliveryLocation)) {
    return (
      <div className="shipment-map-placeholder">
        <p>Map data unavailable</p>
      </div>
    )
  }

  const pickup = [pickupLocation.lat, pickupLocation.lng]
  const delivery = [deliveryLocation.lat, deliveryLocation.lng]

  const formatDistance = (meters) => {
    if (meters < 1000) return `${Math.round(meters)} m`
    return `${(meters / 1000).toFixed(2)} km`
  }

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes} min`
  }

  return (
    <div className="shipment-map-container">
      {routeLoading && (
        <div className="route-loading">Loading route...</div>
      )}
      {distance && duration && (
        <div className="route-info">
          <span className="route-stat">📏 {formatDistance(distance)}</span>
          <span className="route-divider">|</span>
          <span className="route-stat">⏱️ {formatDuration(duration)}</span>
        </div>
      )}
      <div className="shipment-map-wrapper">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {route.length > 0 && (
            <Polyline
              positions={route}
              color="#2563eb"
              weight={4}
              opacity={0.8}
            />
          )}
          
          <Marker position={pickup} icon={pickupIcon}>
            <Popup>
              <div className="popup-content">
                <h4>📍 Pickup Location</h4>
                <p>{pickupAddress || `${pickup[0].toFixed(4)}, ${pickup[1].toFixed(4)}`}</p>
              </div>
            </Popup>
          </Marker>
          
          <Marker position={delivery} icon={deliveryIcon}>
            <Popup>
              <div className="popup-content">
                <h4>📍 Delivery Location</h4>
                <p>{deliveryAddress || `${delivery[0].toFixed(4)}, ${delivery[1].toFixed(4)}`}</p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  )
}

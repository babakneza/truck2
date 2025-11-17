import { useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

function LocationMarker({ position, onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng)
    },
  })

  return position ? <Marker position={position} /> : null
}

export default function MapContent({ location, onLocationSelect, center = [23.6100, 58.5400], zoom = 8 }) {
  const [mapCenter] = useState(center)

  const handleLocationSelect = useCallback((latlng) => {
    const newLocation = { lat: latlng.lat, lng: latlng.lng }
    onLocationSelect(newLocation)
    
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`)
      .then(res => res.json())
      .then(data => {
        const address = data.display_name || `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`
        onLocationSelect({ ...newLocation, address })
      })
      .catch(() => {
        const address = `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`
        onLocationSelect({ ...newLocation, address })
      })
  }, [onLocationSelect])

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border-2 border-gray-300">
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker 
          position={location ? [location.lat, location.lng] : null} 
          onLocationSelect={handleLocationSelect}
        />
      </MapContainer>
    </div>
  )
}

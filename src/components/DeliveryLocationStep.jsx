import { useState, useEffect } from 'react'
import MapContent from './MapContent'
import DatePicker from 'react-datepicker'
import { calculateDistance } from '../services/shipmentService'
import 'react-datepicker/dist/react-datepicker.css'

export default function DeliveryLocationStep({ formData, onUpdate, onNext, onPrevious, onSave }) {
  const [errors, setErrors] = useState({})
  const [distance, setDistance] = useState(null)
  const [localData, setLocalData] = useState({
    delivery_location: formData.delivery_location || null,
    delivery_address: formData.delivery_address || '',
    delivery_date: formData.delivery_date ? new Date(formData.delivery_date) : null,
    delivery_time_start: formData.delivery_time_start || '',
    delivery_time_end: formData.delivery_time_end || ''
  })

  useEffect(() => {
    const dataToUpdate = {
      ...localData,
      delivery_date: localData.delivery_date ? localData.delivery_date.toISOString().split('T')[0] : ''
    }
    onUpdate(dataToUpdate)
  }, [localData, onUpdate])

  useEffect(() => {
    if (formData.pickup_location && localData.delivery_location) {
      const dist = calculateDistance(formData.pickup_location, localData.delivery_location)
      setDistance(dist)
    }
  }, [formData.pickup_location, localData.delivery_location])

  const validateForm = () => {
    const newErrors = {}

    if (!localData.delivery_location) {
      newErrors.delivery_location = 'Please select delivery location on the map'
    }

    if (!localData.delivery_date) {
      newErrors.delivery_date = 'Please select delivery date'
    }

    if (localData.delivery_date && formData.pickup_date) {
      const pickupDate = new Date(formData.pickup_date)
      if (localData.delivery_date < pickupDate) {
        newErrors.delivery_date = 'Delivery date must be after pickup date'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateForm()) {
      onNext()
    }
  }

  const handleLocationSelect = (location) => {
    setLocalData(prev => ({
      ...prev,
      delivery_location: { lat: location.lat, lng: location.lng },
      delivery_address: location.address || prev.delivery_address
    }))
    if (errors.delivery_location) {
      setErrors(prev => ({ ...prev, delivery_location: '' }))
    }
  }

  const handleChange = (field, value) => {
    setLocalData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md px-6 py-5">
      <h2 className="text-xl font-bold text-gray-800 mb-5">Delivery Location</h2>

      <div className="space-y-5">
        <div className="relative z-10">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Select Delivery Location on Map <span className="text-red-500">*</span>
          </label>
          <MapContent
            location={localData.delivery_location}
            onLocationSelect={handleLocationSelect}
          />
          {errors.delivery_location && <p className="mt-1.5 text-xs text-red-500">{errors.delivery_location}</p>}
        </div>

        {localData.delivery_location && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <p className="text-xs font-medium text-green-800">Selected Location:</p>
            <p className="text-xs text-green-700 mt-0.5">
              {localData.delivery_address || `${localData.delivery_location.lat.toFixed(4)}, ${localData.delivery_location.lng.toFixed(4)}`}
            </p>
          </div>
        )}

        {distance !== null && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
            <p className="text-xs font-medium text-purple-800">Distance from Pickup:</p>
            <p className="text-lg font-bold text-purple-700 mt-0.5">{distance} km</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Delivery Address
          </label>
          <input
            type="text"
            value={localData.delivery_address}
            onChange={(e) => handleChange('delivery_address', e.target.value)}
            placeholder="Enter or edit delivery address"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="relative z-20">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Delivery Date <span className="text-red-500">*</span>
          </label>
          <DatePicker
            selected={localData.delivery_date}
            onChange={(date) => handleChange('delivery_date', date)}
            minDate={formData.pickup_date ? new Date(formData.pickup_date) : new Date()}
            dateFormat="yyyy-MM-dd"
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.delivery_date ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholderText="Select delivery date"
            popperClassName="z-50"
          />
          {errors.delivery_date && <p className="mt-1 text-xs text-red-500">{errors.delivery_date}</p>}
        </div>
      </div>

      <div className="mt-6 flex justify-between gap-3">
        <button
          onClick={onPrevious}
          className="px-6 py-2.5 bg-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-400 transition-colors duration-200"
        >
          Previous
        </button>
        <div className="flex gap-3">
          <button
            onClick={onSave}
            className="px-8 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            Save & Exit
          </button>
          <button
            onClick={handleNext}
            className="px-8 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Next Step
          </button>
        </div>
      </div>
    </div>
  )
}

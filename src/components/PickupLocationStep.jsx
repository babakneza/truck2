import { useState, useEffect } from 'react'
import MapContent from './MapContent'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

export default function PickupLocationStep({ formData, onUpdate, onNext, onPrevious, onSave }) {
  const [errors, setErrors] = useState({})
  const [localData, setLocalData] = useState({
    pickup_location: formData.pickup_location || null,
    pickup_address: formData.pickup_address || '',
    pickup_date: formData.pickup_date ? new Date(formData.pickup_date) : null,
    pickup_time_start: formData.pickup_time_start || '',
    pickup_time_end: formData.pickup_time_end || ''
  })

  useEffect(() => {
    const dataToUpdate = {
      ...localData,
      pickup_date: localData.pickup_date ? localData.pickup_date.toISOString().split('T')[0] : ''
    }
    onUpdate(dataToUpdate)
  }, [localData, onUpdate])

  const validateForm = () => {
    const newErrors = {}

    if (!localData.pickup_location) {
      newErrors.pickup_location = 'Please select pickup location on the map'
    }

    if (!localData.pickup_date) {
      newErrors.pickup_date = 'Please select pickup date'
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
      pickup_location: { lat: location.lat, lng: location.lng },
      pickup_address: location.address || prev.pickup_address
    }))
    if (errors.pickup_location) {
      setErrors(prev => ({ ...prev, pickup_location: '' }))
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
      <h2 className="text-xl font-bold text-gray-800 mb-5">Pickup Location</h2>

      <div className="space-y-5">
        <div className="relative z-10">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Select Pickup Location on Map <span className="text-red-500">*</span>
          </label>
          <MapContent
            location={localData.pickup_location}
            onLocationSelect={handleLocationSelect}
          />
          {errors.pickup_location && <p className="mt-1.5 text-xs text-red-500">{errors.pickup_location}</p>}
        </div>

        {localData.pickup_location && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <p className="text-xs font-medium text-blue-800">Selected Location:</p>
            <p className="text-xs text-blue-700 mt-0.5">
              {localData.pickup_address || `${localData.pickup_location.lat.toFixed(4)}, ${localData.pickup_location.lng.toFixed(4)}`}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Pickup Address
          </label>
          <input
            type="text"
            value={localData.pickup_address}
            onChange={(e) => handleChange('pickup_address', e.target.value)}
            placeholder="Enter or edit pickup address"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="relative z-20">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Pickup Date <span className="text-red-500">*</span>
          </label>
          <DatePicker
            selected={localData.pickup_date}
            onChange={(date) => handleChange('pickup_date', date)}
            minDate={new Date()}
            dateFormat="yyyy-MM-dd"
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.pickup_date ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholderText="Select pickup date"
            popperClassName="z-50"
          />
          {errors.pickup_date && <p className="mt-1 text-xs text-red-500">{errors.pickup_date}</p>}
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

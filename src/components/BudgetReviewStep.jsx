import { useState, useEffect } from 'react'
import { calculateDistance } from '../services/shipmentService'

const CARGO_TYPE_LABELS = {
  general: 'General Cargo',
  perishable: 'Perishable Goods',
  fragile: 'Fragile Items',
  hazardous: 'Hazardous Materials',
  oversized: 'Oversized Cargo',
  refrigerated: 'Refrigerated Goods',
  livestock: 'Livestock',
  vehicles: 'Vehicles'
}

export default function BudgetReviewStep({ formData, onUpdate, onPrevious, onSubmit, onSave, isSubmitting, isEditing }) {
  const [errors, setErrors] = useState({})
  const [localData, setLocalData] = useState({
    budget_min: formData.budget_min || '',
    budget_max: formData.budget_max || '',
    currency: formData.currency || 'OMR'
  })

  useEffect(() => {
    onUpdate(localData)
  }, [localData, onUpdate])

  const validateForm = () => {
    const newErrors = {}

    if (!localData.budget_min || parseFloat(localData.budget_min) <= 0) {
      newErrors.budget_min = 'Please enter minimum budget'
    }

    if (!localData.budget_max || parseFloat(localData.budget_max) <= 0) {
      newErrors.budget_max = 'Please enter maximum budget'
    }

    if (localData.budget_min && localData.budget_max) {
      if (parseFloat(localData.budget_min) >= parseFloat(localData.budget_max)) {
        newErrors.budget_max = 'Maximum budget must be greater than minimum'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit()
    }
  }

  const handleChange = (field, value) => {
    setLocalData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const calculateVolume = () => {
    const { length, width, height } = formData.cargo_dimensions || {}
    if (length && width && height) {
      return ((parseFloat(length) * parseFloat(width) * parseFloat(height)) / 1000000).toFixed(2)
    }
    return '0.00'
  }

  const getDistance = () => {
    if (formData.pickup_location && formData.delivery_location) {
      return calculateDistance(formData.pickup_location, formData.delivery_location)
    }
    return 0
  }

  return (
    <div className="bg-white rounded-lg shadow-md px-6 py-5">
      <h2 className="text-xl font-bold text-gray-800 mb-5">Budget & Review</h2>

      <div className="space-y-5">
        <div className="bg-gray-50 rounded-lg px-4 py-3">
          <h3 className="text-base font-semibold text-gray-800 mb-3">Shipment Summary</h3>

          <div className="space-y-3">
            <div className="border-b border-gray-200 pb-2.5">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Cargo Details</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-600">Type:</span>
                  <span className="ml-2 font-medium">{CARGO_TYPE_LABELS[formData.cargo_type] || formData.cargo_type}</span>
                </div>
                <div>
                  <span className="text-gray-600">Weight:</span>
                  <span className="ml-2 font-medium">{formData.cargo_weight_kg} kg</span>
                </div>
                {(formData.cargo_dimensions?.length || formData.cargo_dimensions?.width || formData.cargo_dimensions?.height) && (
                  <>
                    <div>
                      <span className="text-gray-600">Volume:</span>
                      <span className="ml-2 font-medium">{calculateVolume()} m³</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Dimensions:</span>
                      <span className="ml-2 font-medium">
                        {formData.cargo_dimensions?.length} × {formData.cargo_dimensions?.width} × {formData.cargo_dimensions?.height} cm
                      </span>
                    </div>
                  </>
                )}
              </div>
              {formData.cargo_description && (
                <div className="mt-2 text-xs">
                  <span className="text-gray-600">Description:</span>
                  <p className="mt-0.5 text-gray-800">{formData.cargo_description}</p>
                </div>
              )}
              {formData.special_requirements && (
                <div className="mt-2 text-xs">
                  <span className="text-gray-600">Special Requirements:</span>
                  <p className="mt-0.5 text-gray-800">{formData.special_requirements}</p>
                </div>
              )}
              {formData.gallery && formData.gallery.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-gray-200">
                  <span className="text-gray-600 text-xs">Gallery:</span>
                  <div className="mt-1.5 flex gap-1.5 flex-wrap">
                    {formData.gallery.map((image, index) => (
                      <div key={index} className="w-12 h-12 rounded-md overflow-hidden border border-gray-300 flex-shrink-0 bg-gray-100">
                        <img
                          src={image.preview}
                          alt={`Gallery ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="mt-1 text-gray-500 text-xs">{formData.gallery.length} image(s)</p>
                </div>
              )}
            </div>

            <div className="border-b border-gray-200 pb-2.5">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Pickup Information</h4>
              <div className="text-xs space-y-0.5">
                <p>
                  <span className="text-gray-600">Location:</span>
                  <span className="ml-2 font-medium">{formData.pickup_address || 'Selected on map'}</span>
                </p>
                <p>
                  <span className="text-gray-600">Date:</span>
                  <span className="ml-2 font-medium">{formData.pickup_date}</span>
                </p>
              </div>
            </div>

            <div className="border-b border-gray-200 pb-2.5">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Delivery Information</h4>
              <div className="text-xs space-y-0.5">
                <p>
                  <span className="text-gray-600">Location:</span>
                  <span className="ml-2 font-medium">{formData.delivery_address || 'Selected on map'}</span>
                </p>
                <p>
                  <span className="text-gray-600">Date:</span>
                  <span className="ml-2 font-medium">{formData.delivery_date}</span>
                </p>
                <p>
                  <span className="text-gray-600">Distance:</span>
                  <span className="ml-2 font-medium text-purple-600">{getDistance()} km</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold text-gray-800 mb-3">Set Your Budget</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Minimum Budget <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <input
                  type="number"
                  value={localData.budget_min}
                  onChange={(e) => handleChange('budget_min', e.target.value)}
                  placeholder="Min"
                  min="0"
                  step="0.01"
                  className={`flex-1 px-3 py-2 text-sm border rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.budget_min ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                <span className="px-3 py-2 bg-gray-200 border border-l-0 border-gray-300 rounded-r-lg text-gray-700 text-sm font-medium">
                  {localData.currency}
                </span>
              </div>
              {errors.budget_min && <p className="mt-1 text-xs text-red-500">{errors.budget_min}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Maximum Budget <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <input
                  type="number"
                  value={localData.budget_max}
                  onChange={(e) => handleChange('budget_max', e.target.value)}
                  placeholder="Max"
                  min="0"
                  step="0.01"
                  className={`flex-1 px-3 py-2 text-sm border rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.budget_max ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                <span className="px-3 py-2 bg-gray-200 border border-l-0 border-gray-300 rounded-r-lg text-gray-700 text-sm font-medium">
                  {localData.currency}
                </span>
              </div>
              {errors.budget_max && <p className="mt-1 text-xs text-red-500">{errors.budget_max}</p>}
            </div>
          </div>

          {localData.budget_min && localData.budget_max && !errors.budget_min && !errors.budget_max && (
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <p className="text-xs text-blue-800">
                Budget Range: <span className="font-bold">{localData.budget_min} - {localData.budget_max} {localData.currency}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-between gap-3">
        <button
          onClick={onPrevious}
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <div className="flex gap-3">
          <button
            onClick={onSave}
            disabled={isSubmitting}
            className="px-8 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save & Exit'
            )}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-8 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isEditing ? 'Saving...' : 'Submitting...'}
            </>
          ) : (
            isEditing ? 'Save Changes' : 'Post Shipment'
          )}
        </button>
        </div>
      </div>
    </div>
  )
}

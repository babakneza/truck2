import { useState, useEffect } from 'react'
import { getAuthToken } from '../services/directusAuth'

const CARGO_TYPES = [
  { value: 'general', label: 'General Cargo' },
  { value: 'perishable', label: 'Perishable Goods' },
  { value: 'fragile', label: 'Fragile Items' },
  { value: 'hazardous', label: 'Hazardous Materials' },
  { value: 'oversized', label: 'Oversized Cargo' },
  { value: 'refrigerated', label: 'Refrigerated Goods' },
  { value: 'livestock', label: 'Livestock' },
  { value: 'vehicles', label: 'Vehicles' }
]

export default function CargoDetailsStep({ formData, onUpdate, onNext, onSave }) {
  const [errors, setErrors] = useState({})
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [localData, setLocalData] = useState({
    cargo_type: formData.cargo_type || '',
    cargo_description: formData.cargo_description || '',
    cargo_weight_kg: formData.cargo_weight_kg || '',
    cargo_dimensions: formData.cargo_dimensions || { length: '', width: '', height: '' },
    special_requirements: formData.special_requirements || '',
    gallery: formData.gallery || []
  })

  useEffect(() => {
    onUpdate(localData)
  }, [localData, onUpdate])

  const validateForm = () => {
    const newErrors = {}

    if (!localData.cargo_type) {
      newErrors.cargo_type = 'Please select cargo type'
    }

    if (!localData.cargo_weight_kg || parseFloat(localData.cargo_weight_kg) <= 0) {
      newErrors.cargo_weight_kg = 'Please enter valid weight'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateForm()) {
      onNext()
    }
  }

  const handleChange = (field, value) => {
    setLocalData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleDimensionChange = (dimension, value) => {
    setLocalData(prev => ({
      ...prev,
      cargo_dimensions: { ...prev.cargo_dimensions, [dimension]: value }
    }))
    if (errors[dimension]) {
      setErrors(prev => ({ ...prev, [dimension]: '' }))
    }
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    setUploadingImages(true)
    setUploadError(null)

    try {
      const token = getAuthToken()
      if (!token) throw new Error('Authentication required')

      const uploadedImages = []

      for (const file of files) {
        const reader = new FileReader()
        
        const dataUrl = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/files', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        const result = await response.json()
        if (result.data) {
          uploadedImages.push({
            id: result.data.id,
            junctionId: null,
            filename: result.data.filename_disk,
            title: file.name,
            preview: dataUrl,
            isNew: true
          })
        }
      }

      setLocalData(prev => ({
        ...prev,
        gallery: [...prev.gallery, ...uploadedImages]
      }))
    } catch (error) {
      setUploadError(error.message || 'Failed to upload images')
    } finally {
      setUploadingImages(false)
    }
  }

  const removeImage = (index) => {
    setLocalData(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index)
    }))
  }

  const calculateVolume = () => {
    const { length, width, height } = localData.cargo_dimensions
    if (length && width && height) {
      return ((parseFloat(length) * parseFloat(width) * parseFloat(height)) / 1000000).toFixed(2)
    }
    return '0.00'
  }

  return (
    <div className="bg-white rounded-lg shadow-md px-6 py-5">
      <h2 className="text-xl font-bold text-gray-800 mb-5">Cargo Details</h2>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Cargo Type <span className="text-red-500">*</span>
          </label>
          <select
            value={localData.cargo_type}
            onChange={(e) => handleChange('cargo_type', e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.cargo_type ? 'border-red-500' : 'border-gray-300'
              }`}
          >
            <option value="">Select cargo type</option>
            {CARGO_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          {errors.cargo_type && <p className="mt-1 text-xs text-red-500">{errors.cargo_type}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Cargo Description
          </label>
          <textarea
            value={localData.cargo_description}
            onChange={(e) => handleChange('cargo_description', e.target.value)}
            placeholder="Brief description of the cargo"
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Weight (kg) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={localData.cargo_weight_kg}
            onChange={(e) => handleChange('cargo_weight_kg', e.target.value)}
            placeholder="Enter weight in kilograms"
            min="0"
            step="0.01"
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.cargo_weight_kg ? 'border-red-500' : 'border-gray-300'
              }`}
          />
          {errors.cargo_weight_kg && <p className="mt-1 text-xs text-red-500">{errors.cargo_weight_kg}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Dimensions (cm)
          </label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <input
                type="number"
                value={localData.cargo_dimensions.length}
                onChange={(e) => handleDimensionChange('length', e.target.value)}
                placeholder="Length"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <input
                type="number"
                value={localData.cargo_dimensions.width}
                onChange={(e) => handleDimensionChange('width', e.target.value)}
                placeholder="Width"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <input
                type="number"
                value={localData.cargo_dimensions.height}
                onChange={(e) => handleDimensionChange('height', e.target.value)}
                placeholder="Height"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          {(localData.cargo_dimensions.length || localData.cargo_dimensions.width || localData.cargo_dimensions.height) && (
            <p className="mt-1.5 text-xs text-gray-600">
              Volume: <span className="font-semibold">{calculateVolume()} m³</span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Special Requirements
          </label>
          <textarea
            value={localData.special_requirements}
            onChange={(e) => handleChange('special_requirements', e.target.value)}
            placeholder="Any special handling requirements (optional)"
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Cargo Gallery <span className="text-xs text-gray-500">(optional)</span>
          </label>
          <p className="text-xs text-gray-600 mb-2">Upload images of your cargo for reference</p>
          
          {uploadError && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              {uploadError}
            </div>
          )}

          <div className="mb-3">
            <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors duration-200 bg-gray-50 hover:bg-blue-50">
              <div className="text-center">
                <svg className="w-6 h-6 mx-auto mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-xs font-medium text-gray-700">
                  {uploadingImages ? 'Uploading...' : 'Click to upload or drag images'}
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImages}
                className="hidden"
              />
            </label>
          </div>

          {localData.gallery.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {localData.gallery.map((image, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={image.preview}
                      alt={image.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    type="button"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2">{localData.gallery.length} image(s) selected</p>
        </div>

        {localData.gallery.length > 0 && (
          <div className="border-t border-gray-200 pt-4 mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Cargo Gallery Preview</h3>
            <div className="flex gap-2 flex-wrap">
              {localData.gallery.map((image, index) => (
                <div key={index} className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                  <img
                    src={image.preview}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between gap-3">
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
  )
}

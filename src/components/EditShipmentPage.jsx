import { useState, useEffect, useCallback } from 'react'
import ProgressIndicator from './ProgressIndicator'
import CargoDetailsStep from './CargoDetailsStep'
import PickupLocationStep from './PickupLocationStep'
import DeliveryLocationStep from './DeliveryLocationStep'
import BudgetReviewStep from './BudgetReviewStep'
import { getShipmentById, updateShipment } from '../services/shipmentService'
import { getAuthToken } from '../services/directusAuth'

export default function EditShipmentPage({ shipmentId }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [originalGalleryData, setOriginalGalleryData] = useState([])
  const [formData, setFormData] = useState({
    cargo_type: '',
    cargo_description: '',
    cargo_weight_kg: '',
    cargo_dimensions: { length: '', width: '', height: '' },
    special_requirements: '',
    gallery: [],
    pickup_location: null,
    pickup_address: '',
    pickup_date: '',
    pickup_time_start: '',
    pickup_time_end: '',
    delivery_location: null,
    delivery_address: '',
    delivery_date: '',
    delivery_time_start: '',
    delivery_time_end: '',
    budget_min: '',
    budget_max: '',
    currency: 'OMR'
  })

  const loadGalleryPreviews = async (galleryItems) => {
    const token = getAuthToken()
    if (!token || !galleryItems) return []

    const galleryWithPreviews = await Promise.all(
      galleryItems.map(async (item) => {
        let fileId = null
        let junctionId = null
        let title = null

        if (typeof item === 'object' && item.directus_files_id) {
          junctionId = item.id
          if (typeof item.directus_files_id === 'object') {
            fileId = item.directus_files_id.id
            title = item.directus_files_id.filename_disk || item.directus_files_id.filename_download
          } else {
            fileId = item.directus_files_id
          }
        } else if (typeof item === 'object' && item.files_id) {
          junctionId = item.id
          fileId = typeof item.files_id === 'object' ? item.files_id.id : item.files_id
        } else if (typeof item === 'object' && item.id) {
          fileId = item.id
          junctionId = item.id
        } else {
          fileId = item
          junctionId = item
        }

        if (!fileId) return null

        try {
          const response = await fetch(`/api/assets/${fileId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (response.ok) {
            const blob = await response.blob()
            return {
              id: fileId,
              junctionId: junctionId,
              filename: title,
              title: title,
              preview: URL.createObjectURL(blob)
            }
          }
        } catch (error) {
          console.error(`Failed to load image ${fileId}:`, error)
        }

        return null
      })
    )

    return galleryWithPreviews.filter(Boolean)
  }

  useEffect(() => {
    const fetchShipment = async () => {
      try {
        setLoading(true)
        const result = await getShipmentById(shipmentId)
        if (result.success) {
          const shipment = result.data
          const galleryWithPreviews = await loadGalleryPreviews(shipment.gallery)
          setOriginalGalleryData(galleryWithPreviews)

          setFormData({
            cargo_type: shipment.cargo_type || '',
            cargo_description: shipment.cargo_description || '',
            cargo_weight_kg: shipment.cargo_weight_kg || '',
            cargo_dimensions: {
              length: shipment.cargo_dimensions?.length || '',
              width: shipment.cargo_dimensions?.width || '',
              height: shipment.cargo_dimensions?.height || ''
            },
            special_requirements: shipment.special_requirements || '',
            gallery: galleryWithPreviews,
            pickup_location: shipment.pickup_location?.coordinates ? {
              lat: shipment.pickup_location.coordinates[1],
              lng: shipment.pickup_location.coordinates[0]
            } : null,
            pickup_address: shipment.pickup_address || '',
            pickup_date: shipment.pickup_date || '',
            pickup_time_start: shipment.pickup_time_start || '',
            pickup_time_end: shipment.pickup_time_end || '',
            delivery_location: shipment.delivery_location?.coordinates ? {
              lat: shipment.delivery_location.coordinates[1],
              lng: shipment.delivery_location.coordinates[0]
            } : null,
            delivery_address: shipment.delivery_address || '',
            delivery_date: shipment.delivery_date || '',
            delivery_time_start: shipment.delivery_time_start || '',
            delivery_time_end: shipment.delivery_time_end || '',
            budget_min: shipment.budget_min || '',
            budget_max: shipment.budget_max || '',
            currency: shipment.currency || 'OMR'
          })
        } else {
          setSubmitError(result.error || 'Failed to load shipment')
        }
      } catch (error) {
        setSubmitError(error.message || 'An error occurred while loading the shipment')
      } finally {
        setLoading(false)
      }
    }

    if (shipmentId) {
      fetchShipment()
    }
  }, [shipmentId])

  const handleUpdate = useCallback((stepData) => {
    setFormData(prev => ({ ...prev, ...stepData }))
  }, [])

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, 4))
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSave = async () => {
    await handleSubmit()
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const volume =
        (parseFloat(formData.cargo_dimensions.length) *
          parseFloat(formData.cargo_dimensions.width) *
          parseFloat(formData.cargo_dimensions.height)) /
        1000000

      const payload = {
        cargo_type: formData.cargo_type,
        cargo_description: formData.cargo_description || '',
        cargo_weight_kg: parseFloat(formData.cargo_weight_kg),
        cargo_volume_cbm: volume,
        special_requirements: formData.special_requirements || '',
        pickup_location: {
          type: 'Point',
          coordinates: [formData.pickup_location.lng, formData.pickup_location.lat]
        },
        pickup_address: formData.pickup_address,
        pickup_date: formData.pickup_date,
        pickup_time_start: formData.pickup_time_start || null,
        pickup_time_end: formData.pickup_time_end || null,
        delivery_location: {
          type: 'Point',
          coordinates: [formData.delivery_location.lng, formData.delivery_location.lat]
        },
        delivery_address: formData.delivery_address,
        delivery_date: formData.delivery_date,
        delivery_time_start: formData.delivery_time_start || null,
        delivery_time_end: formData.delivery_time_end || null,
        budget_min: parseFloat(formData.budget_min),
        budget_max: parseFloat(formData.budget_max),
        currency: formData.currency || 'OMR'
      }

      const result = await updateShipment(shipmentId, payload)

      if (result.success) {
        const token = getAuthToken()
        const newImages = formData.gallery.filter(img => img.isNew)
        const keptImages = formData.gallery.filter(img => !img.isNew)
        const keptImageIds = keptImages.map(img => img.id)
        
        const imagesToDelete = originalGalleryData.filter(img => !keptImageIds.includes(img.id))
        
        const hasChanges = newImages.length > 0 || imagesToDelete.length > 0

        if (hasChanges) {
          const galleryUpdate = {}
          
          if (imagesToDelete.length > 0) {
            galleryUpdate.delete = imagesToDelete.map(img => img.junctionId)
          }
          
          if (newImages.length > 0) {
            galleryUpdate.create = newImages.map(img => ({ directus_files_id: img.id }))
          }

          const galleryResponse = await fetch(`/api/items/shipments/${shipmentId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ gallery: galleryUpdate })
          })

          if (!galleryResponse.ok) {
            const errorText = await galleryResponse.text()
            console.warn('Failed to update gallery:', errorText)
          }
        }

        setSubmitSuccess(true)
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'shipment-details', shipmentId } }))
        }, 2000)
      } else {
        setSubmitError(result.error || 'Failed to update shipment')
      }
    } catch (error) {
      setSubmitError(error.message || 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackToDetails = () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'shipment-details', shipmentId } }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-5 px-4">
        <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md px-6 py-5 text-center">
          <div className="mb-3">
            <div className="spinner"></div>
          </div>
          <p className="text-sm text-gray-600">Loading shipment details...</p>
        </div>
      </div>
    )
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-5 px-4">
        <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md px-6 py-5 text-center">
          <div className="mb-3">
            <svg className="mx-auto h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Shipment Updated Successfully!</h2>
          <p className="text-sm text-gray-600 mb-4">
            Your shipment details have been saved.
          </p>
          <button
            onClick={handleBackToDetails}
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Back to Details
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-5 max-w-4xl">
        <button
          onClick={handleBackToDetails}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-200 mb-5"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Details
        </button>

        <div className="bg-white rounded-lg shadow-md px-6 py-4 mb-5">
          <h1 className="text-2xl font-bold text-gray-800 mb-1.5">Edit Shipment</h1>
          <p className="text-sm text-gray-600">Update the details of your shipment</p>
        </div>

        <ProgressIndicator currentStep={currentStep} />

        {submitError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-800 font-medium">{submitError}</p>
            </div>
          </div>
        )}

        <div className="mt-4">
          {currentStep === 1 && (
            <CargoDetailsStep
              formData={formData}
              onUpdate={handleUpdate}
              onNext={handleNext}
              onSave={handleSave}
            />
          )}
          {currentStep === 2 && (
            <PickupLocationStep
              formData={formData}
              onUpdate={handleUpdate}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onSave={handleSave}
            />
          )}
          {currentStep === 3 && (
            <DeliveryLocationStep
              formData={formData}
              onUpdate={handleUpdate}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onSave={handleSave}
            />
          )}
          {currentStep === 4 && (
            <BudgetReviewStep
              formData={formData}
              onUpdate={handleUpdate}
              onPrevious={handlePrevious}
              onSubmit={handleSubmit}
              onSave={handleSave}
              isSubmitting={isSubmitting}
              isEditing={true}
            />
          )}
        </div>
      </div>
    </div>
  )
}

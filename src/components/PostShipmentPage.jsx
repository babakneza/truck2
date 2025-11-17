import { useState, useCallback } from 'react'
import ProgressIndicator from './ProgressIndicator'
import CargoDetailsStep from './CargoDetailsStep'
import PickupLocationStep from './PickupLocationStep'
import DeliveryLocationStep from './DeliveryLocationStep'
import BudgetReviewStep from './BudgetReviewStep'
import { createShipment } from '../services/shipmentService'

export default function PostShipmentPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  
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

  const handleUpdate = useCallback((stepData) => {
    setFormData(prev => ({ ...prev, ...stepData }))
  }, [])

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, 4))
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await createShipment(formData)
      
      if (result.success) {
        setSubmitSuccess(true)
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'dashboard' } }))
        }, 2000)
      } else {
        setSubmitError(result.error || 'Failed to create shipment')
      }
    } catch (error) {
      setSubmitError(error.message || 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackToDashboard = () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'dashboard' } }))
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Shipment Posted Successfully!</h2>
          <p className="text-sm text-gray-600 mb-4">
            Your shipment has been posted and drivers can now bid on it.
          </p>
          <button
            onClick={handleBackToDashboard}
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-5 max-w-4xl">
        <button
          onClick={handleBackToDashboard}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-200 mb-5"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        <div className="bg-white rounded-lg shadow-md px-6 py-4 mb-5">
          <h1 className="text-2xl font-bold text-gray-800 mb-1.5">Post New Shipment</h1>
          <p className="text-sm text-gray-600">Fill in the details to post your shipment and receive bids from drivers</p>
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
            />
          )}
          {currentStep === 2 && (
            <PickupLocationStep
              formData={formData}
              onUpdate={handleUpdate}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          )}
          {currentStep === 3 && (
            <DeliveryLocationStep
              formData={formData}
              onUpdate={handleUpdate}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          )}
          {currentStep === 4 && (
            <BudgetReviewStep
              formData={formData}
              onUpdate={handleUpdate}
              onPrevious={handlePrevious}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>
    </div>
  )
}

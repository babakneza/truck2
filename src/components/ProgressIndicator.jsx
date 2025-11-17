export default function ProgressIndicator({ currentStep }) {
  const steps = [
    { number: 1, label: 'Cargo Details' },
    { number: 2, label: 'Pickup Location' },
    { number: 3, label: 'Delivery Location' },
    { number: 4, label: 'Budget & Review' }
  ]

  return (
    <div className="w-full mb-5">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  step.number < currentStep
                    ? 'bg-green-600 text-white'
                    : step.number === currentStep
                    ? 'bg-blue-600 text-white ring-3 ring-blue-200'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {step.number < currentStep ? '✓' : step.number}
              </div>
              <span
                className={`mt-1.5 text-xs font-semibold text-center ${
                  step.number === currentStep
                    ? 'text-blue-600'
                    : step.number < currentStep
                    ? 'text-green-600'
                    : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-1 flex-1 mx-2 transition-all duration-300 ${
                  step.number < currentStep ? 'bg-green-600' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

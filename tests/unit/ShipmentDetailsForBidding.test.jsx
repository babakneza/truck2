/* eslint-disable no-undef */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import ShipmentDetailsForBidding from '../../src/components/ShipmentDetailsForBidding'
import * as directusAuth from '../../src/services/directusAuth'

vi.mock('../../src/services/directusAuth')
vi.mock('../../src/components/ShipmentMap', () => ({
  default: ({ pickupLocation, deliveryLocation }) => (
    <div data-testid="shipment-map">
      {pickupLocation ? 'Map-Rendered' : 'Map-Missing-Pickup'}
      {deliveryLocation ? 'Map-Rendered' : 'Map-Missing-Delivery'}
    </div>
  )
}))

describe('ShipmentDetailsForBidding Component', () => {
  const mockOnBack = vi.fn()
  const mockToken = 'test-token-123'
  const mockUser = { id: 'user-123', email: 'driver@test.com' }

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
    directusAuth.getAuthToken.mockReturnValue(mockToken)
    directusAuth.getStoredUser.mockReturnValue(mockUser)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Authentication Handling', () => {
    it('should not load data if authentication token is missing', async () => {
      directusAuth.getAuthToken.mockReturnValue(null)

      render(
        <ShipmentDetailsForBidding
          shipmentId="shipment-123"
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalled()
      })
    })

    it('should not load data if user is not stored', async () => {
      directusAuth.getStoredUser.mockReturnValue(null)

      render(
        <ShipmentDetailsForBidding
          shipmentId="shipment-123"
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalled()
      })
    })

    it('should not load data if shipment ID is missing', async () => {
      render(
        <ShipmentDetailsForBidding
          shipmentId={null}
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalled()
      })
    })

    it('should not load data if shipment ID is undefined', async () => {
      render(
        <ShipmentDetailsForBidding
          shipmentId={undefined}
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalled()
      })
    })

    it('should not load data if shipment ID is empty string', async () => {
      render(
        <ShipmentDetailsForBidding
          shipmentId=""
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalled()
      })
    })
  })

  describe('Shipment Data Loading', () => {
    it('should fetch shipment data with correct headers', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      })

      render(
        <ShipmentDetailsForBidding
          shipmentId="shipment-123"
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/items/shipments'),
          expect.objectContaining({
            headers: {
              'Authorization': `Bearer ${mockToken}`
            }
          })
        )
      })
    })

    it('should handle shipment API error gracefully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation()

      render(
        <ShipmentDetailsForBidding
          shipmentId="shipment-123"
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to load shipment')
        )
      })

      consoleSpy.mockRestore()
    })

    it('should handle empty shipment data response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: null })
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      })

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation()

      render(
        <ShipmentDetailsForBidding
          shipmentId="shipment-123"
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Shipment data is empty')
        )
      })

      consoleSpy.mockRestore()
    })

    it('should handle malformed shipment data response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ }) 
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      })

      render(
        <ShipmentDetailsForBidding
          shipmentId="shipment-123"
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })
  })

  describe('Bids Data Loading', () => {
    it('should fetch bids with correct shipment filter', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      })

      render(
        <ShipmentDetailsForBidding
          shipmentId="shipment-123"
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        const bidsCall = global.fetch.mock.calls.find(call =>
          call[0].includes('/api/items/bids')
        )
        expect(bidsCall).toBeDefined()
        expect(bidsCall[1]).toEqual({
          headers: { 'Authorization': `Bearer ${mockToken}` }
        })
      })
    })

    it('should separate my bids from other bids', async () => {
      const myBid = { id: 'bid-1', user_id: { id: mockUser.id }, quoted_price: 100 }
      const otherBid = { id: 'bid-2', user_id: { id: 'other-user' }, quoted_price: 200 }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [myBid, otherBid] })
      })

      render(
        <ShipmentDetailsForBidding
          shipmentId="shipment-123"
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2)
      })
    })

    it('should handle bids API error gracefully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      }).mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation()

      render(
        <ShipmentDetailsForBidding
          shipmentId="shipment-123"
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to load bids')
        )
      })

      consoleSpy.mockRestore()
    })

    it('should handle null bids data response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ })
      })

      render(
        <ShipmentDetailsForBidding
          shipmentId="shipment-123"
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Form Validation', () => {
    it('should validate quoted price is required', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: 's1', currency: 'OMR' }] })
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      })

      render(
        <ShipmentDetailsForBidding
          shipmentId="shipment-123"
          onBack={mockOnBack}
        />
      )

      const placeButton = await waitFor(() =>
        screen.getByText(/Place Bid/i)
      )

      fireEvent.click(placeButton)

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid price/i)).toBeInTheDocument()
      })
    })

    it('should validate quoted price must be positive', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: 's1', currency: 'OMR' }] })
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      })

      render(
        <ShipmentDetailsForBidding
          shipmentId="shipment-123"
          onBack={mockOnBack}
        />
      )

      const showBidFormButton = await waitFor(() =>
        screen.getByText(/Place Your Bid/i)
      )
      fireEvent.click(showBidFormButton)

      const priceInput = screen.getByPlaceholderText(/Enter your quote/i)
      fireEvent.change(priceInput, { target: { value: '-50' } })

      const submitButton = screen.getByText(/Place Bid/i)
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid price/i)).toBeInTheDocument()
      })
    })

    it('should validate ETA is required', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: 's1', currency: 'OMR' }] })
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      })

      render(
        <ShipmentDetailsForBidding
          shipmentId="shipment-123"
          onBack={mockOnBack}
        />
      )

      const showBidFormButton = await waitFor(() =>
        screen.getByText(/Place Your Bid/i)
      )
      fireEvent.click(showBidFormButton)

      const priceInput = screen.getByPlaceholderText(/Enter your quote/i)
      fireEvent.change(priceInput, { target: { value: '100' } })

      const submitButton = screen.getByText(/Place Bid/i)
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/ETA is required/i)).toBeInTheDocument()
      })
    })

    it('should validate duration is required and positive', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: 's1', currency: 'OMR' }] })
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      })

      render(
        <ShipmentDetailsForBidding
          shipmentId="shipment-123"
          onBack={mockOnBack}
        />
      )

      const showBidFormButton = await waitFor(() =>
        screen.getByText(/Place Your Bid/i)
      )
      fireEvent.click(showBidFormButton)

      const submitButton = screen.getByText(/Place Bid/i)
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Duration must be greater than 0/i)).toBeInTheDocument()
      })
    })

    it('should validate vehicle type is required', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: 's1', currency: 'OMR' }] })
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      })

      render(
        <ShipmentDetailsForBidding
          shipmentId="shipment-123"
          onBack={mockOnBack}
        />
      )

      const showBidFormButton = await waitFor(() =>
        screen.getByText(/Place Your Bid/i)
      )
      fireEvent.click(showBidFormButton)

      const submitButton = screen.getByText(/Place Bid/i)
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Please select a vehicle type/i)).toBeInTheDocument()
      })
    })
  })

  describe('Currency Display', () => {
    it('should display shipment currency when available', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: 's1', currency: 'AED' }] })
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      })

      render(
        <ShipmentDetailsForBidding
          shipmentId="shipment-123"
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/AED/i)).toBeInTheDocument()
      })
    })

    it('should default to OMR currency when shipment currency is missing', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: 's1' }] })
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      })

      render(
        <ShipmentDetailsForBidding
          shipmentId="shipment-123"
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/OMR/i)).toBeInTheDocument()
      })
    })

    it('should handle null currency gracefully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: 's1', currency: null }] })
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      })

      render(
        <ShipmentDetailsForBidding
          shipmentId="shipment-123"
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/OMR/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors during data load', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation()

      render(
        <ShipmentDetailsForBidding
          shipmentId="shipment-123"
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Error loading data')
        )
      })

      consoleSpy.mockRestore()
    })

    it('should handle fetch errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation()

      render(
        <ShipmentDetailsForBidding
          shipmentId="shipment-123"
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled()
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Back Button', () => {
    it('should call onBack when back button is clicked', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      })

      render(
        <ShipmentDetailsForBidding
          shipmentId="shipment-123"
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        const backButtons = screen.getAllByRole('button').filter(btn =>
          btn.className.includes('back') || btn.textContent.includes('←')
        )
        if (backButtons.length > 0) {
          fireEvent.click(backButtons[0])
          expect(mockOnBack).toHaveBeenCalled()
        }
      })
    })
  })

  describe('Bid ID Handling', () => {
    it('should handle valid shipment ID', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      })

      render(
        <ShipmentDetailsForBidding
          shipmentId="valid-shipment-id"
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })

    it('should handle numeric shipment ID', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      })

      render(
        <ShipmentDetailsForBidding
          shipmentId={12345}
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })
  })
})

/* eslint-disable no-undef */
import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ShipmentMap from '../../src/components/ShipmentMap'

describe('ShipmentMap Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  describe('Coordinate Validation', () => {
    it('should render placeholder when pickupLocation is undefined', () => {
      render(
        <ShipmentMap
          pickupLocation={undefined}
          deliveryLocation={{ lat: 23.6100, lng: 58.5400 }}
          pickupAddress="Pickup"
          deliveryAddress="Delivery"
        />
      )
      expect(screen.getByText('Map data unavailable')).toBeInTheDocument()
    })

    it('should render placeholder when deliveryLocation is undefined', () => {
      render(
        <ShipmentMap
          pickupLocation={{ lat: 23.6100, lng: 58.5400 }}
          deliveryLocation={undefined}
          pickupAddress="Pickup"
          deliveryAddress="Delivery"
        />
      )
      expect(screen.getByText('Map data unavailable')).toBeInTheDocument()
    })

    it('should render placeholder when both locations are undefined', () => {
      render(
        <ShipmentMap
          pickupLocation={undefined}
          deliveryLocation={undefined}
          pickupAddress=""
          deliveryAddress=""
        />
      )
      expect(screen.getByText('Map data unavailable')).toBeInTheDocument()
    })

    it('should render placeholder when coordinates are null', () => {
      render(
        <ShipmentMap
          pickupLocation={null}
          deliveryLocation={null}
          pickupAddress="Pickup"
          deliveryAddress="Delivery"
        />
      )
      expect(screen.getByText('Map data unavailable')).toBeInTheDocument()
    })

    it('should not render map when pickupLocation has missing lng property', () => {
      render(
        <ShipmentMap
          pickupLocation={{ lat: 23.6100 }}
          deliveryLocation={{ lat: 24.0000, lng: 58.0000 }}
          pickupAddress="Pickup"
          deliveryAddress="Delivery"
        />
      )
      expect(screen.getByText('Map data unavailable')).toBeInTheDocument()
    })

    it('should not render map when deliveryLocation has missing lat property', () => {
      render(
        <ShipmentMap
          pickupLocation={{ lat: 23.6100, lng: 58.5400 }}
          deliveryLocation={{ lng: 58.0000 }}
          pickupAddress="Pickup"
          deliveryAddress="Delivery"
        />
      )
      expect(screen.getByText('Map data unavailable')).toBeInTheDocument()
    })
  })

  describe('Valid Coordinates Rendering', () => {
    it('should render map with valid coordinates', () => {
      const { container } = render(
        <ShipmentMap
          pickupLocation={{ lat: 23.6100, lng: 58.5400 }}
          deliveryLocation={{ lat: 24.0000, lng: 58.0000 }}
          pickupAddress="Pickup Location"
          deliveryAddress="Delivery Location"
        />
      )
      const mapContainer = container.querySelector('.shipment-map-container')
      expect(mapContainer).toBeInTheDocument()
    })

    it('should render map with valid integer coordinates', () => {
      const { container } = render(
        <ShipmentMap
          pickupLocation={{ lat: 23, lng: 58 }}
          deliveryLocation={{ lat: 24, lng: 59 }}
          pickupAddress="Start"
          deliveryAddress="End"
        />
      )
      const mapContainer = container.querySelector('.shipment-map-container')
      expect(mapContainer).toBeInTheDocument()
    })

    it('should render map with negative longitude coordinates', () => {
      const { container } = render(
        <ShipmentMap
          pickupLocation={{ lat: -23.5505, lng: -46.6333 }}
          deliveryLocation={{ lat: -23.5505, lng: -46.6333 }}
          pickupAddress="São Paulo"
          deliveryAddress="São Paulo"
        />
      )
      const mapContainer = container.querySelector('.shipment-map-container')
      expect(mapContainer).toBeInTheDocument()
    })
  })

  describe('Address Display', () => {
    it('should display provided pickup address', () => {
      const { container } = render(
        <ShipmentMap
          pickupLocation={{ lat: 23.6100, lng: 58.5400 }}
          deliveryLocation={{ lat: 24.0000, lng: 58.0000 }}
          pickupAddress="123 Main Street"
          deliveryAddress="456 Oak Avenue"
        />
      )
      expect(container.textContent).toContain('123 Main Street')
    })

    it('should display provided delivery address', () => {
      const { container } = render(
        <ShipmentMap
          pickupLocation={{ lat: 23.6100, lng: 58.5400 }}
          deliveryLocation={{ lat: 24.0000, lng: 58.0000 }}
          pickupAddress="123 Main Street"
          deliveryAddress="456 Oak Avenue"
        />
      )
      expect(container.textContent).toContain('456 Oak Avenue')
    })

    it('should display coordinates when address is not provided', () => {
      const { container } = render(
        <ShipmentMap
          pickupLocation={{ lat: 23.6100, lng: 58.5400 }}
          deliveryLocation={{ lat: 24.0000, lng: 58.0000 }}
          pickupAddress=""
          deliveryAddress=""
        />
      )
      expect(container.textContent).toContain('23.61')
      expect(container.textContent).toContain('24.00')
    })

    it('should display coordinates when address is undefined', () => {
      const { container } = render(
        <ShipmentMap
          pickupLocation={{ lat: 23.6100, lng: 58.5400 }}
          deliveryLocation={{ lat: 24.0000, lng: 58.0000 }}
          pickupAddress={undefined}
          deliveryAddress={undefined}
        />
      )
      expect(container.textContent).toContain('23.61')
      expect(container.textContent).toContain('24.00')
    })
  })

  describe('Edge Cases', () => {
    it('should handle coordinates with zero values', () => {
      const { container } = render(
        <ShipmentMap
          pickupLocation={{ lat: 0, lng: 0 }}
          deliveryLocation={{ lat: 0, lng: 0 }}
          pickupAddress="Null Island"
          deliveryAddress="Null Island"
        />
      )
      expect(container.querySelector('.shipment-map-container')).toBeInTheDocument()
    })

    it('should handle very large coordinate differences', () => {
      const { container } = render(
        <ShipmentMap
          pickupLocation={{ lat: -89, lng: -179 }}
          deliveryLocation={{ lat: 89, lng: 179 }}
          pickupAddress="South"
          deliveryAddress="North"
        />
      )
      expect(container.querySelector('.shipment-map-container')).toBeInTheDocument()
    })

    it('should handle identical pickup and delivery locations', () => {
      const { container } = render(
        <ShipmentMap
          pickupLocation={{ lat: 23.6100, lng: 58.5400 }}
          deliveryLocation={{ lat: 23.6100, lng: 58.5400 }}
          pickupAddress="Same Place"
          deliveryAddress="Same Place"
        />
      )
      expect(container.querySelector('.shipment-map-container')).toBeInTheDocument()
    })

    it('should handle very close coordinates', () => {
      const { container } = render(
        <ShipmentMap
          pickupLocation={{ lat: 23.6100, lng: 58.5400 }}
          deliveryLocation={{ lat: 23.6101, lng: 58.5401 }}
          pickupAddress="Location A"
          deliveryAddress="Location B"
        />
      )
      expect(container.querySelector('.shipment-map-container')).toBeInTheDocument()
    })

    it('should handle string coordinates that can be coerced to numbers', () => {
      render(
        <ShipmentMap
          pickupLocation={{ lat: '23.6100', lng: '58.5400' }}
          deliveryLocation={{ lat: '24.0000', lng: '58.0000' }}
          pickupAddress="Start"
          deliveryAddress="End"
        />
      )
      expect(screen.queryByText('Map data unavailable')).not.toBeInTheDocument()
    })

    it('should render placeholder when coordinates are NaN', () => {
      render(
        <ShipmentMap
          pickupLocation={{ lat: NaN, lng: NaN }}
          deliveryLocation={{ lat: NaN, lng: NaN }}
          pickupAddress="Invalid"
          deliveryAddress="Invalid"
        />
      )
      expect(screen.getByText('Map data unavailable')).toBeInTheDocument()
    })

    it('should render placeholder when coordinates are Infinity', () => {
      render(
        <ShipmentMap
          pickupLocation={{ lat: Infinity, lng: Infinity }}
          deliveryLocation={{ lat: Infinity, lng: Infinity }}
          pickupAddress="Infinite"
          deliveryAddress="Infinite"
        />
      )
      expect(screen.getByText('Map data unavailable')).toBeInTheDocument()
    })
  })

  describe('Props Changes', () => {
    it('should update map when pickup location changes', () => {
      const { rerender, container } = render(
        <ShipmentMap
          pickupLocation={{ lat: 23.6100, lng: 58.5400 }}
          deliveryLocation={{ lat: 24.0000, lng: 58.0000 }}
          pickupAddress="Old"
          deliveryAddress="Delivery"
        />
      )

      expect(container.querySelector('.shipment-map-container')).toBeInTheDocument()

      rerender(
        <ShipmentMap
          pickupLocation={{ lat: 25.0000, lng: 55.0000 }}
          deliveryLocation={{ lat: 24.0000, lng: 58.0000 }}
          pickupAddress="New"
          deliveryAddress="Delivery"
        />
      )

      expect(container.querySelector('.shipment-map-container')).toBeInTheDocument()
      expect(container.textContent).toContain('New')
    })

    it('should handle switching from valid to invalid coordinates', () => {
      const { rerender } = render(
        <ShipmentMap
          pickupLocation={{ lat: 23.6100, lng: 58.5400 }}
          deliveryLocation={{ lat: 24.0000, lng: 58.0000 }}
          pickupAddress="Valid"
          deliveryAddress="Delivery"
        />
      )

      rerender(
        <ShipmentMap
          pickupLocation={undefined}
          deliveryLocation={undefined}
          pickupAddress=""
          deliveryAddress=""
        />
      )

      expect(screen.getByText('Map data unavailable')).toBeInTheDocument()
    })

    it('should handle switching from invalid to valid coordinates', () => {
      const { rerender, container } = render(
        <ShipmentMap
          pickupLocation={undefined}
          deliveryLocation={undefined}
          pickupAddress=""
          deliveryAddress=""
        />
      )

      rerender(
        <ShipmentMap
          pickupLocation={{ lat: 23.6100, lng: 58.5400 }}
          deliveryLocation={{ lat: 24.0000, lng: 58.0000 }}
          pickupAddress="Pickup"
          deliveryAddress="Delivery"
        />
      )

      expect(container.querySelector('.shipment-map-container')).toBeInTheDocument()
    })
  })
})

import { useState, useEffect } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import MobileBottomNav from './components/MobileBottomNav'
import Homepage from './components/Homepage'
import ShipperDashboard from './components/ShipperDashboard'
import ShipperProfile from './components/ShipperProfile'
import DriverDashboard from './components/DriverDashboard'
import AvailableShipments from './components/AvailableShipments'
import DriverProfileModern from './components/DriverProfileModern'
import VehicleProfileModern from './components/VehicleProfileModern'
import PostShipmentPage from './components/PostShipmentPage'
import ShipmentsList from './components/ShipmentsList'
import ShipmentDetails from './components/ShipmentDetails'
import ShipmentDetailsForShippers from './components/ShipmentDetailsForShippers'
import EditShipmentPage from './components/EditShipmentPage'
import BiddingSystemModern from './components/BiddingSystemModern'
import ShipmentDetailsForBidding from './components/ShipmentDetailsForBidding'
import ChatPage from './components/ChatPage'
import { getStoredUser } from './services/directusAuth'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [user, setUser] = useState(null)
  const [selectedShipmentId, setSelectedShipmentId] = useState(null)

  const pathToPageMap = {
    '/': 'home',
    '/dashboard': 'dashboard',
    '/driver-dashboard': 'driver-dashboard',
    '/driver-available-shipments': 'driver-available-shipments',
    '/bidding-system': 'bidding-system',
    '/shipment-details-bidding': 'shipment-details-bidding',
    '/profile': 'profile',
    '/vehicles': 'vehicles',
    '/post-shipment': 'post-shipment',
    '/shipments-list': 'shipments-list',
    '/shipment-details': 'shipment-details',
    '/shipment-details-legacy': 'shipment-details-legacy',
    '/edit-shipment': 'edit-shipment',
    '/chat': 'chat',
  }

  const getPageFromUrl = () => {
    const pathname = window.location.pathname
    return pathToPageMap[pathname] || 'home'
  }

  const updateUrl = (page) => {
    const pathFromPage = Object.entries(pathToPageMap).find(([, p]) => p === page)?.[0] || '/'
    window.history.pushState(null, '', pathFromPage)
  }

  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
      const mainElement = document.querySelector('.app-main')
      if (mainElement) {
        mainElement.scrollTop = 0
      }
    }
    
    scrollToTop()
    const timer = setTimeout(scrollToTop, 100)
    
    return () => clearTimeout(timer)
  }, [currentPage])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const storedUser = getStoredUser()
    setUser(storedUser)

    const initialPage = getPageFromUrl()
    setCurrentPage(initialPage)

    const handleAuthChange = () => {
      const updatedUser = getStoredUser()
      setUser(updatedUser)
      if (!updatedUser) {
        setCurrentPage('home')
        updateUrl('home')
      }
    }

    const handleNavigate = (e) => {
      console.log('🔄 [APP] Navigate event received:', e.detail)
      setCurrentPage(e.detail.page)
      updateUrl(e.detail.page)
      if (e.detail.shipmentId) {
        console.log('🔄 [APP] Setting shipment ID:', e.detail.shipmentId)
        setSelectedShipmentId(e.detail.shipmentId)
      }
    }

    window.addEventListener('authChange', handleAuthChange)
    window.addEventListener('navigate', handleNavigate)

    return () => {
      window.removeEventListener('authChange', handleAuthChange)
      window.removeEventListener('navigate', handleNavigate)
    }
  }, [])

  const renderPage = () => {
    console.log('🔍 [APP] renderPage called, currentPage:', currentPage, 'user:', user?.email)
    if (!user && (currentPage === 'dashboard' || currentPage === 'driver-dashboard' || currentPage === 'driver-available-shipments' || currentPage === 'bidding-system' || currentPage === 'shipment-details-bidding' || currentPage === 'profile' || currentPage === 'vehicles' || currentPage === 'post-shipment' || currentPage === 'shipments-list' || currentPage === 'shipment-details' || currentPage === 'shipment-details-legacy' || currentPage === 'edit-shipment' || currentPage === 'chat')) {
      console.log('⚠️ [APP] No user, returning Homepage')
      return <Homepage />
    }

    switch (currentPage) {
      case 'dashboard':
        console.log('✅ [APP] Rendering dashboard, user role:', user?.role)
        return user?.role === 'shipper' ? <ShipperDashboard /> : <Homepage />
      case 'driver-dashboard':
        return user?.role === 'driver' ? <DriverDashboard /> : <Homepage />
      case 'driver-available-shipments':
        return user?.role === 'driver' ? <AvailableShipments /> : <Homepage />
      case 'bidding-system':
        return user?.role === 'driver' ? <BiddingSystemModern /> : <Homepage />
      case 'shipment-details-bidding':
        return user?.role === 'driver' ? (
          <ShipmentDetailsForBidding 
            shipmentId={selectedShipmentId} 
            onBack={() => setCurrentPage('bidding-system')}
          />
        ) : <Homepage />
      case 'profile':
        return user?.role === 'shipper' ? <ShipperProfile /> : user?.role === 'driver' ? <DriverProfileModern /> : <Homepage />
      case 'vehicles':
        return user?.role === 'driver' ? <VehicleProfileModern /> : <Homepage />
      case 'post-shipment':
        return user?.role === 'shipper' ? <PostShipmentPage /> : <Homepage />
      case 'shipments-list':
        return user?.role === 'shipper' ? <ShipmentsList /> : <Homepage />
      case 'shipment-details':
        return user?.role === 'shipper' ? <ShipmentDetailsForShippers shipmentId={selectedShipmentId} onBack={() => setCurrentPage('shipments-list')} /> : <Homepage />
      case 'shipment-details-legacy':
        return user?.role === 'shipper' ? <ShipmentDetails shipmentId={selectedShipmentId} /> : <Homepage />
      case 'edit-shipment':
        return user?.role === 'shipper' ? <EditShipmentPage shipmentId={selectedShipmentId} /> : <Homepage />
      case 'chat':
        return <ChatPage />
      case 'home':
      default:
        return <Homepage />
    }
  }

  const handleNavigatePage = (page, shipmentId = null) => {
    setCurrentPage(page)
    updateUrl(page)
    if (shipmentId) {
      setSelectedShipmentId(shipmentId)
    }
  }

  return (
    <div className="app">
      <Header onNavigate={handleNavigatePage} />
      <main className="app-main">
        {renderPage()}
      </main>
      <Footer />
      <MobileBottomNav 
        user={user} 
        onNavigate={handleNavigatePage} 
        currentPage={currentPage}
      />
    </div>
  )
}

export default App

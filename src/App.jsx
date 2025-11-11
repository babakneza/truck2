import Header from './components/Header'
import Footer from './components/Footer'
import Homepage from './components/Homepage'
import './App.css'

function App() {
  return (
    <div className="app">
      <Header />
      <main className="app-main">
        <Homepage />
      </main>
      <Footer />
    </div>
  )
}

export default App

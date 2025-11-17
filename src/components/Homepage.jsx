import { useState } from 'react'
import './Homepage.css'

export default function Homepage() {
  const [activeTab, setActiveTab] = useState('shipper')

  return (
    <div className="homepage">
      <section className="hero-mobile">
        <div className="hero-content">
          <div className="hero-badge">🚀 New Era of Logistics</div>
          <h1 className="hero-title">
            Complete Transparency.<br />
            <span className="gradient-text">Perfect Trust.</span>
          </h1>
          <p className="hero-subtitle">
            No middlemen. No hidden fees. Shippers and drivers work directly together.
          </p>
        </div>
      </section>

      <section className="trust-indicators">
        <div className="trust-item">
          <div className="trust-icon">✓</div>
          <div className="trust-content">
            <h3>No Middlemen</h3>
            <p>Direct Connection</p>
          </div>
        </div>
        <div className="trust-item">
          <div className="trust-icon">💰</div>
          <div className="trust-content">
            <h3>Fair Pricing</h3>
            <p>No Hidden Fees</p>
          </div>
        </div>
        <div className="trust-item">
          <div className="trust-icon">🔒</div>
          <div className="trust-content">
            <h3>Secure & Safe</h3>
            <p>Full Encryption</p>
          </div>
        </div>
      </section>

      <section className="role-selector">
        <h2>What Are You?</h2>
        <div className="role-tabs">
          <button
            className={`role-tab ${activeTab === 'shipper' ? 'active' : ''}`}
            onClick={() => setActiveTab('shipper')}
          >
            <span className="role-icon">📦</span>
            <span className="role-label">Shipper</span>
          </button>
          <button
            className={`role-tab ${activeTab === 'driver' ? 'active' : ''}`}
            onClick={() => setActiveTab('driver')}
          >
            <span className="role-icon">🚚</span>
            <span className="role-label">Driver</span>
          </button>
        </div>

        <div className={`role-content ${activeTab === 'shipper' ? 'active' : ''}`}>
          <h3>For Shippers</h3>
          <ul className="features-list">
            <li>
              <span className="check">✓</span>
              Post shipments in minutes
            </li>
            <li>
              <span className="check">✓</span>
              Get bids from verified drivers
            </li>
            <li>
              <span className="check">✓</span>
              Choose the best price & terms
            </li>
            <li>
              <span className="check">✓</span>
              Real-time delivery tracking
            </li>
            <li>
              <span className="check">✓</span>
              Direct chat with drivers
            </li>
          </ul>
        </div>

        <div className={`role-content ${activeTab === 'driver' ? 'active' : ''}`}>
          <h3>For Drivers</h3>
          <ul className="features-list">
            <li>
              <span className="check">✓</span>
              Quick and easy verification
            </li>
            <li>
              <span className="check">✓</span>
              Browse all available shipments
            </li>
            <li>
              <span className="check">✓</span>
              Submit your bids
            </li>
            <li>
              <span className="check">✓</span>
              Get paid immediately after delivery
            </li>
            <li>
              <span className="check">✓</span>
              Build your trusted reputation
            </li>
          </ul>
        </div>
      </section>

      <section className="how-works">
        <h2>How It Works</h2>
        
        <div className="process-steps">
          <div className="step">
            <div className="step-number">1</div>
            <h4>Sign Up</h4>
            <p>Quick verification</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h4>Browse</h4>
            <p>Find opportunities</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h4>Connect</h4>
            <p>Chat & negotiate</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h4>Complete</h4>
            <p>Deliver & get paid</p>
          </div>
        </div>
      </section>

      <section className="pricing-example">
        <h2>Transparent Pricing</h2>
        <p className="section-subtitle">Real example: Muscat to Salalah delivery</p>
        
        <div className="price-box">
          <div className="price-item">
            <span className="price-label">Distance</span>
            <span className="price-value">500 km</span>
          </div>
          <div className="price-item">
            <span className="price-label">Driver Rate</span>
            <span className="price-value highlight">OMR 250</span>
          </div>
          <div className="price-item">
            <span className="price-label">Delivery Insurance</span>
            <span className="price-value">OMR 30</span>
          </div>
          <div className="price-item">
            <span className="price-label">Platform Fee (5%)</span>
            <span className="price-value">OMR 14</span>
          </div>
          <div className="price-divider"></div>
          <div className="price-item total">
            <span className="price-label">Total for Shipper</span>
            <span className="price-value">OMR 294</span>
          </div>
        </div>

        <p className="price-note">
          ⭐ Driver receives full OMR 250. All fees are transparent and visible.
        </p>
      </section>

      <section className="why-us">
        <h2>Why Choose Us?</h2>
        
        <div className="why-grid">
          <div className="why-card">
            <div className="why-icon">🛡️</div>
            <h4>Secure</h4>
            <p>Your data is encrypted</p>
          </div>
          
          <div className="why-card">
            <div className="why-icon">⚡</div>
            <h4>Fast & Easy</h4>
            <p>Get started in 2 minutes</p>
          </div>
          
          <div className="why-card">
            <div className="why-icon">💬</div>
            <h4>Direct Contact</h4>
            <p>No unnecessary layers</p>
          </div>
          
          <div className="why-card">
            <div className="why-icon">📊</div>
            <h4>Transparent</h4>
            <p>All details visible</p>
          </div>
        </div>
      </section>

      <section className="social-proof">
        <h2>A New Standard</h2>
        <div className="proof-content">
          <p className="proof-text">
            We're building something different. A platform where trust isn't guaranteed by algorithms, but by transparency and direct accountability.
          </p>
        </div>
      </section>

      <section className="cta-section">
        <h2>Get Started Today</h2>
        <p>Join a community built on transparency and fairness</p>
        
        <div className="cta-buttons">
          <button className="btn btn-primary">
            Sign In / Sign Up
          </button>
          <button className="btn btn-secondary">
            Learn More
          </button>
        </div>
      </section>

      <section className="trust-section">
        <div className="trust-box">
          <h3>💡 Our Commitment</h3>
          <p>
            We're not just another platform. We're committed to building a fair and sustainable system for the logistics industry.
            <br /><br />
            <strong>No hidden charges. No lies. Only transparency and fairness.</strong>
          </p>
        </div>
      </section>
    </div>
  )
}

import './Homepage.css'

export default function Homepage() {
  return (
    <div className="homepage">
      <section className="hero">
        <div className="container hero-content">
          <h1 className="hero-title">Smart Logistics Network</h1>
          <p className="hero-subtitle">Connect with verified drivers or offer your delivery services. Real-time bidding, transparent pricing, reliable delivery.</p>
          
          <div className="hero-ctas">
            <button className="cta-primary">
              I Have a Shipment
            </button>
            <button className="cta-secondary">
              I'm a Driver
            </button>
          </div>
        </div>
      </section>

      <section className="trust-signals">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">250K+</div>
              <div className="stat-label">Shipments Delivered</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">50K+</div>
              <div className="stat-label">Active Drivers</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">4.8★</div>
              <div className="stat-label">Customer Satisfaction</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Live Support</div>
            </div>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <div className="container">
          <h2>How It Works</h2>
          
          <div className="how-grid">
            <div className="how-column">
              <h3>🚀 For Shippers</h3>
              <ol className="how-steps">
                <li>
                  <span className="step-num">1</span>
                  <div>
                    <strong>Post Your Shipment</strong>
                    <p>Enter package details, weight, and route</p>
                  </div>
                </li>
                <li>
                  <span className="step-num">2</span>
                  <div>
                    <strong>Set Your Budget</strong>
                    <p>Specify the price you're willing to pay</p>
                  </div>
                </li>
                <li>
                  <span className="step-num">3</span>
                  <div>
                    <strong>Receive Driver Bids</strong>
                    <p>Verified drivers submit their offers</p>
                  </div>
                </li>
                <li>
                  <span className="step-num">4</span>
                  <div>
                    <strong>Track in Real-Time</strong>
                    <p>Monitor your shipment from pickup to delivery</p>
                  </div>
                </li>
              </ol>
            </div>

            <div className="how-column">
              <h3>🚚 For Drivers</h3>
              <ol className="how-steps">
                <li>
                  <span className="step-num">1</span>
                  <div>
                    <strong>Get Verified</strong>
                    <p>Submit documents and complete background check</p>
                  </div>
                </li>
                <li>
                  <span className="step-num">2</span>
                  <div>
                    <strong>Set Your Availability</strong>
                    <p>Define your routes and carrying capacity</p>
                  </div>
                </li>
                <li>
                  <span className="step-num">3</span>
                  <div>
                    <strong>Browse & Bid on Shipments</strong>
                    <p>Find suitable jobs and submit competitive bids</p>
                  </div>
                </li>
                <li>
                  <span className="step-num">4</span>
                  <div>
                    <strong>Earn Money</strong>
                    <p>Get paid instantly after successful delivery</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2>Why Choose Truck2</h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔐</div>
              <h3>Secure & Safe</h3>
              <p>Protected payments and shipment insurance for every delivery</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">✨</div>
              <h3>Transparent Pricing</h3>
              <p>No hidden fees. All charges clearly disclosed upfront</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Quick & Easy</h3>
              <p>Get your first quote in just 30 seconds</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Verified Drivers</h3>
              <p>All drivers are thoroughly verified and rated by users</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Live Tracking</h3>
              <p>Track shipments with GPS and real-time location updates</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>24/7 Support</h3>
              <p>Our support team is always here to help</p>
            </div>
          </div>
        </div>
      </section>

      <section className="testimonials">
        <div className="container">
          <h2>Trusted by Thousands</h2>
          <p className="testimonials-subtitle">See what our users have to say about Truck2</p>
          
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-rating">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">"Great service and professional drivers. My shipments always arrive on time and in perfect condition. Highly recommended!"</p>
              <p className="testimonial-author">– Ahmed, E-commerce Seller</p>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-rating">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">"Best platform for drivers. I earn great money and the support team is always helpful. This platform has changed my business!"</p>
              <p className="testimonial-author">– Mohammed, Driver</p>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-rating">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">"Completely transparent, competitive rates, and excellent customer service. I couldn't run my business without Truck2."</p>
              <p className="testimonial-author">– Fatima, Logistics Manager</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-final">
        <div className="container cta-final-content">
          <h2>Ready to Get Started?</h2>
          <p>Join thousands of shippers and drivers making smart choices today</p>
          
          <div className="cta-final-buttons">
            <button className="cta-primary cta-large">Start as a Shipper</button>
            <button className="cta-secondary cta-large">Start as a Driver</button>
          </div>
        </div>
      </section>
    </div>
  )
}

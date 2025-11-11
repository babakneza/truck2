import './Footer.css'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h4>Truck2</h4>
          <p>Connecting shippers and drivers with trusted logistics solutions and competitive pricing</p>
        </div>

        <div className="footer-section">
          <h4>For Shippers</h4>
          <ul>
            <li><a href="#ship">Ship a Package</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>For Drivers</h4>
          <ul>
            <li><a href="#earn">Start Earning</a></li>
            <li><a href="#requirements">Requirements</a></li>
            <li><a href="#support">Support</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Legal</h4>
          <ul>
            <li><a href="#privacy">Privacy Policy</a></li>
            <li><a href="#terms">Terms of Service</a></li>
            <li><a href="#contact">Contact Us</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {currentYear} Truck2. All rights reserved.</p>
      </div>
    </footer>
  )
}

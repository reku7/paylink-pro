import { Link } from "react-router-dom";
import "./Home.css";

export default function Home() {
  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Accept Payments Easily with Our Platform</h1>
          <p>
            Create payment links, track transactions, and manage your business
            payments all in one place.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary">
              Get Started Free
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>Why Choose Our Platform</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Easy Payment Links</h3>
            <p>Create and share payment links in seconds.</p>
          </div>
          <div className="feature-card">
            <h3>Secure Transactions</h3>
            <p>Bank-level security for all your payments.</p>
          </div>
          <div className="feature-card">
            <h3>Real-time Tracking</h3>
            <p>Monitor all transactions in your dashboard.</p>
          </div>
          <div className="feature-card">
            <h3>Chapa Integration</h3>
            <p>Seamless integration with Chapa payment gateway.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to Get Started?</h2>
        <Link to="/register" className="btn btn-large btn-primary">
          Create Your Account Now
        </Link>
      </section>
    </div>
  );
}

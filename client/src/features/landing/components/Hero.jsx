import Icon from './Icon.jsx'
import ProductPreview from './ProductPreview.jsx'

function Hero() {
  return (
    <section id="top" className="hero-section" aria-labelledby="hero-title">
      <div className="landing-container hero-layout">
        <div className="hero-content">
          <p className="section-kicker hero-kicker">
            <span aria-hidden="true" /> Personal digital identity, made visible
          </p>
          <h1 id="hero-title">
            Own your <span>digital footprint.</span>
          </h1>
          <p className="hero-lead">
            Your accounts, subscriptions, permissions, breaches, and personal information are
            scattered across the internet. OwnTrace is being built to bring that fragmented
            identity into one clear, actionable view.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#development-status">
              Get Started
              <Icon name="arrow" className="button-icon" />
            </a>
            <a className="button button-secondary" href="#how-it-works">
              See how it works
            </a>
          </div>
          <p className="hero-trust-note">
            <Icon name="shield" className="trust-icon" />
            Designed around data minimization and least-privilege access.
          </p>
        </div>

        <ProductPreview />
      </div>
    </section>
  )
}

export default Hero

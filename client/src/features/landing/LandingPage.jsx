import { Link } from 'react-router-dom'

const productSteps = ['Discover', 'Understand', 'Prioritize', 'Act', 'Monitor']

function LandingPage() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <nav className="container site-nav d-flex align-items-center justify-content-between" aria-label="Primary navigation">
          <Link className="brand-link" to="/">
            <span className="brand-mark" aria-hidden="true" />
            OwnTrace
          </Link>
          <Link className="nav-link-foundation" to="/dashboard">
            Dashboard placeholder
          </Link>
        </nav>
      </header>

      <main className="landing-main">
        <div className="container hero-grid">
          <section className="hero-copy" aria-labelledby="landing-title">
            <p className="eyebrow">Project foundation</p>
            <h1 id="landing-title">
              Own your <span>digital footprint.</span>
            </h1>
            <p className="hero-description">
              OwnTrace is being built to help people discover where their digital identity exists,
              understand privacy risks, and take informed action from one place.
            </p>
            <div className="hero-actions">
              <a className="primary-link" href="https://github.com/Anas2694/owntrace">
                View repository
              </a>
              <Link className="secondary-link" to="/dashboard">
                View route placeholder
              </Link>
            </div>
          </section>

          <aside className="principle-card" aria-labelledby="product-principle-title">
            <h2 id="product-principle-title">Product principle</h2>
            <ol className="principle-list">
              {productSteps.map((step, index) => (
                <li key={step}>
                  <span className="step-number" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </main>
    </div>
  )
}

export default LandingPage

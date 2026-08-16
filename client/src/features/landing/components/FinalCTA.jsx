import Icon from './Icon.jsx'

function FinalCTA() {
  return (
    <section id="development-status" className="landing-section final-cta-section" aria-labelledby="final-cta-title">
      <div className="landing-container final-cta-panel">
        <div className="final-cta-content">
          <p className="section-kicker">Built for visibility and control</p>
          <h2 id="final-cta-title">See where your digital identity lives.</h2>
          <p id="development-status-copy">
            OwnTrace is currently in early development. Access will open when the first useful,
            privacy-conscious experience is ready.
          </p>
          <div className="final-cta-actions">
            <button className="button button-primary" type="button" disabled aria-describedby="development-status-copy">
              Get Started
              <span className="button-soon">Coming later</span>
            </button>
            <a className="button button-secondary" href="https://github.com/Anas2694/owntrace">
              Follow development
              <Icon name="arrow" className="button-icon" />
            </a>
          </div>
        </div>
        <div className="cta-identity-visual" aria-hidden="true">
          <span className="identity-ring ring-one" />
          <span className="identity-ring ring-two" />
          <span className="identity-ring ring-three" />
          <span className="identity-core">
            <span className="landing-brand-mark large"><span /></span>
          </span>
          <span className="identity-node node-one" />
          <span className="identity-node node-two" />
          <span className="identity-node node-three" />
        </div>
      </div>
    </section>
  )
}

export default FinalCTA

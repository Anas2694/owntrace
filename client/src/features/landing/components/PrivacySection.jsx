import Icon from './Icon.jsx'

const privacyPrinciples = [
  'Collect only what is necessary for a supported feature.',
  'Request the least-privilege access a connection requires.',
  'Prefer derived metadata when complete source content is unnecessary.',
  'Explain permissions in language people can understand.',
  'Protect sensitive tokens when integrations are introduced.',
  'Keep users in control of their connected data.',
]

function PrivacySection() {
  return (
    <section id="privacy" className="landing-section privacy-section" aria-labelledby="privacy-title">
      <div className="landing-container privacy-panel">
        <div className="privacy-copy">
          <p className="section-kicker">Privacy by direction, not decoration</p>
          <h2 id="privacy-title">Your privacy tool shouldn&apos;t become another data collector.</h2>
          <p>
            OwnTrace is being designed around data minimization and least-privilege access. The
            goal is to build useful context without creating an unnecessary archive of a user&apos;s
            digital life.
          </p>
          <div className="privacy-commitment">
            <Icon name="shield" />
            <div>
              <strong>Aligned incentives</strong>
              <span>No business model built on selling personal data.</span>
            </div>
          </div>
        </div>

        <ul className="privacy-principles">
          {privacyPrinciples.map((principle) => (
            <li key={principle}>
              <span className="principle-check" aria-hidden="true">✓</span>
              {principle}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default PrivacySection

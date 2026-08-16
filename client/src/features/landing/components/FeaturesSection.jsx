import Icon from './Icon.jsx'

const features = [
  {
    icon: 'accounts',
    title: 'Accounts',
    description: 'See services associated with your connected digital identities.',
  },
  {
    icon: 'subscriptions',
    title: 'Subscriptions',
    description: 'Surface recurring services and subscriptions that may have been forgotten.',
  },
  {
    icon: 'breaches',
    title: 'Breaches',
    description: 'Understand known security exposures tied to discovered accounts.',
  },
  {
    icon: 'connections',
    title: 'Connected Apps',
    description: 'Review applications connected to supported identity providers.',
  },
  {
    icon: 'permissions',
    title: 'Permissions',
    description: 'Understand access granted where platforms make that information available.',
  },
  {
    icon: 'actions',
    title: 'Privacy Actions',
    description: 'Turn findings into clear next steps instead of another list of warnings.',
  },
]

function FeaturesSection() {
  return (
    <section className="landing-section features-section" aria-labelledby="features-title">
      <div className="landing-container">
        <div className="section-heading centered-heading">
          <p className="section-kicker">A clearer inventory</p>
          <h2 id="features-title">Bring the pieces of your digital life together.</h2>
          <p>
            OwnTrace is being built to organize supported signals into one understandable view,
            without pretending every platform exposes the same level of access.
          </p>
        </div>

        <div className="feature-grid">
          {features.map((feature, index) => (
            <article className="feature-card" key={feature.title}>
              <div className="feature-card-topline">
                <span className="feature-icon">
                  <Icon name={feature.icon} />
                </span>
                <span className="feature-index">{String(index + 1).padStart(2, '0')}</span>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection

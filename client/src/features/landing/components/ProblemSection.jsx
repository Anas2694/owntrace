const fragments = [
  { className: 'fragment-one', label: 'Old accounts', detail: 'Where did I sign up?' },
  { className: 'fragment-two', label: 'Subscriptions', detail: 'What am I paying for?' },
  { className: 'fragment-three', label: 'App access', detail: 'Who still has access?' },
  { className: 'fragment-four', label: 'Breaches', detail: 'What was exposed?' },
]

function ProblemSection() {
  return (
    <section className="landing-section problem-section" aria-labelledby="problem-title">
      <div className="landing-container split-section problem-layout">
        <div className="section-copy">
          <p className="section-kicker">The problem</p>
          <h2 id="problem-title">Your digital identity is scattered everywhere.</h2>
          <p>
            Years of sign-ups leave pieces of your identity across services, inboxes, connected
            apps, and subscriptions. Over time, the full picture becomes almost impossible to see.
          </p>
          <ul className="compact-check-list">
            <li>Where you signed up</li>
            <li>What still has access</li>
            <li>What you are still paying for</li>
            <li>What deserves cleanup or protection</li>
          </ul>
        </div>

        <figure className="fragment-map">
          <figcaption className="visually-hidden">
            Illustration of scattered digital signals becoming organized in OwnTrace.
          </figcaption>
          {fragments.map((fragment) => (
            <div className={`fragment-card ${fragment.className}`} key={fragment.label}>
              <span className="fragment-status" aria-hidden="true" />
              <div>
                <strong>{fragment.label}</strong>
                <span>{fragment.detail}</span>
              </div>
            </div>
          ))}
          <div className="fragment-hub">
            <span className="landing-brand-mark large" aria-hidden="true">
              <span />
            </span>
            <strong>OwnTrace</strong>
            <span>One organized view</span>
          </div>
          <div className="fragment-connector connector-one" aria-hidden="true" />
          <div className="fragment-connector connector-two" aria-hidden="true" />
          <div className="fragment-connector connector-three" aria-hidden="true" />
          <div className="fragment-connector connector-four" aria-hidden="true" />
        </figure>
      </div>
    </section>
  )
}

export default ProblemSection

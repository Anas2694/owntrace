const productSteps = [
  { title: 'Discover', description: 'Build an inventory from connected and supported sources.' },
  { title: 'Understand', description: 'Turn fragmented technical signals into clear information.' },
  { title: 'Prioritize', description: 'Surface the issues that deserve attention first.' },
  { title: 'Act', description: 'Provide clear cleanup, security, and privacy actions.' },
  { title: 'Monitor', description: 'Eventually watch supported sources for meaningful changes.' },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="landing-section process-section" aria-labelledby="process-title">
      <div className="landing-container">
        <div className="section-heading process-heading">
          <div>
            <p className="section-kicker">How it works</p>
            <h2 id="process-title">From scattered signals to meaningful action.</h2>
          </div>
          <p>
            The product is designed around a simple flow that keeps findings understandable and
            useful—not overwhelming.
          </p>
        </div>

        <ol className="process-list">
          {productSteps.map((step, index) => (
            <li key={step.title}>
              <div className="process-number">{String(index + 1).padStart(2, '0')}</div>
              <div className="process-line" aria-hidden="true">
                <span />
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export default HowItWorks
